<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { definePageMeta, useDashboardModule, useDashboardPeriod, useI18n, useInventoryModule, useLazyAsyncData, useLocalePath } from "#imports";
import { PERMISSION } from "~/constants/permissions";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.INVENTORY_READ] });
const { t } = useI18n();
const lp = useLocalePath();
const { fetchSummary } = useDashboardModule();
const { fetchStockMovements, fetchProductStockMovements } = useInventoryModule();
const { selectedPeriod, customStartDate, customEndDate, params } = useDashboardPeriod();
const isClientReady = ref(false);
onMounted(() => { isClientReady.value = true; });

const { data: pageData, pending } = useLazyAsyncData("waste-detail", async () => {
  const filters = { waste_only: true, start_date: params.value.start_date ?? "", end_date: params.value.end_date ?? "" };
  const [summary, materialMovements, productMovements] = await Promise.all([
    fetchSummary(params.value),
    fetchStockMovements({ filters }),
    fetchProductStockMovements({ filters }),
  ]);
  return { summary, materialMovements, productMovements };
}, { watch: [params], server: false, dedupe: "defer" });

const summary = computed(() => pageData.value?.summary);
const materialMovements = computed(() => pageData.value?.materialMovements);
const productMovements = computed(() => pageData.value?.productMovements);
const movements = computed(() => [
  ...(materialMovements.value?.data ?? []).map((movement) => ({ id: `m-${movement.id}`, type: movement.type, name: movement.material?.name ?? `#${movement.material_id}`, batch: movement.stock_batch_id, quantity: movement.quantity, cost: Number(movement.quantity) * Number(movement.stock_batch?.unit_cost ?? 0), reason: movement.reason, date: movement.movement_date })),
  ...(productMovements.value?.data ?? []).map((movement) => ({ id: `p-${movement.id}`, type: movement.type, name: movement.product?.name ?? `#${movement.product_id}`, batch: movement.product_batch_id, quantity: movement.quantity, cost: Number(movement.total_cost ?? 0), reason: movement.reason, date: movement.movement_date })),
].sort((a, b) => b.date.localeCompare(a.date)));
const columns = computed(() => [
  { accessorKey: "name", header: t("inventory.product") }, { accessorKey: "type", header: t("inventory.movement_type") },
  { accessorKey: "batch", header: t("inventory.batch") }, { accessorKey: "quantity", header: t("sales.quantity") },
  { accessorKey: "cost", header: t("reports.waste_value") }, { accessorKey: "reason", header: t("inventory.reason") },
  { accessorKey: "date", header: t("inventory.movement_date") },
]);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <UButton :to="lp('/dashboard/reports')" icon="i-lucide-arrow-left" color="neutral" variant="link" class="-ml-3">{{ $t("reports.back_to_reports") }}</UButton>
        <h1 class="text-2xl font-semibold text-highlighted">{{ $t("reports.waste_title") }}</h1>
        <p class="mt-1 text-sm text-muted">{{ $t("reports.waste_description") }}</p>
      </div>
      <ClientOnly>
        <DashboardPeriodFilters v-model:period="selectedPeriod" v-model:start-date="customStartDate" v-model:end-date="customEndDate" />
        <template #fallback><USkeleton class="h-10 w-56" /></template>
      </ClientOnly>
    </div>

    <section v-if="!isClientReady || pending || !pageData" class="grid gap-4 md:grid-cols-3"><USkeleton v-for="i in 3" :key="i" class="h-28" /></section>
    <template v-else>
      <section class="grid gap-4 md:grid-cols-3">
        <DashboardMetricCard :label="$t('dashboard.metrics.waste_cost')" :value="formatPeso(summary?.profitability.waste_cost)" icon="i-lucide-trash-2" />
        <DashboardMetricCard :label="$t('reports.total_movements')" :value="String(movements.length)" icon="i-lucide-list" />
        <DashboardMetricCard :label="$t('dashboard.metrics.adjusted_gross_profit')" :value="formatPeso(summary?.profitability.adjusted_gross_profit)" icon="i-lucide-chart-no-axes-combined" />
      </section>
      <UCard>
        <template #header><h2 class="font-semibold">{{ $t("reports.waste_detail") }}</h2></template>
        <UTable :data="movements" :columns="columns">
          <template #type-cell="{ row }">{{ $t(`inventory.movement_types.${row.original.type}`) }}</template>
          <template #batch-cell="{ row }">#{{ row.original.batch }}</template>
          <template #quantity-cell="{ row }">{{ Number(row.original.quantity).toFixed(2) }}</template>
          <template #cost-cell="{ row }">{{ formatPeso(row.original.cost) }}</template>
          <template #date-cell="{ row }">{{ formatDisplayDate(row.original.date) }}</template>
        </UTable>
      </UCard>
    </template>
  </div>
</template>
