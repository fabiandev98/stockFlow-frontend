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
  "dashboard-sales-analysis",
  () => fetchSummary(params.value),
  { watch: [params] }
);

const averageTicket = computed(() => {
  const count = summary.value?.sales.count ?? 0;
  return count > 0 ? Number(summary.value?.sales.total ?? 0) / count : 0;
});

const salesCards = computed(() => [
  {
    label: t("dashboard.metrics.sales_total"),
    value: formatPeso(summary.value?.sales.total),
    icon: "i-lucide-banknote",
  },
  {
    label: t("dashboard.metrics.sales_count"),
    value: String(summary.value?.sales.count ?? 0),
    icon: "i-lucide-receipt",
  },
  {
    label: t("dashboard.metrics.items_sold"),
    value: Number(summary.value?.sales.items_sold ?? 0).toFixed(2),
    icon: "i-lucide-package-check",
  },
  {
    label: t("dashboard.metrics.average_ticket"),
    value: formatPeso(averageTicket.value),
    icon: "i-lucide-calculator",
  },
]);

const maxTopProductQuantity = computed(() =>
  Math.max(
    ...(summary.value?.top_products.map((item) => Number(item.quantity)) ?? []),
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
          {{ $t("dashboard.sales_analysis") }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ $t("dashboard.sales_analysis_description") }}
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
          v-for="card in salesCards"
          :key="card.label"
          v-bind="card"
        />
      </section>

      <section class="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              {{ $t("dashboard.sales_by_day") }}
            </h2>
          </template>

          <DashboardVerticalBarChart
            v-if="summary.sales_by_day.length"
            :data="summary.sales_by_day"
          />
          <p v-else class="text-sm text-muted">
            {{ $t("dashboard.no_sales_by_day") }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              {{ $t("dashboard.top_products") }}
            </h2>
          </template>

          <div v-if="summary.top_products.length" class="space-y-5">
            <div
              v-for="(product, index) in summary.top_products"
              :key="product.product_id"
              class="space-y-2"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="text-sm font-semibold text-muted">
                    {{ index + 1 }}
                  </span>
                  <span class="truncate text-sm font-medium text-highlighted">
                    {{ product.product_name }}
                  </span>
                </div>
                <span class="shrink-0 text-sm text-muted">
                  {{ formatPeso(product.total) }}
                </span>
              </div>
              <div class="h-2 bg-elevated">
                <div
                  class="h-full bg-success"
                  :style="{
                    width: metricWidth(product.quantity, maxTopProductQuantity),
                  }"
                />
              </div>
              <p class="text-xs text-muted">
                {{ $t("dashboard.quantity_sold", { quantity: product.quantity }) }}
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-muted">
            {{ $t("dashboard.no_top_products") }}
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

          <UTable :data="summary.sales_by_day" :columns="dailyColumns">
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
