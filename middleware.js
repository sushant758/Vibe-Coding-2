import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dumka-sports-academy-secret-key-32chars');

const publicPaths = ['/login', '/api/auth/login'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'
  ) {
    // If logged in and hitting /login or /, redirect to dashboard
    if (pathname === '/login' || pathname === '/') {
      const token = request.cookies.get('token')?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, JWT_SECRET());
          const redirectMap = {
            coach: '/coach/dashboard',
            scout: '/scout',
            player: '/player',
          };
          return NextResponse.redirect(
            new URL(redirectMap[payload.role] || '/login', request.url)
          );
        } catch {
          // Invalid token, let them through to login
        }
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());

    // Role-based page protection
    if (pathname.startsWith('/coach') && payload.role !== 'coach') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/scout') && payload.role !== 'scout') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/player') && payload.role !== 'player') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Attach user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-role', payload.role);
    response.headers.set('x-user-email', payload.email);
    return response;
  } catch {
    // Invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
