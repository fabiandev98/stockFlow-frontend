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
      {
        label: t("materials.menu_title"),
        icon: "i-lucide-boxes",
        permissions: [
          PERMISSION.MATERIALS_CREATE,
          PERMISSION.MATERIALS_READ,
          PERMISSION.MATERIALS_UPDATE,
          PERMISSION.MATERIALS_DELETE,
        ],
        children: [
          {
            label: t("common.new"),
            icon: "i-lucide-plus",
            to: "/materials/create",
            permissions: PERMISSION.MATERIALS_CREATE,
          },
          {
            label: t("materials.index"),
            icon: "i-lucide-list",
            to: "/materials",
            permissions: PERMISSION.MATERIALS_READ,
          },
          {
            label: t("material_categories.menu_title"),
            icon: "i-lucide-tags",
            permissions: [
              PERMISSION.MATERIAL_CATEGORIES_CREATE,
              PERMISSION.MATERIAL_CATEGORIES_READ,
              PERMISSION.MATERIAL_CATEGORIES_UPDATE,
              PERMISSION.MATERIAL_CATEGORIES_DELETE,
            ],
            children: [
              {
                label: t("material_categories.new"),
                icon: "i-lucide-plus",
                to: "/material-categories/create",
                permissions: PERMISSION.MATERIAL_CATEGORIES_CREATE,
              },
              {
                label: t("material_categories.index"),
                icon: "i-lucide-list",
                to: "/material-categories",
                permissions: PERMISSION.MATERIAL_CATEGORIES_READ,
              },
            ],
          },
        ],
      },
      {
        label: t("suppliers.menu_title"),
        icon: "i-lucide-truck",
        permissions: [
          PERMISSION.SUPPLIERS_CREATE,
          PERMISSION.SUPPLIERS_READ,
          PERMISSION.SUPPLIERS_UPDATE,
          PERMISSION.SUPPLIERS_DELETE,
        ],
        children: [
          {
            label: t("common.new"),
            icon: "i-lucide-plus",
            to: "/suppliers/create",
            permissions: PERMISSION.SUPPLIERS_CREATE,
          },
          {
            label: t("suppliers.index"),
            icon: "i-lucide-list",
            to: "/suppliers",
            permissions: PERMISSION.SUPPLIERS_READ,
          },
        ],
      },
      {
        label: t("products.menu_title"),
        icon: "i-lucide-package",
        permissions: [
          PERMISSION.PRODUCTS_CREATE,
          PERMISSION.PRODUCTS_READ,
          PERMISSION.PRODUCTS_UPDATE,
          PERMISSION.PRODUCTS_DELETE,
        ],
        children: [
          {
            label: t("common.new"),
            icon: "i-lucide-plus",
            to: "/products/create",
            permissions: PERMISSION.PRODUCTS_CREATE,
          },
          {
            label: t("products.index"),
            icon: "i-lucide-list",
            to: "/products",
            permissions: PERMISSION.PRODUCTS_READ,
          },
          {
            label: t("product_categories.menu_title"),
            icon: "i-lucide-tags",
            permissions: [
              PERMISSION.PRODUCT_CATEGORIES_CREATE,
              PERMISSION.PRODUCT_CATEGORIES_READ,
              PERMISSION.PRODUCT_CATEGORIES_UPDATE,
              PERMISSION.PRODUCT_CATEGORIES_DELETE,
            ],
            children: [
              {
                label: t("product_categories.new"),
                icon: "i-lucide-plus",
                to: "/product-categories/create",
                permissions: PERMISSION.PRODUCT_CATEGORIES_CREATE,
              },
              {
                label: t("product_categories.index"),
                icon: "i-lucide-list",
                to: "/product-categories",
                permissions: PERMISSION.PRODUCT_CATEGORIES_READ,
              },
            ],
          },
        ],
      },
      {
        label: t("purchases.menu_title"),
        icon: "i-lucide-shopping-cart",
        permissions: [
          PERMISSION.PURCHASES_CREATE,
          PERMISSION.PURCHASES_READ,
          PERMISSION.PURCHASES_UPDATE,
          PERMISSION.PURCHASES_DELETE,
        ],
        children: [
          {
            label: t("common.new"),
            icon: "i-lucide-plus",
            to: "/purchases/create",
            permissions: PERMISSION.PURCHASES_CREATE,
          },
          {
            label: t("purchases.index"),
            icon: "i-lucide-list",
            to: "/purchases",
            permissions: PERMISSION.PURCHASES_READ,
          },
        ],
      },
      {
        label: t("sales.menu_title"),
        icon: "i-lucide-receipt",
        permissions: [PERMISSION.SALES_CREATE, PERMISSION.SALES_READ],
        children: [
          {
            label: t("common.new"),
            icon: "i-lucide-plus",
            to: "/sales/create",
            permissions: PERMISSION.SALES_CREATE,
          },
          {
            label: t("sales.index"),
            icon: "i-lucide-list",
            to: "/sales",
            permissions: PERMISSION.SALES_READ,
          },
        ],
      },
      {
        label: t("inventory.menu_title"),
        icon: "i-lucide-warehouse",
        permissions: [
          PERMISSION.INVENTORY_READ,
          PERMISSION.STOCK_BATCHES_READ,
          PERMISSION.STOCK_MOVEMENTS_CREATE,
          PERMISSION.STOCK_MOVEMENTS_READ,
        ],
        children: [
          {
            label: t("inventory.alerts"),
            icon: "i-lucide-bell",
            to: "/inventory/alerts",
            permissions: PERMISSION.INVENTORY_READ,
          },
          {
            label: t("inventory.summary"),
            icon: "i-lucide-chart-no-axes-column",
            to: "/inventory",
            permissions: PERMISSION.INVENTORY_READ,
          },
          {
            label: t("inventory.batches"),
            icon: "i-lucide-package-search",
            to: "/inventory/batches",
            permissions: PERMISSION.STOCK_BATCHES_READ,
          },
          {
            label: t("inventory.new_movement"),
            icon: "i-lucide-plus",
            to: "/inventory/movements/create",
            permissions: PERMISSION.STOCK_MOVEMENTS_CREATE,
          },
          {
            label: t("inventory.movements"),
            icon: "i-lucide-arrow-right-left",
            to: "/inventory/movements",
            permissions: PERMISSION.STOCK_MOVEMENTS_READ,
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
