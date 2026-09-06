import { AuthService, type ApiAuthUser } from "../services/auth.service";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

function mapUser(api: ApiAuthUser): AuthUser {
  return {
    id: api.id,
    email: api.email,
    name: api.name,
    role: api.role,
  };
}

export const AuthRepository = {
  async login(email: string, password: string): Promise<LoginResult> {
    const response = await AuthService.login(email, password);
    return {
      token: response.access_token,
      user: mapUser(response.user),
    };
  },

  async loginWithLicense(licenseToken: string): Promise<LoginResult> {
    const response = await AuthService.loginWithLicense(licenseToken);
    return {
      token: response.access_token,
      user: mapUser(response.user),
    };
  },

  async getProfile(): Promise<AuthUser> {
    const user = await AuthService.getProfile();
    return mapUser(user);
  },
};
