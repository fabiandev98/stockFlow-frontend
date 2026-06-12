import { defineAppConfig } from "#imports";

/**
 * ==========================================================================
 * Lynx - App Configuration
 * ==========================================================================
 * Runtime configuration for Nuxt UI theme
 * Changes here are applied without server restart
 *
 * Documentation: https://ui.nuxt.com/docs/getting-started/theme
 */

export default defineAppConfig({
  ui: {
    /**
     * ----------------------------------------------------------------------
     * Semantic Color Configuration
     * ----------------------------------------------------------------------
     * Map semantic color names to your Tailwind color palette
     *
     * Available semantic colors:
     * - primary: Main CTAs, active navigation, brand elements
     * - secondary: Secondary buttons, alternative actions
     * - success: Success messages, completed states
     * - info: Info alerts, tooltips, help text
     * - warning: Warning messages, pending states
     * - error: Error messages, validation errors, destructive actions
     * - neutral: Text, borders, backgrounds, disabled states
     *
     * You can use:
     * - Tailwind's default colors: 'blue', 'green', 'red', 'zinc', etc.
     * - Custom colors defined in main.css @theme: 'brand', 'accent', etc.
     */
    colors: {
      primary: "brand", // Main brand color
      secondary: "blue", // Secondary actions
      success: "green", // Success states
      info: "blue", // Informational messages
      warning: "yellow", // Warning states
      error: "red", // Error states
      neutral: "slate", // Default text/borders
    },

    /**
     * ----------------------------------------------------------------------
     * Component Theme Customization
     * ----------------------------------------------------------------------
     * Override default component styles globally
     * Each component can customize: slots, variants, compoundVariants, defaultVariants
     *
     * Documentation: https://ui.nuxt.com/docs/getting-started/theme/components
     */

    // Example: Button customization
    button: {
      // Customize component slots (HTML elements/sections)
      slots: {
        base: "font-semibold", // Override default 'font-medium'
      },

      // Adjust specific variant styles
      variants: {
        size: {
          md: {
            base: "px-4 py-2.5",
            leadingIcon: "size-5",
            trailingIcon: "size-5",
          },
        },
      },

      // Set default variant values
      defaultVariants: {
        color: "primary",
        variant: "solid",
        size: "md",
      },
    },

    // Example: Card customization
    card: {
      slots: {
        root: "bg-default ring ring-default divide-y divide-default rounded-lg overflow-hidden",
        header: "p-4 sm:px-6",
        body: "p-4 sm:p-6",
        footer: "p-4 sm:px-6 bg-muted",
      },
    },

    // Example: Input customization
    input: {
      defaultVariants: {
        size: "md",
        color: "primary",
      },
    },

    // Example: Badge customization
    badge: {
      defaultVariants: {
        color: "primary",
        variant: "soft",
      },
    },

    /**
     * ----------------------------------------------------------------------
     * Add more component customizations here
     * ----------------------------------------------------------------------
     * Available components: https://ui.nuxt.com/docs/components
     *
     * Common components to customize:
     * - alert, avatar, badge, breadcrumb, button, card
     * - checkbox, input, textarea, select, radio
     * - modal, dropdown, popover, tooltip
     * - table, pagination, tabs, accordion
     * - navigation, header, footer
     */
  },
});
