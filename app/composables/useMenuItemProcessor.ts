import { useLocalePath } from "#imports";
import type { Permission } from "~/constants/permissions";
import useAuthStore from "~/stores/auth-store";
import type { LynxNavigationMenuItem } from "~/types/menu";

export default function useMenuItemProcessor() {
  const lp = useLocalePath();
  const { hasPermission, hasAnyPermission } = useAuthStore();

  function processMenuItems(
    menuItems: LynxNavigationMenuItem[],
    hasPermission: (permission: Permission) => boolean,
    hasAnyPermission: (permissions: Permission[]) => boolean
  ): LynxNavigationMenuItem[] {
    return menuItems.reduce<LynxNavigationMenuItem[]>(
      (processedMenuItems, menuItem) => {
        // Add the locale path to all routes
        if (menuItem.to) {
          menuItem.to = lp(menuItem.to);
        }

        // If the menuItem does not have permissions, we can safely add it
        if (!menuItem.permissions) {
          processedMenuItems.push(menuItem);
          return processedMenuItems;
        }

        const isPermissionsArray = Array.isArray(menuItem.permissions);
        const checker = isPermissionsArray ? hasAnyPermission : hasPermission;

        // Skip if permissions arent required
        if (!checker(menuItem.permissions as Permission & Permission[])) {
          return processedMenuItems;
        }

        // Recursively process the childs
        if (menuItem.children) {
          menuItem.children = processMenuItems(
            menuItem.children,
            hasPermission,
            hasAnyPermission
          );
        }

        processedMenuItems.push(menuItem);
        return processedMenuItems;
      },
      []
    );
  }

  function parse(items: LynxNavigationMenuItem[]) {
    return processMenuItems(items, hasPermission, hasAnyPermission);
  }

  return {
    parse,
    parser: processMenuItems,
  };
}
