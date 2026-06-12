import { computed, type ComputedRef } from "vue";
import type { Permission } from "~/constants/permissions";
import useAuthStore from "~/stores/auth-store";

type CachedPermissions = Partial<Record<Permission, ComputedRef<boolean>>>;

/**
 * Composable: useAccessControl
 *
 * Provides reactive permission and role-based access control utilities for the current
 * authenticated user. It uses session data from the session store to determine whether
 * a user has specific permissions or role hierarchy access.
 *
 * This composable can operate in strict or non-strict mode:
 * - In **strict mode**, a user must have *all* specified permissions to be considered allowed.
 * - In **non-strict mode**, having *any* of the given permissions is sufficient.
 *
 * @param {Permission[]} permissions - The list of permissions to cache and validate.
 * @param {boolean} [strict=false] - Whether to enforce strict permission checking (requires all permissions).
 *
 * @returns {{
 *   userCan: (permission: Permission) => boolean;
 *   roleCan: (hierarchyNeeded: number, selfIncluded?: boolean) => boolean;
 *   userIsAllowed: ComputedRef<boolean>;
 * }}
 *
 * @property {function} userCan
 *   Checks if the user has a specific cached permission.
 *   If the permission is not cached, a console error is logged.
 *
 * @property {function} roleCan
 *   Validates whether the user has the appropriate role hierarchy level.
 *   If `selfIncluded` is true, equality is considered as sufficient access.
 *
 * @property {ComputedRef<boolean>} userIsAllowed
 *   Reactive computed value that returns whether the user has sufficient permission(s)
 *   based on `strict` mode.
 *
 */
export default function useAccessControl(
  permissions: Permission[],
  strict: boolean = false
) {
  const {
    hasAnyPermission,
    hasAllPermissions,
    hasPermission,
    getUserRoleHierarchy,
  } = useAuthStore();

  const cached: CachedPermissions = {};

  // Cache all specified permissions as reactive computed values
  for (const permission of permissions) {
    cached[permission] = computed<boolean>(() => hasPermission(permission));
  }

  /**
   * Checks if the user has a specific cached permission.
   */
  function userCan(permission: Permission): boolean {
    const cPermission = cached[permission];
    if (cPermission !== undefined) {
      return cPermission.value;
    }

    console.error(
      `The permission "${permission}" isn't cached. Make sure you are passing the right permission as parameter or you cached the correct permissions.`
    );
    return false;
  }

  /**
   * Checks if the user's role hierarchy allows access.
   * If `selfIncluded` is true, equality counts as valid access.
   */
  function roleCan(
    hierarchyNeeded: number,
    selfIncluded: boolean = false
  ): boolean {
    if (getUserRoleHierarchy === null) {
      return false;
    }

    return selfIncluded
      ? getUserRoleHierarchy <= hierarchyNeeded
      : getUserRoleHierarchy < hierarchyNeeded;
  }

  /**
   * Reactive value indicating if the user satisfies required permissions
   * (all or any, depending on `strict` mode).
   */
  const userIsAllowed = computed<boolean>(() => {
    return strict
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  });

  return {
    userCan,
    roleCan,
    userIsAllowed,
  };
}
