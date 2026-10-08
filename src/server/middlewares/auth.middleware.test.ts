import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { handleAuthRouting } from './auth.middleware';
import { AUTH_COOKIES } from '../constants/auth.constant';

describe('Auth Middleware', () => {
  it('redirects unauthenticated user from /admin to /login', () => {
    const req = new NextRequest('http://localhost:3000/admin');
    const res = handleAuthRouting(req);

    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('redirects unauthenticated user from /admin/jobs with return from param', () => {
    const req = new NextRequest('http://localhost:3000/admin/jobs?filter=active');
    const res = handleAuthRouting(req);

    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    const location = res?.headers.get('location');
    expect(location).toContain('/login?from=%2Fadmin%2Fjobs%3Ffilter%3Dactive');
  });

  it('allows authenticated user with valid session cookie to access /admin', () => {
    const req = new NextRequest('http://localhost:3000/admin', {
      headers: {
        cookie: `${AUTH_COOKIES.SESSION_TOKEN}=valid-token-123`,
      },
    });
    const res = handleAuthRouting(req);

    expect(res).toBeNull();
  });

  it('redirects authenticated user from /login to /admin', () => {
    const req = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: `${AUTH_COOKIES.SESSION_TOKEN}=valid-token-123`,
      },
    });
    const res = handleAuthRouting(req);

    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost:3000/admin');
  });

  it('allows unauthenticated user to access /login', () => {
    const req = new NextRequest('http://localhost:3000/login');
    const res = handleAuthRouting(req);

    expect(res).toBeNull();
  });
});
