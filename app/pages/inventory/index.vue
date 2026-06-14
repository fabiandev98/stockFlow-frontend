<script setup lang="ts">
import {
  definePageMeta,
  useI18n,
  useInventoryModule,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { InventoryMaterial } from "~/types/inventory";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.INVENTORY_READ],
});

const { t } = useI18n();
const { fetchInventoryMaterials } = useInventoryModule();

const columns: TableColumn<InventoryMaterial>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { id: "material", header: t("inventory.material") },
  { id: "category", header: t("materials.category") },
  { id: "available_stock", header: t("inventory.available_stock") },
  { accessorKey: "minimum_stock", header: t("materials.minimum_stock") },
  { id: "next_expiration_date", header: t("inventory.next_expiration_date") },
  { id: "status", header: t("inventory.status") },
];

function quantity(value: string | number | null | undefined, unit?: string): string {
  const amount = Number(value ?? 0).toFixed(2);
  return unit ? `${amount} ${unit}` : amount;
}
</script>

<template>
  <SharedLazyLoadedDatatable
    :columns="columns"
    :fetch-function="fetchInventoryMaterials"
    data-key="inventory-materials"
    :empty-message="t('inventory.no_inventory')"
    global-filter-enabled
  >
    <template #material-cell="{ row }">
      {{ row.original.name }}
    </template>

    <template #category-cell="{ row }">
      {{ row.original.category?.name ?? "-" }}
    </template>

    <template #available_stock-cell="{ row }">
      {{ quantity(row.original.available_stock, row.original.unit) }}
    </template>

    <template #next_expiration_date-cell="{ row }">
      {{
        row.original.next_expiration_date
          ? formatDisplayDate(row.original.next_expiration_date)
          : $t("purchases.not_perishable")
      }}
    </template>

    <template #status-cell="{ row }">
      <UBadge :color="row.original.is_low_stock ? 'error' : 'success'" variant="soft">
        {{
          row.original.is_low_stock
            ? $t("inventory.low_stock")
            : $t("inventory.in_stock")
        }}
      </UBadge>
    </template>
  </SharedLazyLoadedDatatable>
</template>
