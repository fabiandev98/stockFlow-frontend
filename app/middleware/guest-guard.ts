import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from "#imports";
import useAuthStore from "~/stores/auth-store";

export default defineNuxtRouteMiddleware(() => {
  const sessionStore = useAuthStore();
  const lp = useNuxtApp().$localePath;
  if (sessionStore.isLoggedIn) {
    return navigateTo(lp("/home"));
  }
});
