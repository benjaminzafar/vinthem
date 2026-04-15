import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const API_RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

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

function getRequestKey(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous';

  return `${request.nextUrl.pathname}:${ip}`;
}

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const originAllowed = applyCorsHeaders(request, response);

  if (request.nextUrl.pathname.startsWith('/api') && !originAllowed) {
    return NextResponse.json({ error: 'CORS origin not allowed.' }, { status: 403 });
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    if (request.nextUrl.pathname.startsWith('/api') && !originAllowed) {
      return NextResponse.json({ error: 'CORS origin not allowed.' }, { status: 403 });
    }

    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  // Rate limiting for API routes — 100 req/min per path and IP
  if (request.nextUrl.pathname.startsWith('/api')) {
    const key = getRequestKey(request);
    const now = Date.now();

    let current = requestCounts.get(key);
    if (!current || now > current.resetTime) {
      current = { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    }
    current.count += 1;
    requestCounts.set(key, current);

    response.headers.set('X-RateLimit-Limit', String(API_RATE_LIMIT));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(API_RATE_LIMIT - current.count, 0)));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(current.resetTime / 1000)));

    if (current.count > API_RATE_LIMIT) {
      response.headers.set('Retry-After', String(Math.ceil((current.resetTime - now) / 1000)));
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: response.headers }
      );
    }
  }

  // Refresh Supabase session for all routes (required by @supabase/ssr)
  const { supabaseResponse, user, role } = await updateSession(request);

  // Guard admin routes
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

  // Copy CORS and rate-limit headers to supabase response
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
