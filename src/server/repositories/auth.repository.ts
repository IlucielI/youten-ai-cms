export { type IAuthRepository } from './auth.repository.interface';
import { IAuthRepository } from './auth.repository.interface';
import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminLoginResponseSchema,
  AdminRefreshTokenRequest,
  AdminRefreshTokenResponse,
  AdminRefreshTokenResponseSchema,
  AnonTokenResponse,
  AnonTokenResponseSchema,
} from '../schemas/auth.schema';
import { IHttpClient, HttpClient } from '../datasources/http';
import { env } from '../config/env';
import { logger } from '../logger/pino.logger';
import { UnauthorizedError } from '../errors/app.error';

interface CoreApiResponse<T> {
  status?: string;
  code?: string;
  message?: string;
  data: T;
  timestamp?: string;
}

export class AuthRepository implements IAuthRepository {
  private readonly client: IHttpClient;
  private cachedAnonToken: string | null = null;
  private anonTokenExpiresAt: number = 0;

  constructor(client?: IHttpClient) {
    this.client =
      client ||
      new HttpClient({
        baseUrl: env.CORE_API_URL || 'http://localhost:8080',
        defaultHeaders: {
          'Content-Type': 'application/json',
        },
        authHeaderResolver: async () => {
          try {
            const token = await this.getGatewayAnonToken();
            return `Bearer ${token}`;
          } catch {
            return null;
          }
        },
      });
  }

  private shouldUseMock(): boolean {
    return env.USE_MOCK_DATA || env.MOCK_CORE_API || !env.CORE_API_URL;
  }

  async anonToken(): Promise<AnonTokenResponse> {
    if (this.shouldUseMock()) {
      return {
        anon_token: 'mock-jwt-anon-token-xyz',
        session_id: '00000000-0000-0000-0000-000000000010',
        client_id: env.CLIENT_APP_ID || 'client-app',
        token_type: 'Bearer',
        expires_in: 604800,
        scopes: ['recordings:create', 'recordings:read', 'auth:claim'],
      };
    }

    try {
      const credentials = Buffer.from(
        `${env.CLIENT_APP_ID}:${env.CLIENT_APP_SECRET}`
      ).toString('base64');
      const res = await this.client.post<CoreApiResponse<AnonTokenResponse>>(
        '/v1/auth/anon',
        undefined,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );
      const payload = res.data ?? res;
      return AnonTokenResponseSchema.parse(payload);
    } catch (err: unknown) {
      logger.error('Failed to obtain anonymous gateway token from Core API', err);
      throw err;
    }
  }

  async getGatewayAnonToken(): Promise<string> {
    if (this.shouldUseMock()) {
      return 'mock-jwt-anon-token-xyz';
    }

    if (this.cachedAnonToken && Date.now() < this.anonTokenExpiresAt - 60000) {
      return this.cachedAnonToken;
    }

    const res = await this.anonToken();
    this.cachedAnonToken = res.anon_token;
    this.anonTokenExpiresAt = Date.now() + (res.expires_in || 604800) * 1000;
    return this.cachedAnonToken;
  }

  async login(request: AdminLoginRequest): Promise<AdminLoginResponse> {
    if (this.shouldUseMock()) {
      if (request.username === 'admin' && request.password === 'Admin123!') {
        return {
          token: 'mock-jwt-admin-token-xyz',
          refresh_token: 'mock-jwt-admin-refresh-token-xyz',
          token_type: 'Bearer',
          expires_in: 86400,
          refresh_expires_in: 604800,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          admin: {
            id: '00000000-0000-0000-0000-000000000002',
            username: 'admin',
            full_name: 'Platform Administrator',
            role_id: '00000000-0000-0000-0000-000000000001',
            role_name: 'Super Admin',
            permissions: ['*'],
          },
        };
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    try {
      const res = await this.client.post<CoreApiResponse<AdminLoginResponse>>(
        '/v1/admin/login',
        request
      );
      const payload = res.data ?? res;
      return AdminLoginResponseSchema.parse(payload);
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      logger.error('Failed to authenticate admin with Core API', err, { username: request.username });
      throw err;
    }
  }

  async refreshToken(request: AdminRefreshTokenRequest): Promise<AdminRefreshTokenResponse> {
    if (this.shouldUseMock()) {
      if (request.refresh_token.includes('invalid') || request.refresh_token === '') {
        throw new UnauthorizedError('Invalid refresh token');
      }
      return {
        token: 'mock-jwt-admin-token-refreshed',
        refresh_token: 'mock-jwt-admin-refresh-token-rotated',
        token_type: 'Bearer',
        expires_in: 86400,
        refresh_expires_in: 604800,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        admin: {
          id: '00000000-0000-0000-0000-000000000002',
          username: 'admin',
          full_name: 'Platform Administrator',
          role_id: '00000000-0000-0000-0000-000000000001',
          role_name: 'Super Admin',
          permissions: ['*'],
        },
      };
    }

    try {
      const res = await this.client.post<CoreApiResponse<AdminRefreshTokenResponse>>(
        '/v1/admin/refresh',
        request
      );
      const payload = res.data ?? res;
      return AdminRefreshTokenResponseSchema.parse(payload);
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      logger.error('Failed to rotate admin token with Core API', err);
      throw err;
    }
  }
}

export const defaultAuthRepository = new AuthRepository();
