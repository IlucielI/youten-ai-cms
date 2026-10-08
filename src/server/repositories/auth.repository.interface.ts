import { AdminLoginRequest, AdminLoginResponse } from '../schemas/auth.schema';

/**
 * Interface contract for Authentication Repository.
 */
export interface IAuthRepository {
  /**
   * Authenticates admin user credentials and returns session token and profile.
   */
  login(request: AdminLoginRequest): Promise<AdminLoginResponse>;
}
