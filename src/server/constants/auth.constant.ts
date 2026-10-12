/**
 * Auth & Session Constants for Youten AI CMS.
 */
export const AUTH_COOKIES = {
  SESSION_TOKEN: 'admin_session_token',
  REFRESH_TOKEN: 'admin_refresh_token',
  USER_INFO: 'admin_user_info',
} as const;

export const AUTH_SESSION_CONFIG = {
  MAX_AGE_SECONDS: 24 * 60 * 60, // 24 hours
  REFRESH_MAX_AGE_SECONDS: 7 * 24 * 60 * 60, // 7 days
  PATH: '/',
  SAME_SITE: 'lax' as const,
} as const;
