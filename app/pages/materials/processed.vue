<script setup lang="ts">
import { definePageMeta, useAccessControl, useI18n, useInventoryModule, useLocalePath } from "#imports";
import type { TableColumn } from "@nuxt/ui";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { InventoryMaterial } from "~/types/inventory";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.MATERIALS_READ] });

const { t } = useI18n();
const lp = useLocalePath();
const { fetchInventoryMaterials } = useInventoryModule();
const { userCan } = useAccessControl([PERMISSION.MATERIALS_UPDATE]);

const columns: TableColumn<InventoryMaterial>[] = [
  { accessorKey: "name", header: t("materials.name") },
  { id: "category", header: t("materials.category") },
  { id: "available_stock", header: t("inventory.available_stock") },
  { id: "average_processing_yield", header: t("inventory.processing_yield") },
  { id: "next_expiration_date", header: t("inventory.next_expiration_date") },
  { id: "status", header: t("inventory.status") },
  { id: "action", header: t("common.action"), enableSorting: false },
];

function quantity(value: string | number | null | undefined, unit?: string): string {
  const amount = Number(value ?? 0).toFixed(2);
  return unit ? `${amount} ${unit}` : amount;
}

function fetchProcessedMaterials(params: Parameters<typeof fetchInventoryMaterials>[0]) {
  return fetchInventoryMaterials({ ...params, filters: { ...params.filters, processing_type: "processed" } });
}
</script>

<template>
  <SharedLazyLoadedDatatable
    :columns="columns"
    :fetch-function="fetchProcessedMaterials"
    data-key="processed-materials"
    :empty-message="t('materials.no_processed_materials')"
    global-filter-enabled
  >
    <template #header>
      <div class="flex justify-end">
        <UButton icon="i-lucide-scissors" color="primary" :to="lp('/inventory/process-material')">{{ $t("inventory.process_material") }}</UButton>
      </div>
    </template>
    <template #category-cell="{ row }">{{ row.original.category?.name ?? "-" }}</template>
    <template #available_stock-cell="{ row }">{{ quantity(row.original.available_stock, row.original.unit) }}</template>
    <template #average_processing_yield-cell="{ row }">{{ row.original.average_processing_yield ? `${Number(row.original.average_processing_yield).toFixed(2)}%` : "-" }}</template>
    <template #next_expiration_date-cell="{ row }">{{ row.original.next_expiration_date ? formatDisplayDate(row.original.next_expiration_date) : $t("purchases.not_perishable") }}</template>
    <template #status-cell="{ row }"><UBadge :color="row.original.is_low_stock ? 'error' : 'success'" variant="soft">{{ row.original.is_low_stock ? $t("inventory.low_stock") : $t("inventory.in_stock") }}</UBadge></template>
    <template #action-cell="{ row }">
      <ButtonUpdate v-if="userCan(PERMISSION.MATERIALS_UPDATE)" :route="lp('/materials/edit-' + row.original.id)" />
    </template>
  </SharedLazyLoadedDatatable>
</template>
