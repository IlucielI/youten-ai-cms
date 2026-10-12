import { z } from 'zod';

/**
 * Admin Login Request Schema.
 */
export const AdminLoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginRequest = z.infer<typeof AdminLoginRequestSchema>;

/**
 * Admin Profile Information Schema.
 */
export const AdminInfoSchema = z.object({
  id: z.string(),
  username: z.string(),
  full_name: z.string().optional().default(''),
  role_id: z.string().optional().default(''),
  role_name: z.string().optional().default(''),
  permissions: z.array(z.string()).optional().default([]),
});

export type AdminInfo = z.infer<typeof AdminInfoSchema>;

/**
 * Admin Login Response Schema from Core API.
 */
export const AdminLoginResponseSchema = z.object({
  token: z.string(),
  refresh_token: z.string().optional().default(''),
  token_type: z.string().optional().default('Bearer'),
  expires_in: z.number().optional(),
  refresh_expires_in: z.number().optional(),
  expires_at: z.string().optional(),
  admin: AdminInfoSchema,
});

export type AdminLoginResponse = z.infer<typeof AdminLoginResponseSchema>;

/**
 * Admin Refresh Token Request Schema.
 */
export const AdminRefreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export type AdminRefreshTokenRequest = z.infer<typeof AdminRefreshTokenRequestSchema>;

/**
 * Admin Refresh Token Response Schema from Core API.
 */
export const AdminRefreshTokenResponseSchema = z.object({
  token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().optional().default('Bearer'),
  expires_in: z.number().optional(),
  refresh_expires_in: z.number().optional(),
  expires_at: z.string().optional(),
  admin: AdminInfoSchema,
});

export type AdminRefreshTokenResponse = z.infer<typeof AdminRefreshTokenResponseSchema>;

/**
 * Anonymous / Client Gateway Token Response Schema from Core API.
 */
export const AnonTokenResponseSchema = z.object({
  anon_token: z.string(),
  session_id: z.string(),
  client_id: z.string(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().default(604800),
  scopes: z.array(z.string()).default([]),
});

export type AnonTokenResponse = z.infer<typeof AnonTokenResponseSchema>;
