export const AUTH_ENDPOINT = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/tokens/refresh",
  LOGGED_USER_INFO: "/me",
} as const;
export type AuthEndpoint = (typeof AUTH_ENDPOINT)[keyof typeof AUTH_ENDPOINT];
