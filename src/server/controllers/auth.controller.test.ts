import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AuthController } from './auth.controller';
import { IAuthService } from '../services/auth.service.interface';
import { UnauthorizedError } from '../errors/app.error';
import { AUTH_COOKIES } from '../constants/auth.constant';

describe('AuthController', () => {
  const mockAdminResponse = {
    token: 'jwt-session-token-xyz',
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

    const userCookie = res.cookies.get(AUTH_COOKIES.USER_INFO);
    expect(userCookie?.value).toContain('admin');
  });

  it('handles 401 unauthorized login error gracefully', async () => {
    const mockService: IAuthService = {
      login: vi.fn().mockRejectedValue(new UnauthorizedError('Invalid email or password')),
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

  it('handles logout and expires session cookies', async () => {
    const controller = new AuthController();
    const res = await controller.logout();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('success');

    const sessionCookie = res.cookies.get(AUTH_COOKIES.SESSION_TOKEN);
    expect(sessionCookie?.value).toBe('');
    expect(sessionCookie?.maxAge).toBe(0);
  });
});
