<script setup lang="ts">
import { definePageMeta, useI18n, useInventoryModule, useLocalePath, useRoute, useRouter } from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { ProductStockMovement } from "~/types/inventory";
import { formatDisplayDate } from "~/utils/date-format";
import { formatPeso } from "~/utils/currency-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.STOCK_MOVEMENTS_READ] });
const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const router = useRouter();
const { fetchProductWasteMovements } = useInventoryModule();
const columns: TableColumn<ProductStockMovement>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { id: "product", header: t("inventory.product") },
  { id: "batch", header: t("inventory.product_batch") },
  { id: "type", header: t("inventory.movement_type") },
  { id: "quantity", header: t("purchases.quantity") },
  { id: "total_cost", header: t("inventory.waste_value") },
  { id: "user", header: t("inventory.registered_by") },
  { id: "movement_date", header: t("inventory.movement_date") },
  { accessorKey: "reason", header: t("inventory.reason") },
];

function updateDateFilter(key: "start_date" | "end_date", value: string | number) {
  const { page: _page, ...query } = route.query;
  const queryKey = `filter[${key}]`;

  if (value) {
    router.push({ query: { ...query, [queryKey]: String(value) } });
  } else {
    const { [queryKey]: _dateFilter, ...queryWithoutDateFilter } = query;
    router.push({ query: queryWithoutDateFilter });
  }
}
</script>

<template>
  <SharedLazyLoadedDatatable :columns="columns" :fetch-function="fetchProductWasteMovements" data-key="product-stock-movements" :empty-message="t('inventory.no_product_movements')" global-filter-enabled>
    <template #header>
      <div class="flex flex-wrap items-end gap-2">
        <UButton icon="i-lucide-plus" color="primary" :to="lp('/inventory/product-movements/create')">{{ $t('inventory.new_product_waste') }}</UButton>
        <UFormField :label="$t('inventory.start_date')"><UInput :model-value="String(route.query['filter[start_date]'] ?? '')" type="date" @update:model-value="updateDateFilter('start_date', $event)" /></UFormField>
        <UFormField :label="$t('inventory.end_date')"><UInput :model-value="String(route.query['filter[end_date]'] ?? '')" type="date" @update:model-value="updateDateFilter('end_date', $event)" /></UFormField>
      </div>
    </template>
    <template #product-cell="{ row }">{{ row.original.product?.name ?? `#${row.original.product_id}` }}</template>
    <template #batch-cell="{ row }">#{{ row.original.product_batch_id }}</template>
    <template #type-cell="{ row }">{{ $t(`inventory.movement_types.${row.original.type}`) }}</template>
    <template #quantity-cell="{ row }">{{ Number(row.original.quantity).toFixed(2) }}</template>
    <template #total_cost-cell="{ row }">{{ formatPeso(row.original.total_cost) }}</template>
    <template #user-cell="{ row }">{{ row.original.user?.name ?? '-' }}</template>
    <template #movement_date-cell="{ row }">{{ formatDisplayDate(row.original.movement_date) }}</template>
  </SharedLazyLoadedDatatable>
</template>
