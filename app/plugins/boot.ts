import { defineNuxtPlugin, navigateTo, useAsyncData, useRoute } from "#app";
import { useAuth, useLocalePath } from "#imports";

export default defineNuxtPlugin({
  name: "app-boot",
  dependsOn: ["api", "pinia"],
  async setup() {
    const { setupChannelListener, clearAuth, refreshAuth, getAccessToken } =
      useAuth();
    const lp = useLocalePath();
    const route = useRoute();

    // Set up the listener for token updates
    setupChannelListener();

    // If there isn't any token, no need to refresh
    if (!getAccessToken()) {
      return;
    }

    // Nuxt 4 uses different error page naming - check for various error conditions
    const isErrorPage =
      !route.name ||
      String(route.name).includes("error") ||
      String(route.name).includes("404") ||
      route.path.includes("__error__");

    if (isErrorPage) {
      return;
    }

    // Try to refresh the authenticated user session
    const { error } = await useAsyncData(() => refreshAuth());

    if (error.value) {
      clearAuth();
      await navigateTo(lp("/"));
    }
  },
});
