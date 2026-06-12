import type { NavigationMenuItem } from "@nuxt/ui";
import type { Permission } from "~/constants/permissions";

export interface LynxNavigationMenuItem extends NavigationMenuItem {
  icon?: string;
  permissions?: Permission | Permission[];
  children?: LynxNavigationMenuItem[];
}
