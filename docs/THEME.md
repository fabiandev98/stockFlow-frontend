# 🎨 Lynx UI - Theme System

This project uses **Nuxt UI v4** with a fully customizable theme system. This documentation will help you understand and modify the theme to adapt it to your projects.

## 📁 Theme System Structure

```
lynx/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css          # CSS Variables and Design Tokens
│   └── app.config.ts              # Runtime Configuration (Semantic Colors)
└── nuxt.config.ts                 # Build-time Configuration
```

## 🎯 Main Files

### 1. `main.css` - Design Tokens and CSS Variables

This file defines all base design tokens:

#### **Custom Colors**

```css
@theme static {
  /* Define custom color palettes (50-950) */
  --color-brand-50: #f5f7fa;
  --color-brand-100: #e4e8ee;
  /* ... up to 950 */
}
```

#### **CSS Variables**

```css
:root {
  /* Backgrounds */
  --ui-bg: #ffffff;
  --ui-bg-muted: var(--ui-color-neutral-50);

  /* Text Colors */
  --ui-text: var(--ui-color-neutral-700);
  --ui-text-highlighted: var(--ui-color-neutral-900);

  /* Border Radius */
  --ui-radius: 0.5rem;

  /* Container Width */
  --ui-container: 80rem;
}
```

#### **Dark Mode**

```css
.dark {
  --ui-bg: #090c10;
  --ui-text: var(--ui-color-neutral-200);
  /* Automatic theme inversion */
}
```

### 2. `app.config.ts` - Runtime Configuration

Defines semantic colors and component customization:

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: "brand", // Primary color
      secondary: "blue", // Secondary color
      success: "green", // Success states
      info: "blue", // Information
      warning: "yellow", // Warnings
      error: "red", // Errors
      neutral: "slate", // Neutral
    },

    // Component customization
    button: {
      slots: {
        base: "font-semibold",
      },
      defaultVariants: {
        color: "primary",
        variant: "solid",
      },
    },
  },
});
```

### 3. `nuxt.config.ts` - Build-time Configuration

Registers custom colors and global options:

```typescript
export default defineNuxtConfig({
  ui: {
    theme: {
      colors: [], // Register custom colors here
      transitions: true, // CSS transitions
    },
    colorMode: true, // Automatic dark mode
  },
});
```

## 🚀 How to Use This Template

### Step 1: Define Your Color Palette

In `main.css`, update the `--color-brand-*` palette:

```css
@theme static {
  --color-brand-50: #your-color-50;
  --color-brand-100: #your-color-100;
  /* ... define all shades */
  --color-brand-950: #your-color-950;
}
```

💡 **Tip**: Use tools like [UIColors](https://uicolors.app/) to generate complete palettes.

### Step 2: Configure Semantic Colors

In `app.config.ts`, map your colors:

```typescript
colors: {
  primary: 'brand',      // Use your custom color
  secondary: 'purple',   // Or Tailwind colors
  neutral: 'zinc'        // Preferred neutral color
}
```

### Step 3: Register Custom Colors (Optional)

If you use custom colors like 'brand', you need to register them in `nuxt.config.ts`:

```typescript
ui: {
  theme: {
    colors: ["brand", "accent"]; // Your custom colors
  }
}
```

> **Note**: In the current configuration, the `brand` color is commented out in `nuxt.config.ts`. Uncomment it if you want to use `brand` directly in component `color` props. Otherwise, you can still use it through semantic color mapping in `app.config.ts` (e.g., `primary: 'brand'`).

### Step 4: Customize CSS Variables

Adjust global variables in `main.css`:

```css
:root {
  --ui-radius: 0.75rem; /* More rounded */
  --ui-container: 90rem; /* Wider container */
  --ui-header-height: --spacing(20); /* Taller header */
}
```

## 🎨 Component Customization

### Global Method (app.config.ts)

Affects all components of the same type:

```typescript
ui: {
  button: {
    slots: {
      base: 'font-bold shadow-lg' // All buttons
    },
    defaultVariants: {
      size: 'lg' // Default size
    }
  }
}
```

### Per-Instance Method (`ui` prop)

Affects only a specific component:

```vue
<UButton
  :ui="{
    base: 'rounded-full',
    trailingIcon: 'size-3',
  }"
