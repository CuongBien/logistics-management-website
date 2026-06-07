export interface UserSession {
  token: string;
  sub: string;       // UserId
  tenantId: string | null;  // Nullable if Admin
  roles: string[];
}

export interface SignUpRequest {
  companyName: string;
  email: string;
  passwordHash: string;
  phone?: string;
}
