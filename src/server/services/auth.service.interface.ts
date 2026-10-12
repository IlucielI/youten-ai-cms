import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminRefreshTokenRequest,
  AdminRefreshTokenResponse,
} from '../schemas/auth.schema';

/**
 * Interface contract for Authentication Service.
 */
export interface IAuthService {
  /**
   * Performs administrative login and returns authenticated session token and admin details.
   */
  login(request: AdminLoginRequest): Promise<AdminLoginResponse>;

  /**
   * Performs administrative token rotation using valid refresh token.
   */
  refreshToken(request: AdminRefreshTokenRequest): Promise<AdminRefreshTokenResponse>;
}
