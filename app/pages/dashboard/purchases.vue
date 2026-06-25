<script setup lang="ts">
import { computed } from "vue";
import {
  definePageMeta,
  useAsyncData,
  useDashboardModule,
  useDashboardPeriod,
  useI18n,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.INVENTORY_READ],
});

const { t } = useI18n();
const { fetchSummary } = useDashboardModule();
const { selectedPeriod, customStartDate, customEndDate, params } =
  useDashboardPeriod();

const { data: summary, pending } = await useAsyncData(
  "dashboard-purchases-analysis",
  () => fetchSummary(params.value),
  { watch: [params] }
);

const averagePurchase = computed(() => {
  const count = summary.value?.purchases.count ?? 0;
  return count > 0 ? Number(summary.value?.purchases.total ?? 0) / count : 0;
});

const purchaseCards = computed(() => [
  {
    label: t("dashboard.metrics.purchases_total"),
    value: formatPeso(summary.value?.purchases.total),
    icon: "i-lucide-shopping-cart",
  },
  {
    label: t("dashboard.metrics.purchases_count"),
    value: String(summary.value?.purchases.count ?? 0),
    icon: "i-lucide-clipboard-list",
  },
  {
    label: t("dashboard.metrics.items_purchased"),
    value: Number(summary.value?.purchases.items_purchased ?? 0).toFixed(2),
    icon: "i-lucide-package-plus",
  },
  {
    label: t("dashboard.metrics.average_purchase"),
    value: formatPeso(averagePurchase.value),
    icon: "i-lucide-calculator",
  },
]);

const maxSupplierTotal = computed(() =>
  Math.max(
    ...(summary.value?.top_suppliers.map((item) => Number(item.total)) ?? []),
    1
  )
);

const dailyColumns = computed(() => [
  { accessorKey: "date", header: t("dashboard.table.date") },
  { accessorKey: "count", header: t("dashboard.table.operations") },
  { accessorKey: "items", header: t("dashboard.table.items") },
  { accessorKey: "total", header: t("dashboard.table.total") },
]);

function metricWidth(value: string | number, max: number): string {
  return `${Math.max(3, (Number(value) / max) * 100)}%`;
}
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          {{ $t("dashboard.purchases_analysis") }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ $t("dashboard.purchases_analysis_description") }}
        </p>
      </div>

      <DashboardPeriodFilters
        v-model:period="selectedPeriod"
        v-model:start-date="customStartDate"
        v-model:end-date="customEndDate"
      />
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="index in 4" :key="index" class="h-32 rounded-lg" />
    </div>

    <template v-else-if="summary">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          v-for="card in purchaseCards"
          :key="card.label"
          v-bind="card"
        />
      </section>

      <section class="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              {{ $t("dashboard.purchases_by_day") }}
            </h2>
          </template>

          <DashboardVerticalBarChart
            v-if="summary.purchases_by_day.length"
            :data="summary.purchases_by_day"
            color="warning"
          />
          <p v-else class="text-sm text-muted">
            {{ $t("dashboard.no_purchases_by_day") }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              {{ $t("dashboard.top_suppliers") }}
            </h2>
          </template>

          <div v-if="summary.top_suppliers.length" class="space-y-5">
            <div
              v-for="(supplier, index) in summary.top_suppliers"
              :key="supplier.supplier_id ?? `none-${index}`"
              class="space-y-2"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-sm font-semibold text-muted">
                    {{ index + 1 }}
                  </span>
                  <span class="truncate text-sm font-medium text-highlighted">
                    {{ supplier.supplier_name ?? $t("dashboard.unknown_supplier") }}
                  </span>
                </div>
                <span class="shrink-0 text-sm text-muted">
                  {{ formatPeso(supplier.total) }}
                </span>
              </div>
              <div class="h-2 bg-elevated">
                <div
                  class="h-full bg-info"
                  :style="{ width: metricWidth(supplier.total, maxSupplierTotal) }"
                />
              </div>
              <p class="text-xs text-muted">
                {{
                  $t("dashboard.purchases_registered", {
                    count: supplier.purchases_count,
                  })
                }}
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-muted">
            {{ $t("dashboard.no_top_suppliers") }}
          </p>
        </UCard>
      </section>

      <section>
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              {{ $t("dashboard.daily_detail") }}
            </h2>
          </template>

          <UTable :data="summary.purchases_by_day" :columns="dailyColumns">
            <template #date-cell="{ row }">
              {{ formatDisplayDate(row.original.date) }}
            </template>
            <template #items-cell="{ row }">
              {{ Number(row.original.items).toFixed(2) }}
            </template>
            <template #total-cell="{ row }">
              <span class="font-medium text-highlighted">
                {{ formatPeso(row.original.total) }}
              </span>
            </template>
          </UTable>
        </UCard>
      </section>
    </template>
  </div>
</template>
