import useAuthStore from "~/stores/auth-store";
import { AuthRepository } from "~/repositories/auth-reposiroty";
import {
  TOKEN_EVENTS_CHANNEL_NAME,
  TOKEN_SYNC_EVENT,
  type AuthTokenSyncEventMessage,
} from "~/constants/auth-token-events";
import { computed } from "vue";
import type { CreateUserPayload } from "~/types/user-form";
import type { User } from "~/types/user";
import type { AuthPayload, Token } from "~/types/auth";
import { useCookie, useRuntimeConfig } from "#app";
import { AUTH_TOKEN_COOKIE_KEY } from "~/constants/auth-tokens";

export function useAuth() {
  // ========================================
  // Setup & Initialization
  // ========================================
  const appConfig = useRuntimeConfig();
  const authStore = useAuthStore();
  const authRepo = new AuthRepository();

  const authCookie = useCookie<string | null>(AUTH_TOKEN_COOKIE_KEY, {
    maxAge: 60 * 60 * 24 * 365, // 1 year. This does not really matter. The server handles expiration.
    httpOnly: false,
    sameSite: "lax",
    secure: appConfig.public.appEnv === "production",
  });

  const channel = import.meta.client ? createAuthSyncChannel() : null;

  const loggedIn = computed<boolean>(() => !!authStore.token);

  // ========================================
  // Public Methods
  // ========================================
  function getAccessToken(): string | null {
    if (authStore.token) {
      return authStore.token;
    }

    return authCookie.value;
  }

  async function login(credentials: { email: string; password: string }) {
    const payload = await authRepo.login(credentials);

    saveAuth(payload);
  }

  async function register(payload: CreateUserPayload): Promise<User> {
    return await authRepo.register(payload);
  }

  async function forgotPassword(email: string) {
    return await authRepo.forgotPassword(email);
  }

  async function resetPassword(payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }) {
    return await authRepo.resetPassword(payload);
  }

  async function logout() {
    try {
      await authRepo.logout();
    } finally {
      clearAuth();
    }
  }

  async function refreshAuth(): Promise<boolean> {
    const token = await authRepo.refreshToken();
    const user = await authRepo.getCurrentUser();

    saveAuth({
      user,
      token,
    });

    return true;
  }

  function clearAuth(skipBroadcast = false) {
    authCookie.value = null;
    authStore.$reset();
    if (!skipBroadcast) {
      postAuthEvent(channel, {
        type: TOKEN_SYNC_EVENT.INVALIDATED,
        payload: null,
      });
    }
  }

  function setupChannelListener() {
    onAuthEvent(channel, (message) => {
      switch (message.type) {
        case TOKEN_SYNC_EVENT.UPDATED:
          if (message.payload === null) return;
          saveAuth(message.payload as AuthPayload, true);
          break;
        case TOKEN_SYNC_EVENT.INVALIDATED:
          clearAuth(true);
          break;
      }
    });
  }

  // ========================================
  // Private Helper Methods
  // ========================================
  function createAuthSyncChannel() {
    if (typeof window === "undefined") return null;
    return new BroadcastChannel(TOKEN_EVENTS_CHANNEL_NAME);
  }

  function saveAuth(payload: AuthPayload, skipBroadcast = false): void {
    saveTokenInCookie(payload.token);
    authStore.setAuthPayload(payload);
    if (!skipBroadcast) {
      postAuthEvent(channel, {
        type: TOKEN_SYNC_EVENT.UPDATED,
        payload: payload,
      });
    }
  }

  function saveTokenInCookie(token: Token): void {
    authCookie.value = token.token;
  }

  function postAuthEvent(
    channel: BroadcastChannel | null,
    payload: AuthTokenSyncEventMessage
  ) {
    if (!channel) return;
    channel.postMessage(payload);
  }

  function onAuthEvent(
    channel: BroadcastChannel | null,
    handler: (msg: AuthTokenSyncEventMessage) => void
  ) {
    if (!channel) return;
    channel.addEventListener("message", (e) => {
      handler(e.data as AuthTokenSyncEventMessage);
    });
  }

  return {
    loggedIn,
    authStore,
    getAccessToken,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    refreshAuth,
    clearAuth,
    setupChannelListener,
  };
}
