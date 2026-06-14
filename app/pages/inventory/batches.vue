<script setup lang="ts">
import {
  definePageMeta,
  useI18n,
  useInventoryModule,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { InventoryStockBatch } from "~/types/inventory";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.STOCK_BATCHES_READ],
});

const { t } = useI18n();
const { fetchStockBatches } = useInventoryModule();

const columns: TableColumn<InventoryStockBatch>[] = [
  { accessorKey: "id", header: t("inventory.batch"), enableSorting: false },
  { id: "material", header: t("inventory.material") },
  { id: "purchase", header: t("purchases.resource_name") },
  { id: "initial_quantity", header: t("purchases.initial_quantity") },
  { id: "available_quantity", header: t("purchases.available_quantity") },
  { accessorKey: "unit_cost", header: t("purchases.unit_cost") },
  { id: "received_date", header: t("inventory.received_date") },
  { id: "expiration_date", header: t("purchases.expiration_date") },
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
    :fetch-function="fetchStockBatches"
    data-key="stock-batches"
    :empty-message="t('inventory.no_batches')"
    global-filter-enabled
  >
    <template #material-cell="{ row }">
      {{ row.original.material?.name ?? `#${row.original.material_id}` }}
    </template>

    <template #purchase-cell="{ row }">
      <span v-if="row.original.purchase_item?.purchase">
        #{{ row.original.purchase_item.purchase.id }}
        <span v-if="row.original.purchase_item.purchase.supplier">
          - {{ row.original.purchase_item.purchase.supplier.name }}
        </span>
      </span>
      <span v-else>-</span>
    </template>

    <template #initial_quantity-cell="{ row }">
      {{ quantity(row.original.initial_quantity, row.original.material?.unit) }}
    </template>

    <template #available_quantity-cell="{ row }">
      {{ quantity(row.original.available_quantity, row.original.material?.unit) }}
    </template>

    <template #unit_cost-cell="{ row }">
      {{ formatPeso(row.original.unit_cost) }}
    </template>

    <template #received_date-cell="{ row }">
      {{ formatDisplayDate(row.original.received_date) }}
    </template>

    <template #expiration_date-cell="{ row }">
      {{
        row.original.expiration_date
          ? formatDisplayDate(row.original.expiration_date)
          : $t("purchases.not_perishable")
      }}
    </template>

    <template #status-cell="{ row }">
      <UBadge color="neutral" variant="soft">
        {{ row.original.status }}
      </UBadge>
    </template>
  </SharedLazyLoadedDatatable>
</template>
