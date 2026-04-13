import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  // CORS Configuration
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  // Rate limiting for API routes — 100 req/min per IP
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const max = 100;

    let current = requestCounts.get(ip);
    if (!current || now > current.resetTime) {
      current = { count: 0, resetTime: now + windowMs };
    }
    current.count += 1;
    requestCounts.set(ip, current);

    if (current.count > max) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: response.headers }
      );
    }
  }

  // Refresh Supabase session for all routes (required by @supabase/ssr)
  const { supabaseResponse } = await updateSession(request);

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
