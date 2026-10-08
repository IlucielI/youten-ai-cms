import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIES } from '../constants/auth.constant';

/**
 * Handles Route Protection for Admin Console:
 * - Redirects unauthenticated access to /admin/* towards /login?from=...
 * - Redirects authenticated users accessing /login directly towards /admin
 */
export function handleAuthRouting(request: NextRequest): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;
  const isAuthenticated = Boolean(sessionToken && sessionToken.trim().length > 0);

  // 1. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      const returnPath = `${pathname}${search}`;
      if (returnPath && returnPath !== '/admin') {
        loginUrl.searchParams.set('from', returnPath);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Prevent logged-in users from seeing the login screen again
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return null;
}