>
  Click me
</UButton>
```

### Class Method (`class` prop)

Quick style override:

```vue
<UButton class="font-bold rounded-full px-8">
  Custom Button
</UButton>
```

## 📋 Common Components to Customize

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    // Inputs and forms
    input: {
      defaultVariants: { size: "md", color: "primary" },
    },
    select: {
      defaultVariants: { size: "md", color: "primary" },
    },

    // Cards and containers
    card: {
      slots: {
        footer: "bg-muted p-4", // Footer with background
      },
    },

    // Navigation
    badge: {
      defaultVariants: { variant: "soft" },
    },

    // Alerts
    alert: {
      defaultVariants: { color: "primary", variant: "soft" },
    },
  },
});
```

## 🌓 Dark Mode

Dark mode is automatically configured and detects system preference. CSS variables are automatically inverted in `.dark`:

```css
/* Light mode */
:root {
  --ui-bg: #ffffff;
  --ui-text: var(--ui-color-neutral-700);
}

/* Dark mode - applied automatically */
.dark {
  --ui-bg: #090c10;
  --ui-text: var(--ui-color-neutral-200);
}
```

To manually change:

```vue
<script setup>
const colorMode = useColorMode();
</script>

<template>
  <button @click="colorMode.preference = 'dark'">Dark Mode</button>
</template>
```

## 🎯 Available Tailwind CSS Utilities

### Semantic Colors

```html
<!-- Text -->
<span class="text-primary">Primary text</span>
<span class="text-success">Success text</span>

<!-- Backgrounds -->
<div class="bg-primary">Primary background</div>
<div class="bg-error">Error background</div>

<!-- Borders -->
<div class="border border-primary">Primary border</div>
```

### System Colors

```html
<!-- Backgrounds -->
<div class="bg-default">Default</div>
<div class="bg-muted">Muted</div>
<div class="bg-elevated">Elevated</div>
<div class="bg-accented">Accented</div>

<!-- Text -->
<span class="text-default">Default</span>
<span class="text-muted">Muted</span>
<span class="text-dimmed">Dimmed</span>

<!-- Borders -->
<div class="border border-default">Border</div>
```

## 🔧 Usage Examples

### Example 1: Corporate Blue Theme

```css
/* main.css */
@theme static {
  --color-brand-500: #0066cc; /* Corporate blue */
}
```

```typescript
// app.config.ts
colors: {
  primary: 'brand',
  neutral: 'slate'
}
```

### Example 2: Modern Theme with Accent

```typescript
// app.config.ts
colors: {
  primary: 'purple',
  secondary: 'pink',
  neutral: 'zinc'
}
```

```css
/* main.css */
:root {
  --ui-radius: 1rem; /* Very rounded */
}
```

### Example 3: Minimalist Theme

```css
/* main.css */
:root {
  --ui-radius: 0.25rem; /* Slightly rounded */
  --ui-bg: #fafafa;
}
```

```typescript
// app.config.ts
colors: {
  primary: 'black',
  neutral: 'gray'
}

button: {
  defaultVariants: {
    variant: 'outline'
  }
}
```

## 📚 Additional Resources

- [Nuxt UI Documentation](https://ui.nuxt.com/)
- [Tailwind CSS Theme Config](https://tailwindcss.com/docs/theme)
- [Tailwind Variants API](https://www.tailwind-variants.org/)
- [UIColors - Palette Generator](https://uicolors.app/)
- [Realtime Colors - Preview](https://www.realtimecolors.com/)

## 💡 Tips and Best Practices

1. **Always define all 11 shades** (50-950) for custom colors
2. **Use semantic colors** instead of hardcoded values
3. **Test in dark mode** all your customizations
4. **Document project-specific changes**
5. **Keep consistency** in radius and spacing values
6. **Use CSS variables** instead of direct values for better maintainability

## 🔄 Migrate this Template to a New Project

1. Copy `app/assets/css/main.css`
2. Copy `app/app.config.ts`
3. Copy the `ui` configuration from `nuxt.config.ts`
4. Adjust colors according to your brand
5. Customize components as needed

---

**Questions?** Check the [official Nuxt UI documentation](https://ui.nuxt.com/docs/getting-started/theme)
