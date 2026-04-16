import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, type RateLimitRule } from '@/lib/rate-limit';
import { updateSession } from '@/utils/supabase/middleware';

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;

const DEFAULT_RATE_LIMIT_RULE: RateLimitRule = {
  limit: 60,
  windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
};

const RATE_LIMIT_RULES: Array<{ matcher: RegExp; rule: RateLimitRule }> = [
  { matcher: /^\/api\/create-order$/, rule: { limit: 10, windowMs: 60 * 1000 } },
  { matcher: /^\/api\/upload(?:\/|$)/, rule: { limit: 12, windowMs: 60 * 1000 } },
  { matcher: /^\/api\/admin(?:\/|$)/, rule: { limit: 45, windowMs: 60 * 1000 } },
  { matcher: /^\/api(?:\/|$)/, rule: DEFAULT_RATE_LIMIT_RULE },
];

function getAllowedOrigins(request: NextRequest) {
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  return new Set([
    request.nextUrl.origin,
    process.env.NEXT_PUBLIC_SITE_URL,
    ...configuredOrigins,
  ].filter((origin): origin is string => Boolean(origin)));
}

function buildScriptSrc(nonce: string) {
  const sources = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://www.clarity.ms',
    'https://js.stripe.com',
  ];

  if (process.env.NODE_ENV !== 'production') {
    sources.push("'unsafe-eval'");
  }

  return sources.join(' ');
}

function buildConnectSrc(request: NextRequest) {
  const sources = new Set<string>([
    "'self'",
    request.nextUrl.origin,
    'https://vitals.vercel-insights.com',
    'https://region1.google-analytics.com',
    'https://www.google-analytics.com',
    'https://js.stripe.com',
    'https://api.stripe.com',
    'https://r.stripe.com',
    'https://q.stripe.com',
    'https://m.stripe.network',
    'https://www.clarity.ms',
    'https://*.clarity.ms',
    'https://*.posthog.com',
    'https://*.i.posthog.com',
    'wss://*.posthog.com',
    'wss://*.i.posthog.com',
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  ]);

  return Array.from(sources).filter(Boolean).join(' ');
}

function applyCorsHeaders(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins(request);

  response.headers.set('Vary', 'Origin');
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return !origin || allowedOrigins.has(origin);
}

function applySecurityHeaders(request: NextRequest, response: NextResponse, nonce: string) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('X-CSP-Nonce', nonce);
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://images.unsplash.com https://ui-avatars.com https://picsum.photos https://upload.wikimedia.org https://*.supabase.co https://*.r2.dev",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src ${buildScriptSrc(nonce)}`,
      `connect-src ${buildConnectSrc(request)}`,
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );
}

function getRateLimitRule(pathname: string): RateLimitRule {
  return RATE_LIMIT_RULES.find(({ matcher }) => matcher.test(pathname))?.rule ?? DEFAULT_RATE_LIMIT_RULE;
}

function getRequestKey(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous';
  const method = request.method.toUpperCase();
  const userAgent = request.headers.get('user-agent')?.slice(0, 120) ?? 'unknown-agent';

  return `${method}:${request.nextUrl.pathname}:${ip}:${userAgent}`;
}

export default async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const nonce = crypto.randomUUID().replace(/-/g, '');
  requestHeaders.set('x-csp-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  const originAllowed = applyCorsHeaders(request, response);
  applySecurityHeaders(request, response, nonce);

  if (request.nextUrl.pathname.startsWith('/api') && !originAllowed) {
    return NextResponse.json({ error: 'CORS origin not allowed.' }, { status: 403 });
  }

  if (request.method === 'OPTIONS') {
    if (request.nextUrl.pathname.startsWith('/api') && !originAllowed) {
      return NextResponse.json({ error: 'CORS origin not allowed.' }, { status: 403 });
    }

    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    const key = getRequestKey(request);
    const rule = getRateLimitRule(request.nextUrl.pathname);
    const rateLimit = await checkRateLimit(key, rule);

    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
    response.headers.set('X-RateLimit-Mode', rateLimit.mode);

    if (!rateLimit.allowed) {
      response.headers.set('Retry-After', String(Math.max(Math.ceil((rateLimit.resetTime - Date.now()) / 1000), 1)));
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: response.headers }
      );
    }
  }

  const { supabaseResponse, user, role } = await updateSession(request);

  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');
  if (isAdminPage || isAdminApi) {
    if (!user) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: response.headers });
      }

      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (role !== 'admin') {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: response.headers });
      }

      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  response.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value);
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
