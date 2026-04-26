import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, type RateLimitRule } from '@/lib/rate-limit';
import {
  DEFAULT_LANGUAGE,
  extractLanguageFromPathname,
  isSearchEngineBot,
  normalizeLocalizedPath,
  resolvePreferredLanguage,
  stripLanguageFromPathname,
} from '@/lib/i18n-routing';
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

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function isStaticAssetPath(pathname: string) {
  return /\.[a-z0-9]+$/i.test(pathname);
}

function shouldBypassLocaleRouting(pathname: string) {
  return (
    pathname.startsWith('/api')
    || pathname.startsWith('/admin')
    || pathname.startsWith('/_next')
    || pathname === '/favicon.ico'
    || pathname.startsWith('/auth/callback')
    || isStaticAssetPath(pathname)
  );
}

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
  ]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    sources.add(supabaseUrl);

    if (supabaseUrl.startsWith('https://')) {
      sources.add(`wss://${supabaseUrl.slice('https://'.length)}`);
    } else if (supabaseUrl.startsWith('http://')) {
      sources.add(`ws://${supabaseUrl.slice('http://'.length)}`);
    }
  }

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
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  response.headers.set('X-CSP-Nonce', nonce);
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
  
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://images.unsplash.com https://ui-avatars.com https://picsum.photos https://upload.wikimedia.org https://*.supabase.co https://auth.vinthem.com https://*.r2.dev https://cdn.vinthem.com",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src ${buildScriptSrc(nonce)}`,
      `connect-src ${buildConnectSrc(request)}`,
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "form-action 'self'",
      !isLocalhost ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join('; ')
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 1. Language Routing
  const userAgent = request.headers.get('user-agent');
  const geoCountry = request.headers.get('cf-ipcountry');
  const isBotRequest = isSearchEngineBot(userAgent);
  const detectedLocale = resolvePreferredLanguage(
    pathname,
    request.cookies.get('NEXT_LOCALE')?.value,
    geoCountry,
    request.headers.get('accept-language'),
  );
  const pathnameLocale = extractLanguageFromPathname(pathname);
  const normalizedPathname = pathnameLocale ? stripLanguageFromPathname(pathname) : pathname;

  if (!shouldBypassLocaleRouting(pathname)) {
    if (!pathnameLocale && !isBotRequest) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = normalizeLocalizedPath(pathname, detectedLocale);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.cookies.set('NEXT_LOCALE', detectedLocale, {
        path: '/',
        maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
        sameSite: 'lax',
      });
      return redirectResponse;
    }
  }

  // 2. Auth Session Update
  const { supabaseResponse, user, role } = await updateSession(request);

  // 3. Headers & Security
  const nonce = crypto.randomUUID().replace(/-/g, '');
  supabaseResponse.headers.set('x-csp-nonce', nonce);
  supabaseResponse.headers.set('x-active-locale', pathnameLocale ?? detectedLocale ?? DEFAULT_LANGUAGE);
  supabaseResponse.headers.set('x-pathname-no-locale', normalizedPathname);
  
  applyCorsHeaders(request, supabaseResponse);
  applySecurityHeaders(request, supabaseResponse, nonce);

  // 4. Rate Limiting
  const rateLimitRule = getRateLimitRule(normalizedPathname);
  const rateLimitResult = await checkRateLimit(getRequestKey(request), rateLimitRule);
  supabaseResponse.headers.set('X-RateLimit-Limit', String(rateLimitRule.limit));
  supabaseResponse.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  supabaseResponse.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));

  if (!rateLimitResult.allowed) {
    return new NextResponse('Too Many Requests', { status: 429, headers: supabaseResponse.headers });
  }

  // 5. Admin Protection
  const adminPath = normalizedPathname.startsWith('/admin') || normalizedPathname.startsWith('/api/admin');
  if (adminPath && (!user || role !== 'admin')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathnameLocale ? `/${pathnameLocale}/auth` : '/auth';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl, { headers: supabaseResponse.headers });
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|css|js|map|txt|xml|woff2?)).*)'],
};
export default middleware;
