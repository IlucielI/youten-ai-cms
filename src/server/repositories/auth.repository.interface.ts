import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminRefreshTokenRequest,
  AdminRefreshTokenResponse,
  AnonTokenResponse,
} from '../schemas/auth.schema';

/**
 * Interface contract for Authentication Repository.
 */
export interface IAuthRepository {
  /**
   * Authenticates admin user credentials and returns session token and profile.
   */
  login(request: AdminLoginRequest): Promise<AdminLoginResponse>;

  /**
   * Rotates admin user access token using a valid refresh token.
   */
  refreshToken(request: AdminRefreshTokenRequest): Promise<AdminRefreshTokenResponse>;

  /**
   * Performs client application gateway handshake with Core API using Basic Auth
   * and returns the scoped anonymous session token response.
   */
  anonToken(): Promise<AnonTokenResponse>;

  /**
   * Retrieves a cached or fresh anonymous gateway token string for Bearer authentication.
   */
  getGatewayAnonToken(): Promise<string>;
}
