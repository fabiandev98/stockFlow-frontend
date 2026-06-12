import {
  defineNuxtPlugin,
  useNuxtApp,
  useRouter,
  useRuntimeConfig,
} from "#app";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { useAuth } from "#imports";

declare module "ofetch" {
  interface FetchOptions {
    requiresAuth?: boolean;
  }
}

export {};

export default defineNuxtPlugin({
  name: "api",
  setup() {
    const auth = useAuth();
    const config = useRuntimeConfig();
    const router = useRouter();
    const nuxtApp = useNuxtApp();
    const i18nLocale = nuxtApp.$i18n.locale;

    const api = $fetch.create({
      baseURL: config.public.apiBase,
      requiresAuth: true,
      onRequest({ options }) {
        const headers: Record<string, string> = {
          "Accept-Language": i18nLocale.value,
        };

        if (options.requiresAuth) {
          headers.Authorization = `Bearer ${auth.getAccessToken()}`;
        }

        // Merge with any headers provided in the request options
        options.headers = { ...options.headers, ...headers };
      },
      async onResponseError({ response, options }) {
        if (
          response.status === HTTP_STATUS.UNAUTHORIZED &&
          options.requiresAuth
        ) {
          auth.clearAuth();
        } else if (response.status === HTTP_STATUS.FORBIDDEN) {
          await router.push("/home");
        }
      },
    });

    return {
      provide: {
        api,
      },
    };
  },
});
