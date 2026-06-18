<script setup lang="ts">
import {
  definePageMeta,
  useI18n,
  useInventoryModule,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { InventoryProduct } from "~/types/inventory";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.INVENTORY_READ],
});

const { t } = useI18n();
const { fetchInventoryProducts } = useInventoryModule();

const columns: TableColumn<InventoryProduct>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { id: "product", header: t("inventory.product") },
  { id: "category", header: t("products.category") },
  { id: "available_stock", header: t("inventory.available_stock") },
  { accessorKey: "sale_price", header: t("products.sale_price") },
  { id: "next_expiration_date", header: t("inventory.next_expiration_date") },
  { id: "status", header: t("inventory.status") },
];

function quantity(value: string | number | null | undefined): string {
  return Number(value ?? 0).toFixed(2);
}
</script>

<template>
  <SharedLazyLoadedDatatable
    :columns="columns"
    :fetch-function="fetchInventoryProducts"
    data-key="inventory-products"
    :empty-message="t('inventory.no_products')"
    global-filter-enabled
  >
    <template #product-cell="{ row }">
      {{ row.original.name }}
    </template>

    <template #category-cell="{ row }">
      {{ row.original.category?.name ?? "-" }}
    </template>

    <template #available_stock-cell="{ row }">
      {{ quantity(row.original.available_stock) }}
    </template>

    <template #sale_price-cell="{ row }">
      {{ formatPeso(row.original.sale_price) }}
    </template>

    <template #next_expiration_date-cell="{ row }">
      {{
        row.original.next_expiration_date
          ? formatDisplayDate(row.original.next_expiration_date)
          : $t("purchases.not_perishable")
      }}
    </template>

    <template #status-cell="{ row }">
      <UBadge :color="row.original.is_active ? 'success' : 'neutral'" variant="soft">
        {{
          row.original.is_active
            ? $t("products.active")
            : $t("products.inactive")
        }}
      </UBadge>
    </template>
  </SharedLazyLoadedDatatable>
</template>
