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
  expires_at: z.string().optional(),
  admin: AdminInfoSchema,
});

export type AdminLoginResponse = z.infer<typeof AdminLoginResponseSchema>;
