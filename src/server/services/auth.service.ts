export { type IAuthService } from './auth.service.interface';
import { IAuthService } from './auth.service.interface';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { defaultAuthRepository } from '../repositories/auth.repository';
import { AdminLoginRequest, AdminLoginResponse } from '../schemas/auth.schema';

export class AuthService implements IAuthService {
  constructor(private readonly authRepo: IAuthRepository = defaultAuthRepository) {}

  async login(request: AdminLoginRequest): Promise<AdminLoginResponse> {
    return this.authRepo.login(request);
  }
}

export const defaultAuthService = new AuthService();
