import {
  availableLocales,
  DEFAULT_I18N_LOCALE,
  SET_I18N_STRATEGY,
} from "./i18n/i18n";
import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/test-utils",
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
  ],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      appEnv: import.meta.env.APP_ENV,
      apiBase: import.meta.env.API_BASE,
    },
  },
  imports: {
    autoImport: false,
  },
  /**
   * ==========================================================================
   * Nuxt UI Module Configuration
   * ==========================================================================
   * Build-time configuration for Nuxt UI theme system
   *
   * Documentation: https://ui.nuxt.com/docs/getting-started/theme
   */
  ui: {
    /**
     * ----------------------------------------------------------------------
     * Theme Configuration
     * ----------------------------------------------------------------------
     */
    theme: {
      /**
       * Custom colors available as semantic colors in app.config.ts
       * These must be defined in your @theme in main.css
       */
      colors: [
        // "brand", // Custom brand color from main.css
        // Add more custom colors as needed
      ],

      /**
       * Enable/disable CSS transitions for all components
       * Set to false for better performance or accessibility needs
       */
      transitions: true,
    },

    /**
     * ----------------------------------------------------------------------
     * Color Mode Configuration
     * ----------------------------------------------------------------------
     * Enable automatic dark mode support with system preference detection
     */
    colorMode: true,
  },
  i18n: {
    strategy: SET_I18N_STRATEGY,
    defaultLocale: DEFAULT_I18N_LOCALE,
    baseUrl: import.meta.env.I18N_CANON_URL,

    locales: availableLocales(),
  },
});
