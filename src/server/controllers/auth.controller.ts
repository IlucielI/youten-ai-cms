import { NextRequest, NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { IAuthService } from '../services/auth.service.interface';
import { defaultAuthService } from '../services/auth.service';
import { ILogger } from '../logger/logger.interface';
import { AdminLoginRequestSchema } from '../schemas/auth.schema';
import { AUTH_COOKIES, AUTH_SESSION_CONFIG } from '../constants/auth.constant';
import { UnauthorizedError } from '../errors/app.error';

export class AuthController extends BaseController {
  constructor(
    private readonly service: IAuthService = defaultAuthService,
    logger?: ILogger
  ) {
    super(logger);
  }

  async login(req: Request): Promise<NextResponse> {
    const requestId = this.getRequestId(req);
    try {
      const body = await this.getBody(req, AdminLoginRequestSchema);
      const result = await this.service.login(body);

      const response = this.success(
        {
          status: 'success',
          data: {
            admin: result.admin,
            expires_at: result.expires_at,
          },
        },
        { requestId }
      );

      response.cookies.set({
        name: AUTH_COOKIES.SESSION_TOKEN,
        value: result.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: AUTH_SESSION_CONFIG.SAME_SITE,
        maxAge: AUTH_SESSION_CONFIG.MAX_AGE_SECONDS,
        path: AUTH_SESSION_CONFIG.PATH,
      });

      response.cookies.set({
        name: AUTH_COOKIES.USER_INFO,
        value: JSON.stringify({
          id: result.admin.id,
          username: result.admin.username,
          full_name: result.admin.full_name || result.admin.username,
          role_name: result.admin.role_name || 'Super Admin',
        }),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: AUTH_SESSION_CONFIG.SAME_SITE,
        maxAge: AUTH_SESSION_CONFIG.MAX_AGE_SECONDS,
        path: AUTH_SESSION_CONFIG.PATH,
      });

      return response;
    } catch (error) {
      return this.error(error, { requestId, action: 'AuthController.login' });
    }
  }

  async logout(req?: Request): Promise<NextResponse> {
    const requestId = this.getRequestId(req);
    const response = this.success(
      {
        status: 'success',
        message: 'Logged out successfully',
      },
      { requestId }
    );

    response.cookies.set({
      name: AUTH_COOKIES.SESSION_TOKEN,
      value: '',
      maxAge: 0,
      path: AUTH_SESSION_CONFIG.PATH,
    });

    response.cookies.set({
      name: AUTH_COOKIES.USER_INFO,
      value: '',
      maxAge: 0,
      path: AUTH_SESSION_CONFIG.PATH,
    });

    return response;
  }

  async me(req: Request): Promise<NextResponse> {
    const requestId = this.getRequestId(req);
    try {
      let userInfo = null;
      if (req instanceof NextRequest) {
        const sessionToken = req.cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;
        if (!sessionToken) {
          throw new UnauthorizedError('No active admin session');
        }
        const userCookie = req.cookies.get(AUTH_COOKIES.USER_INFO)?.value;
        if (userCookie) {
          try {
            userInfo = JSON.parse(userCookie);
          } catch {
            // ignore JSON parse error
          }
        }
      }
      return this.success(
        {
          status: 'success',
          data: userInfo || { username: 'admin', role_name: 'Super Admin' },
        },
        { requestId }
      );
    } catch (error) {
      return this.error(error, { requestId, action: 'AuthController.me' });
    }
  }
}

export const defaultAuthController = new AuthController();
