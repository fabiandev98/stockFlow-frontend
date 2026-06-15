<script setup lang="ts">
import {
  definePageMeta,
  useI18n,
  useInventoryModule,
  useLocalePath,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { StockMovement } from "~/types/inventory";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.STOCK_MOVEMENTS_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const { fetchStockMovements } = useInventoryModule();

const columns: TableColumn<StockMovement>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { id: "material", header: t("inventory.material") },
  { id: "batch", header: t("inventory.batch") },
  { id: "type", header: t("inventory.movement_type") },
  { id: "quantity", header: t("purchases.quantity") },
  { id: "user", header: t("inventory.registered_by") },
  { id: "movement_date", header: t("inventory.movement_date") },
  { accessorKey: "reason", header: t("inventory.reason") },
];

function quantity(value: string | number | null | undefined, unit?: string): string {
  const amount = Number(value ?? 0).toFixed(2);
  return unit ? `${amount} ${unit}` : amount;
}
</script>

<template>
  <SharedLazyLoadedDatatable
    :columns="columns"
    :fetch-function="fetchStockMovements"
    data-key="stock-movements"
    :empty-message="t('inventory.no_movements')"
    global-filter-enabled
  >
    <template #header>
      <UButton
        icon="i-lucide-plus"
        color="brand"
        :to="lp('/inventory/movements/create')"
      >
        {{ $t("inventory.new_movement") }}
      </UButton>
    </template>

    <template #material-cell="{ row }">
      {{ row.original.material?.name ?? `#${row.original.material_id}` }}
    </template>

    <template #batch-cell="{ row }">
      #{{ row.original.stock_batch_id }}
    </template>

    <template #type-cell="{ row }">
      {{ $t(`inventory.movement_types.${row.original.type}`) }}
    </template>

    <template #quantity-cell="{ row }">
      {{ quantity(row.original.quantity, row.original.material?.unit) }}
    </template>

    <template #user-cell="{ row }">
      {{ row.original.user?.name ?? "-" }}
    </template>

    <template #movement_date-cell="{ row }">
      {{ formatDisplayDate(row.original.movement_date) }}
    </template>
  </SharedLazyLoadedDatatable>
</template>
