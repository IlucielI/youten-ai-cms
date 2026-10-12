import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth.service';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { AdminLoginRequest, AdminLoginResponse } from '../schemas/auth.schema';

describe('AuthService', () => {
  it('delegates login to the auth repository successfully', async () => {
    const mockResponse: AdminLoginResponse = {
      token: 'test-token-123',
      expires_at: '2026-10-09T00:00:00Z',
      admin: {
        id: '00000000-0000-0000-0000-000000000001',
        username: 'admin',
        full_name: 'Platform Admin',
        role_id: 'r-001',
        role_name: 'Super Admin',
        permissions: ['*'],
      },
    };

    const mockRepo: IAuthRepository = {
      login: vi.fn().mockResolvedValue(mockResponse),
      anonToken: vi.fn().mockResolvedValue({
        anon_token: 'test-anon-token',
        session_id: 's-1',
        client_id: 'client-app',
        token_type: 'Bearer',
        expires_in: 604800,
        scopes: [],
      }),
      getGatewayAnonToken: vi.fn().mockResolvedValue('test-anon-token'),
    };

    const service = new AuthService(mockRepo);
    const request: AdminLoginRequest = { username: 'admin', password: 'Password123!' };
    const result = await service.login(request);

    expect(mockRepo.login).toHaveBeenCalledWith(request);
    expect(result.token).toBe('test-token-123');
    expect(result.admin.username).toBe('admin');
  });
});
