import { computed } from "vue";
import { useI18n, useMenuItemProcessor } from "#imports";
import { PERMISSION } from "~/constants/permissions";
import type { LynxNavigationMenuItem } from "~/types/menu";

export default function useAuthenticatedMenu() {
  const { t } = useI18n();
  const { parse } = useMenuItemProcessor();

  const raw = computed<LynxNavigationMenuItem[]>(() => {
    return [
      {
        label: t("users.menu_title"),
        icon: "i-lucide-user",
        permissions: [
          PERMISSION.USERS_CREATE,
          PERMISSION.USERS_READ,
          PERMISSION.USERS_UPDATE,
          PERMISSION.USERS_DELETE,
        ],
        children: [
          {
            label: t("common.new"),
            icon: "i-lucide-user-plus",
            to: "/users/create",
            permissions: PERMISSION.USERS_CREATE,
          },
          {
            label: t("users.index"),
            icon: "i-lucide-book-user",
            to: "/users",
            permissions: PERMISSION.USERS_READ,
          },
        ],
      },
      {
        label: t("roles.menu_title"),
        icon: "i-lucide-id-card",
        permissions: [
          PERMISSION.ROLES_CREATE,
          PERMISSION.ROLES_READ,
          PERMISSION.ROLES_UPDATE,
          PERMISSION.ROLES_DELETE,
        ],
        children: [
          {
            label: t("common.new"),
            icon: "i-lucide-plus",
            to: "/roles/create",
            permissions: PERMISSION.ROLES_CREATE,
          },
          {
            label: t("roles.index"),
            icon: "i-lucide-list",
            to: "/roles",
            permissions: PERMISSION.ROLES_READ,
          },
        ],
      },
    ];
  });

  // Use `raw` in `useDsMenuItems` and recompute when `raw` changes
  const processed = computed(() => {
    return parse(raw.value);
  });

  return {
    raw,
    processed,
  };
}
