import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createAdminClient } from '@/utils/supabase/server';

interface BoundR2Object {
  key: string;
  size: number;
  uploaded: Date;
  etag?: string;
  httpEtag?: string;
  body?: ReadableStream<Uint8Array> | null;
  httpMetadata?: {
    contentType?: string;
  } | null;
}

interface BoundR2ListResult {
  objects: BoundR2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes?: string[];
}

interface BoundR2Bucket {
  list(options?: {
    prefix?: string;
    delimiter?: string;
    cursor?: string;
    limit?: number;
  }): Promise<BoundR2ListResult>;
  get(key: string): Promise<BoundR2Object | null>;
  put(
    key: string,
    value: ArrayBuffer,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
    }
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

declare global {
  interface CloudflareEnv {
    MEDIA_BUCKET?: BoundR2Bucket;
  }
}

export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

interface ListOptions {
  continuationToken?: string;
  delimiter?: string;
  maxKeys?: number;
}

interface R2CommonPrefix {
  Prefix?: string;
}

interface R2ListObject {
  Key?: string;
  Size?: number;
  LastModified?: string;
}

interface R2ListResult {
  CommonPrefixes?: R2CommonPrefix[];
  Contents?: R2ListObject[];
  NextContinuationToken?: string;
}

interface R2ObjectResult {
  Body?: ReadableStream<Uint8Array> | null;
  ContentType?: string | null;
  ETag?: string | null;
}

const EMPTY_BODY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const AWS_ALGORITHM = 'AWS4-HMAC-SHA256';
const textEncoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : input;
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(bytes));
  return bytesToHex(new Uint8Array(digest));
}

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, textEncoder.encode(message));
  return new Uint8Array(signature);
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodePathSegments(path: string): string {
  return path
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeRfc3986(segment))
    .join('/');
}

function buildCanonicalQuery(params: Array<[string, string]>): string {
  return params
    .map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue);
      }

      return leftKey.localeCompare(rightKey);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function getXmlTagValues(xml: string, tagName: string): string[] {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'g');
  const matches: string[] = [];
  let currentMatch: RegExpExecArray | null = pattern.exec(xml);

  while (currentMatch) {
    matches.push(decodeXmlEntities(currentMatch[1]));
    currentMatch = pattern.exec(xml);
  }

  return matches;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getXmlSectionValues(xml: string, sectionName: string): string[] {
  const pattern = new RegExp(`<${sectionName}>([\\s\\S]*?)<\\/${sectionName}>`, 'g');
  const matches: string[] = [];
  let currentMatch: RegExpExecArray | null = pattern.exec(xml);

  while (currentMatch) {
    matches.push(currentMatch[1]);
    currentMatch = pattern.exec(xml);
  }

  return matches;
}

function parseListObjectsXml(xml: string): R2ListResult {
  const commonPrefixes = getXmlSectionValues(xml, 'CommonPrefixes').map((section) => ({
    Prefix: getXmlTagValues(section, 'Prefix')[0],
  }));

  const contents = getXmlSectionValues(xml, 'Contents').map((section) => ({
    Key: getXmlTagValues(section, 'Key')[0],
    Size: Number.parseInt(getXmlTagValues(section, 'Size')[0] || '0', 10),
    LastModified: getXmlTagValues(section, 'LastModified')[0],
  }));

  return {
    CommonPrefixes: commonPrefixes,
    Contents: contents,
    NextContinuationToken: getXmlTagValues(xml, 'NextContinuationToken')[0],
  };
}

async function buildSigningKey(secretAccessKey: string, dateStamp: string): Promise<Uint8Array> {
  const kDate = await hmacSha256(textEncoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, 'auto');
  const kService = await hmacSha256(kRegion, 's3');
  return hmacSha256(kService, 'aws4_request');
}

function getAmzDates(now: Date) {
  const isoString = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return {
    amzDate: isoString,
    dateStamp: isoString.slice(0, 8),
  };
}

function buildObjectUrl(credentials: R2Credentials, objectKey: string, query: string = '') {
  const encodedKey = encodePathSegments(objectKey);
  const pathname = `/${credentials.bucketName}/${encodedKey}`;
  return `https://${credentials.accountId}.r2.cloudflarestorage.com${pathname}${query}`;
}

