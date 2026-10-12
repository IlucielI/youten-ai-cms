import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AuthController } from './auth.controller';
import { IAuthService } from '../services/auth.service.interface';
import { UnauthorizedError } from '../errors/app.error';
import { AUTH_COOKIES } from '../constants/auth.constant';

describe('AuthController', () => {
  const mockAdminResponse = {
    token: 'jwt-session-token-xyz',
    refresh_token: 'jwt-refresh-token-xyz',
    expires_at: '2026-10-09T00:00:00Z',
    admin: {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      full_name: 'Super Admin',
      role_id: 'r-1',
      role_name: 'Super Admin',
      permissions: ['*'],
    },
  };

  it('handles successful login and sets session cookies', async () => {
    const mockService: IAuthService = {
      login: vi.fn().mockResolvedValue(mockAdminResponse),
      refreshToken: vi.fn(),
    };

    const controller = new AuthController(mockService);
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'Admin123!' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await controller.login(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe('success');
    expect(json.data.admin.username).toBe('admin');

    const sessionCookie = res.cookies.get(AUTH_COOKIES.SESSION_TOKEN);
    expect(sessionCookie?.value).toBe('jwt-session-token-xyz');
    expect(sessionCookie?.httpOnly).toBe(true);

    const refreshCookie = res.cookies.get(AUTH_COOKIES.REFRESH_TOKEN);
    expect(refreshCookie?.value).toBe('jwt-refresh-token-xyz');
    expect(refreshCookie?.httpOnly).toBe(true);

    const userCookie = res.cookies.get(AUTH_COOKIES.USER_INFO);
    expect(userCookie?.value).toContain('admin');
  });

  it('handles 401 unauthorized login error gracefully', async () => {
    const mockService: IAuthService = {
      login: vi.fn().mockRejectedValue(new UnauthorizedError('Invalid email or password')),
      refreshToken: vi.fn(),
    };

    const controller = new AuthController(mockService);
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await controller.login(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.code).toBe('UNAUTHORIZED');
    expect(json.error).toContain('Invalid email or password');
  });

  it('handles successful refreshToken via json body', async () => {
    const mockService: IAuthService = {
      login: vi.fn(),
      refreshToken: vi.fn().mockResolvedValue({
        token: 'jwt-new-session-token',
        refresh_token: 'jwt-new-refresh-token',
        expires_at: '2026-10-10T00:00:00Z',
        admin: mockAdminResponse.admin,
      }),
    };

    const controller = new AuthController(mockService);
    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: 'existing-refresh-token' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await controller.refreshToken(req);
    expect(res.status).toBe(200);

    const sessionCookie = res.cookies.get(AUTH_COOKIES.SESSION_TOKEN);
    expect(sessionCookie?.value).toBe('jwt-new-session-token');

    const refreshCookie = res.cookies.get(AUTH_COOKIES.REFRESH_TOKEN);
    expect(refreshCookie?.value).toBe('jwt-new-refresh-token');
  });

  it('handles successful refreshToken via cookie fallback', async () => {
    const mockService: IAuthService = {
      login: vi.fn(),
      refreshToken: vi.fn().mockResolvedValue({
        token: 'jwt-new-session-token-cookie',
        refresh_token: 'jwt-new-refresh-token-cookie',
        expires_at: '2026-10-10T00:00:00Z',
        admin: mockAdminResponse.admin,
      }),
    };

    const controller = new AuthController(mockService);
    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `${AUTH_COOKIES.REFRESH_TOKEN}=cookie-refresh-token;`,
      },
    });

    const res = await controller.refreshToken(req);
    expect(res.status).toBe(200);

    const sessionCookie = res.cookies.get(AUTH_COOKIES.SESSION_TOKEN);
    expect(sessionCookie?.value).toBe('jwt-new-session-token-cookie');
  });

  it('returns 401 on refreshToken when refresh token is missing', async () => {
    const controller = new AuthController();
    const req = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
    });

    const res = await controller.refreshToken(req);
    expect(res.status).toBe(401);
  });

  it('handles logout and expires session cookies', async () => {
    const controller = new AuthController();
    const res = await controller.logout();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('success');

    const sessionCookie = res.cookies.get(AUTH_COOKIES.SESSION_TOKEN);
    expect(sessionCookie?.value).toBe('');
    expect(sessionCookie?.maxAge).toBe(0);

    const refreshCookie = res.cookies.get(AUTH_COOKIES.REFRESH_TOKEN);
    expect(refreshCookie?.value).toBe('');
    expect(refreshCookie?.maxAge).toBe(0);
  });
});
