<script setup lang="ts">
import {
  definePageMeta,
  useI18n,
  useLocalePath,
  useSaleModule,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { Sale } from "~/types/sale";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.SALES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const { fetchSales } = useSaleModule();

const columns: TableColumn<Sale>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { accessorKey: "sale_date", header: t("sales.sale_date") },
  { accessorKey: "user.name", header: t("sales.registered_by") },
  { accessorKey: "items_count", header: t("sales.items_count") },
  { accessorKey: "total_amount", header: t("sales.total_amount") },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];
</script>

<template>
  <SharedLazyLoadedDatatable
    :columns="columns"
    :fetch-function="fetchSales"
    data-key="sales"
    :empty-message="t('sales.no_sales')"
    global-filter-enabled
  >
    <template #sale_date-cell="{ row }">
      {{ formatDisplayDate(row.original.sale_date) }}
    </template>

    <template #total_amount-cell="{ row }">
      {{ formatPeso(row.original.total_amount) }}
    </template>

    <template #action-cell="{ row }">
      <UButton
        icon="i-lucide-eye"
        color="neutral"
        size="sm"
        :to="lp('/sales/show-' + row.original.id)"
      />
    </template>
  </SharedLazyLoadedDatatable>
</template>