async function createAuthHeaders(args: {
  credentials: R2Credentials;
  method: string;
  objectKey: string;
  queryParams?: Array<[string, string]>;
  payloadHash: string;
  extraHeaders?: Record<string, string>;
  now?: Date;
}) {
  const now = args.now ?? new Date();
  const { amzDate, dateStamp } = getAmzDates(now);
  const host = `${args.credentials.accountId}.r2.cloudflarestorage.com`;
  const extraHeaders = args.extraHeaders ?? {};

  const canonicalHeaders = new Map<string, string>([
    ['host', host],
    ['x-amz-content-sha256', args.payloadHash],
    ['x-amz-date', amzDate],
  ]);

  Object.entries(extraHeaders).forEach(([key, value]) => {
    canonicalHeaders.set(key.toLowerCase(), value.trim());
  });

  const sortedCanonicalHeaders = Array.from(canonicalHeaders.entries())
    .sort(([left], [right]) => left.localeCompare(right));

  const canonicalHeadersString = sortedCanonicalHeaders
    .map(([key, value]) => `${key}:${value}\n`)
    .join('');
  const signedHeaders = sortedCanonicalHeaders.map(([key]) => key).join(';');
  const canonicalQuery = buildCanonicalQuery(args.queryParams ?? []);
  const canonicalUri = `/${args.credentials.bucketName}/${encodePathSegments(args.objectKey)}`;

  const canonicalRequest = [
    args.method,
    canonicalUri,
    canonicalQuery,
    canonicalHeadersString,
    signedHeaders,
    args.payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    AWS_ALGORITHM,
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await buildSigningKey(args.credentials.secretAccessKey, dateStamp);
  const signature = bytesToHex(await hmacSha256(signingKey, stringToSign));
  const authorization = `${AWS_ALGORITHM} Credential=${args.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    amzDate,
    authorization,
    headers: Object.fromEntries(sortedCanonicalHeaders),
  };
}

async function parseErrorResponse(response: Response): Promise<string> {
  const rawText = await response.text();
  if (!rawText) {
    return `R2 request failed (${response.status})`;
  }

  const errorCode = getXmlTagValues(rawText, 'Code')[0];
  const errorMessage = getXmlTagValues(rawText, 'Message')[0];
  if (errorCode || errorMessage) {
    return [errorCode, errorMessage].filter(Boolean).join(': ');
  }

  return rawText;
}

/**
 * Fetches R2 credentials from the database.
 */
export async function getR2Credentials(): Promise<R2Credentials> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('integrations')
    .select('key, value')
    .in('key', ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']);

  if (error) {
    throw new Error(`Failed to load R2 integrations: ${error.message}`);
  }

  const integrations = data ?? [];
  const findValue = (key: string) => integrations.find((row) => row.key === key)?.value;
  const { maybeDecryptStoredValue } = await import('@/lib/integrations');

  const rawAccountId = (await maybeDecryptStoredValue(findValue('R2_ACCOUNT_ID') || '')).trim();

  let accountId = rawAccountId;
  if (accountId.includes('.r2.cloudflarestorage.com')) {
    const match = accountId.match(/https?:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
    if (match) {
      accountId = match[1];
    }
  } else if (accountId.startsWith('http')) {
    try {
      const url = new URL(accountId);
      accountId = url.hostname.split('.')[0];
    } catch {
      // Ignore malformed URL and keep original value for validation below.
    }
  }

  const credentials: R2Credentials = {
    accountId,
    accessKeyId: (await maybeDecryptStoredValue(findValue('R2_ACCESS_KEY_ID') || '')).trim(),
    secretAccessKey: (await maybeDecryptStoredValue(findValue('R2_SECRET_ACCESS_KEY') || '')).trim(),
    bucketName: (await maybeDecryptStoredValue(findValue('R2_BUCKET_NAME') || '')).trim(),
    publicUrl: (await maybeDecryptStoredValue(findValue('R2_PUBLIC_URL') || '')).trim().replace(/\/$/, ''),
  };

  if (
    credentials.accountId === 'DECRYPTION_FAILED'
    || credentials.accessKeyId === 'DECRYPTION_FAILED'
    || credentials.secretAccessKey === 'DECRYPTION_FAILED'
    || credentials.bucketName === 'DECRYPTION_FAILED'
  ) {
    throw new Error('[R2_CONFIG] Decryption failed for Cloudflare R2 credentials. This usually means the ENCRYPTION_SECRET in your production environment does not match the one used to save these settings. Please re-enter and save the credentials in the Integrations panel.');
  }

  if (!credentials.accountId) {
    throw new Error('[R2_CONFIG] Cloudflare R2 Account ID is missing. Please enter it in the Integrations panel.');
  }

  if (!credentials.bucketName) {
    throw new Error('[R2_CONFIG] Cloudflare R2 Bucket Name is missing. Please enter it in the Integrations panel.');
  }

  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    throw new Error('[R2_CONFIG] Cloudflare R2 access credentials are missing. Please enter them in the Integrations panel.');
  }

  return credentials;
}

export class EdgeR2Client {
  constructor(private readonly credentials: R2Credentials) {}

  private getBucketBinding(): BoundR2Bucket | null {
    try {
      return getCloudflareContext().env.MEDIA_BUCKET ?? null;
    } catch {
      return null;
    }
  }

  private async signedFetch(args: {
    method: string;
    objectKey: string;
    queryParams?: Array<[string, string]>;
    body?: Uint8Array;
    extraHeaders?: Record<string, string>;
  }): Promise<Response> {
    const payloadHash = args.body ? await sha256Hex(args.body) : EMPTY_BODY_HASH;
    const auth = await createAuthHeaders({
      credentials: this.credentials,
      method: args.method,
      objectKey: args.objectKey,
      queryParams: args.queryParams,
      payloadHash,
      extraHeaders: args.extraHeaders,
    });

    const canonicalQuery = buildCanonicalQuery(args.queryParams ?? []);
    const response = await fetch(buildObjectUrl(this.credentials, args.objectKey, canonicalQuery ? `?${canonicalQuery}` : ''), {
      method: args.method,
      headers: {
        ...auth.headers,
        Authorization: auth.authorization,
      },
      body: args.body ? toArrayBuffer(args.body) : undefined,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }

    return response;
  }

  async list(prefix: string = '', options: ListOptions = {}): Promise<R2ListResult> {
    const bucket = this.getBucketBinding();
    if (bucket) {
      const result = await bucket.list({
        prefix,
        delimiter: options.delimiter,
        cursor: options.continuationToken,
        limit: options.maxKeys,
      });

      return {
        CommonPrefixes: (result.delimitedPrefixes ?? []).map((delimitedPrefix) => ({
          Prefix: delimitedPrefix,
        })),
        Contents: result.objects.map((object) => ({
          Key: object.key,
          Size: object.size,
          LastModified: object.uploaded.toISOString(),
        })),
        NextContinuationToken: result.truncated ? result.cursor : undefined,
      };
    }

    const queryParams: Array<[string, string]> = [
      ['list-type', '2'],
      ['prefix', prefix],
    ];

    if (options.delimiter) {
      queryParams.push(['delimiter', options.delimiter]);
    }
    if (options.continuationToken) {
      queryParams.push(['continuation-token', options.continuationToken]);
    }
    if (typeof options.maxKeys === 'number') {
      queryParams.push(['max-keys', String(options.maxKeys)]);
    }

    const response = await this.signedFetch({
      method: 'GET',
      objectKey: '',
      queryParams,
    });

    const xml = await response.text();
    return parseListObjectsXml(xml);
  }

  async upload(path: string, buffer: ArrayBuffer | Uint8Array, contentType: string) {
    const bucket = this.getBucketBinding();
    if (bucket) {
      const body = buffer instanceof Uint8Array ? toArrayBuffer(buffer) : buffer;
      await bucket.put(path, body, {
        httpMetadata: {
          contentType,
        },
      });

      return { success: true };
    }

    const body = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    await this.signedFetch({
      method: 'PUT',
      objectKey: path,
      body,
      extraHeaders: {
        'content-type': contentType,
      },
    });

    return { success: true };
  }

  async delete(key: string) {
    const bucket = this.getBucketBinding();
    if (bucket) {
      await bucket.delete(key);
      return { success: true };
    }

    await this.signedFetch({
      method: 'DELETE',
      objectKey: key,
    });

    return { success: true };
  }

  async getObject(key: string): Promise<R2ObjectResult> {
    const bucket = this.getBucketBinding();
    if (bucket) {
      const object = await bucket.get(key);

      if (!object) {
        throw new Error('NoSuchKey');
      }

      return {
        Body: object.body,
        ContentType: object.httpMetadata?.contentType ?? null,
        ETag: object.httpEtag ?? object.etag ?? null,
      };
    }

    const response = await this.signedFetch({
      method: 'GET',
      objectKey: key,
    });

    return {
      Body: response.body,
      ContentType: response.headers.get('content-type'),
      ETag: response.headers.get('etag'),
    };
  }

  async getPresignedUrl(path: string, contentType: string, expiresIn: number = 900): Promise<string> {
    const now = new Date();
    const { amzDate, dateStamp } = getAmzDates(now);
    const host = `${this.credentials.accountId}.r2.cloudflarestorage.com`;
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const signedHeaders = 'content-type;host';
    const queryParams: Array<[string, string]> = [
      ['X-Amz-Algorithm', AWS_ALGORITHM],
      ['X-Amz-Credential', `${this.credentials.accessKeyId}/${credentialScope}`],
      ['X-Amz-Date', amzDate],
      ['X-Amz-Expires', String(expiresIn)],
      ['X-Amz-SignedHeaders', signedHeaders],
    ];

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
    const canonicalRequest = [
      'PUT',
      `/${this.credentials.bucketName}/${encodePathSegments(path)}`,
      buildCanonicalQuery(queryParams),
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      AWS_ALGORITHM,
      amzDate,
      credentialScope,
      await sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = await buildSigningKey(this.credentials.secretAccessKey, dateStamp);
    const signature = bytesToHex(await hmacSha256(signingKey, stringToSign));
    const finalQuery = buildCanonicalQuery([...queryParams, ['X-Amz-Signature', signature]]);

    return buildObjectUrl(this.credentials, path, `?${finalQuery}`);
  }
}

export async function getS3Client(): Promise<EdgeR2Client> {
  return new EdgeR2Client(await getR2Credentials());
}
