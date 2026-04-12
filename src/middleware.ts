import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const requestCounts = new Map<string, { count: number, resetTime: number }>();

export function middleware(request: NextRequest) {
  // CORS Configuration
  const origin = request.headers.get('Origin');
  
  // Create response
  const response = NextResponse.next();

  // Basic CORS headers
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*'); 
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  // Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const rateLimitConfig = { windowMs: 60 * 1000, max: 100 }; // 100 req per minute per IP

    let current = requestCounts.get(ip);
    
    if (!current || now > current.resetTime) {
      current = { count: 0, resetTime: now + rateLimitConfig.windowMs };
    }

    current.count += 1;
    requestCounts.set(ip, current);

    if (current.count > rateLimitConfig.max) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: response.headers }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
