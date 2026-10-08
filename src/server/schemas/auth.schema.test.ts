import { describe, it, expect } from 'vitest';
import {
  AdminLoginRequestSchema,
  AdminInfoSchema,
  AdminLoginResponseSchema,
} from './auth.schema';

describe('Auth Schemas', () => {
  it('validates a valid AdminLoginRequest', () => {
    const valid = { username: 'admin', password: 'Password123!' };
    const parsed = AdminLoginRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects empty username or password in AdminLoginRequest', () => {
    const invalid = { username: '', password: '' };
    const parsed = AdminLoginRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates a valid AdminLoginResponse with AdminInfo', () => {
    const valid = {
      token: 'jwt-test-token',
      expires_at: '2026-10-09T00:00:00Z',
      admin: {
        id: '00000000-0000-0000-0000-000000000001',
        username: 'admin',
        full_name: 'Platform Administrator',
        role_name: 'Super Admin',
        role_id: '00000000-0000-0000-0000-000000000001',
        permissions: ['*'],
      },
    };
    const parsed = AdminLoginResponseSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.admin.username).toBe('admin');
      expect(parsed.data.admin.permissions).toEqual(['*']);
    }
  });

  it('applies default values for optional AdminInfo fields', () => {
    const minimal = {
      id: '00000000-0000-0000-0000-000000000002',
      username: 'moderator',
    };
    const parsed = AdminInfoSchema.safeParse(minimal);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.full_name).toBe('');
      expect(parsed.data.permissions).toEqual([]);
    }
  });
});
