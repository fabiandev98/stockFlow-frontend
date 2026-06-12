import {
  defineNuxtRouteMiddleware,
  navigateTo,
  setPageLayout,
  useNuxtApp,
} from "#app";
import useAuthStore from "~/stores/auth-store";
import type { RouteLocationNormalized } from "vue-router";
import type { Permission } from "~/constants/permissions";

export interface LynxAuthMeta extends RouteLocationNormalized {
  meta: RouteLocationNormalized["meta"] & {
    permissions?: Permission[]; // Array of permissions to check if the user have, at leats, one of them
    skipSelf?: boolean; // If true, if the ID of the user is the same as the requested, skip the permissions verification
    strictPermissions?: boolean; // If true, the user must have ALL permissions specified
  };
}
export default defineNuxtRouteMiddleware(
  (to: LynxAuthMeta, _: LynxAuthMeta) => {
    const authStore = useAuthStore();
    const lp = useNuxtApp().$localePath;

    if (!authStore.isLoggedIn) {
      return navigateTo(lp("/"));
    }
    if (!to.meta.layout) {
      setPageLayout("authenticated");
    }
    if (!to.meta.permissions) {
      return;
    }

    // Check if the user should be skipped
    if (
      to.meta.skipSelf &&
      authStore.user &&
      authStore.user.id === Number(to.params.id)
    ) {
      return;
    }

    // Check if the user has the requested permission/s
    const checker = to.meta.strictPermissions
      ? authStore.hasAllPermissions
      : authStore.hasAnyPermission;
    if (!checker(to.meta.permissions)) {
      return navigateTo(lp("/home"));
    }
  }
);
