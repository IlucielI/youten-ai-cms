import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthRepository } from './auth.repository';
import { IHttpClient } from '../datasources/http';
import { UnauthorizedError } from '../errors/app.error';

describe('AuthRepository', () => {
  let mockHttpClient: IHttpClient;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe('Mock Mode (default in test)', () => {
    it('authenticates admin with valid default mock credentials', async () => {
      const repo = new AuthRepository(mockHttpClient);
      const res = await repo.login({ username: 'admin', password: 'Admin123!' });

      expect(res.token).toBe('mock-jwt-admin-token-xyz');
      expect(res.admin.username).toBe('admin');
      expect(res.admin.role_name).toBe('Super Admin');
    });

    it('throws UnauthorizedError when invalid mock credentials are provided', async () => {
      const repo = new AuthRepository(mockHttpClient);
      await expect(
        repo.login({ username: 'wrong', password: 'bad-password' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('returns mock anon token in mock mode', async () => {
      const repo = new AuthRepository(mockHttpClient);
      const res = await repo.anonToken();

      expect(res.anon_token).toBe('mock-jwt-anon-token-xyz');
      expect(res.client_id).toBe('client-app');
      expect(res.token_type).toBe('Bearer');
    });

    it('returns cached gateway anon token', async () => {
      const repo = new AuthRepository(mockHttpClient);
      const token1 = await repo.getGatewayAnonToken();
      const token2 = await repo.getGatewayAnonToken();

      expect(token1).toBe('mock-jwt-anon-token-xyz');
      expect(token2).toBe(token1);
    });

    it('rotates admin token with valid refresh token in mock mode', async () => {
      const repo = new AuthRepository(mockHttpClient);
      const res = await repo.refreshToken({ refresh_token: 'valid-refresh-token' });

      expect(res.token).toBe('mock-jwt-admin-token-refreshed');
      expect(res.refresh_token).toBe('mock-jwt-admin-refresh-token-rotated');
      expect(res.admin.username).toBe('admin');
    });

    it('throws UnauthorizedError when invalid refresh token provided in mock mode', async () => {
      const repo = new AuthRepository(mockHttpClient);
      await expect(
        repo.refreshToken({ refresh_token: 'invalid-token' })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('Core API HTTP Mode', () => {
    it('calls Core API /v1/auth/anon with Basic Auth header', async () => {
      const repo = new AuthRepository(mockHttpClient);
      // Temporarily override shouldUseMock to test HTTP integration
      vi.spyOn(repo as unknown as { shouldUseMock: () => boolean }, 'shouldUseMock').mockReturnValue(false);

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        status: 'success',
        code: 'SUCCESS',
        message: 'Anonymous token issued successfully',
        data: {
          anon_token: 'real-anon-jwt-token-123',
          session_id: '00000000-0000-0000-0000-000000000099',
          client_id: 'client-app',
          token_type: 'Bearer',
          expires_in: 604800,
          scopes: ['recordings:create'],
        },
      });

      const res = await repo.anonToken();

      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
      const [path, body, options] = vi.mocked(mockHttpClient.post).mock.calls[0];
      expect(path).toBe('/v1/auth/anon');
      expect(body).toBeUndefined();
      expect(options?.headers?.Authorization).toMatch(/^Basic /);
      expect(res.anon_token).toBe('real-anon-jwt-token-123');
    });

    it('caches gateway anon token and avoids redundant HTTP calls', async () => {
      const repo = new AuthRepository(mockHttpClient);
      vi.spyOn(repo as unknown as { shouldUseMock: () => boolean }, 'shouldUseMock').mockReturnValue(false);

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        status: 'success',
        data: {
          anon_token: 'real-anon-jwt-token-cached',
          session_id: 's-1',
          client_id: 'client-app',
          token_type: 'Bearer',
          expires_in: 3600,
          scopes: [],
        },
      });

      const token1 = await repo.getGatewayAnonToken();
      const token2 = await repo.getGatewayAnonToken();

      expect(token1).toBe('real-anon-jwt-token-cached');
      expect(token2).toBe('real-anon-jwt-token-cached');
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    });
  });
});
