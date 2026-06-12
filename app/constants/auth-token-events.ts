export const TOKEN_EVENTS_CHANNEL_NAME = "lynx-auth-token-sync";

export const TOKEN_SYNC_EVENT = {
  UPDATED: "TOKEN_UPDATED",
  INVALIDATED: "TOKEN_INVALIDATED",
} as const;

export type AuthTokenSyncEvent =
  (typeof TOKEN_SYNC_EVENT)[keyof typeof TOKEN_SYNC_EVENT];

export interface AuthTokenSyncEventMessage {
  type: AuthTokenSyncEvent;
  payload: unknown | null;
}
