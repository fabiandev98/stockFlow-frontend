import { ref, computed } from "vue";
import {
  areAllPermissionsInArray,
  isAnyPermissionInArray,
  isPermissionInArray,
} from "~/utils/permissions-utils";
import type { Permission } from "~/constants/permissions";
import { defineStore } from "pinia";
import type { User } from "~/types/user";
import type { AuthPayload } from "~/types/auth";

const useAuthStore = defineStore("authStore", () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const tokenTimestamps = ref<{
    expires_at: number;
    created_at: number;
  } | null>(null);

  const isLoggedIn = computed<boolean>(() => user.value !== null);
  const getPermissions = computed<Permission[]>(
    () => user.value?.role.permissions ?? []
  );
  const getUserRoleHierarchy = computed<number | null>(
    () => user.value?.role.hierarchy ?? null
  );

  function hasPermission(permission: Permission): boolean {
    return isPermissionInArray(permission, getPermissions.value);
  }

  function hasAnyPermission(permissions: Permission[]): boolean {
    return isAnyPermissionInArray(permissions, getPermissions.value);
  }

  function hasAllPermissions(permissions: Permission[]): boolean {
    return areAllPermissionsInArray(permissions, getPermissions.value);
  }

  function shouldRefreshToken(): boolean {
    // If not logged in or no expiration time set, no refresh needed
    if (!isLoggedIn.value || tokenTimestamps.value === null) {
      return false;
    }

    const now = Date.now();
    const expiresAt = tokenTimestamps.value?.expires_at ?? 0;

    // If token is already expired, it should be refreshed
    if (now >= expiresAt) {
      return true;
    }

    const timeLeft = expiresAt - now;
    const tokenLifeSpan = expiresAt - (tokenTimestamps.value?.created_at ?? 0);

    // Refresh if less than 20% of the token lifespan is remaining
    return timeLeft <= tokenLifeSpan * 0.2;
  }

  function setAuthPayload(payload: AuthPayload): void {
    token.value = payload.token.token;
    user.value = payload.user;
    // Parse ISO 8601 date string to epoch timestamp in milliseconds
    tokenTimestamps.value = {
      expires_at: new Date(payload.token.expires_at).getTime(),
      created_at: new Date(payload.token.created_at).getTime(),
    };
  }

  function $reset(): void {
    user.value = null;
    token.value = null;
    tokenTimestamps.value = null;
  }

  return {
    user,
    token,
    isLoggedIn,
    getPermissions,
    getUserRoleHierarchy,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    shouldRefreshToken,
    setAuthPayload,
    $reset,
  };
});

export default useAuthStore;
