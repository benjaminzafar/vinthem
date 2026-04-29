import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';

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

export function toMediaProxyKeyUrl(key: string): string {
  return `/api/media?key=${encodeURIComponent(key)}`;
}

async function getBucketBinding(): Promise<BoundR2Bucket> {
  try {
    const bucket = (await getCloudflareContext({ async: true })).env.MEDIA_BUCKET;
    if (!bucket) {
      throw new Error('MEDIA_BUCKET binding is missing from the Cloudflare runtime.');
    }

    return bucket;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('MEDIA_BUCKET binding is unavailable in the Cloudflare runtime.');
  }
}

export async function hasMediaBucketBinding(): Promise<boolean> {
  try {
    await getBucketBinding();
    return true;
  } catch {
    return false;
  }
}

export class EdgeR2Client {
  async list(prefix: string = '', options: ListOptions = {}): Promise<R2ListResult> {
    const bucket = await getBucketBinding();
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

  async upload(path: string, buffer: ArrayBuffer | Uint8Array, contentType: string) {
    const bucket = await getBucketBinding();
    const body = buffer instanceof Uint8Array
      ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
      : buffer;

    await bucket.put(path, body, {
      httpMetadata: {
        contentType,
      },
    });

    return { success: true };
  }

  async delete(key: string) {
    const bucket = await getBucketBinding();
    await bucket.delete(key);
    return { success: true };
  }

  async getObject(key: string): Promise<R2ObjectResult> {
    const bucket = await getBucketBinding();
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
}

export async function getS3Client(): Promise<EdgeR2Client> {
  return new EdgeR2Client();
}
