import {
  AdminLoginRequest,
  AdminLoginResponse,
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
   * Performs client application gateway handshake with Core API using Basic Auth
   * and returns the scoped anonymous session token response.
   */
  anonToken(): Promise<AnonTokenResponse>;

  /**
   * Retrieves a cached or fresh anonymous gateway token string for Bearer authentication.
   */
  getGatewayAnonToken(): Promise<string>;
}
