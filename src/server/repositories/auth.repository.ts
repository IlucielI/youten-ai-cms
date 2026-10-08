export { type IAuthRepository } from './auth.repository.interface';
import { IAuthRepository } from './auth.repository.interface';
import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminLoginResponseSchema,
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

  constructor(client?: IHttpClient) {
    this.client =
      client ||
      new HttpClient({
        baseUrl: env.CORE_API_URL || 'http://localhost:8080',
        defaultHeaders: {
          'Content-Type': 'application/json',
        },
      });
  }

  private shouldUseMock(): boolean {
    return env.USE_MOCK_DATA || env.MOCK_CORE_API || !env.CORE_API_URL;
  }

  async login(request: AdminLoginRequest): Promise<AdminLoginResponse> {
    if (this.shouldUseMock()) {
      if (request.username === 'admin' && request.password === 'Admin123!') {
        return {
          token: 'mock-jwt-admin-token-xyz',
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
}

export const defaultAuthRepository = new AuthRepository();
