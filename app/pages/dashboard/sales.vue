<script setup lang="ts">
import { computed, ref, watch } from "vue";
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

const dailyItemsPerPage = 10;
const dailyPage = ref(1);

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

const profitabilityCards = computed(() => [
  {
    label: t("dashboard.metrics.net_sales"),
    value: formatPeso(summary.value?.profitability.net_sales),
    icon: "i-lucide-wallet-cards",
  },
  {
    label: t("dashboard.metrics.cogs"),
    value: formatPeso(summary.value?.profitability.cogs),
    icon: "i-lucide-package-minus",
  },
  {
    label: t("dashboard.metrics.gross_profit"),
    value: formatPeso(summary.value?.profitability.gross_profit),
    icon: "i-lucide-chart-no-axes-combined",
  },
  {
    label: t("dashboard.metrics.actual_food_cost"),
    value: `${Number(summary.value?.profitability.actual_food_cost_percentage ?? 0).toFixed(2)}%`,
    icon: "i-lucide-percent",
  },
]);

const lossCards = computed(() => [
  {
    label: t("dashboard.metrics.waste_cost"),
    value: formatPeso(summary.value?.profitability.waste_cost),
    icon: "i-lucide-trash-2",
  },
  {
    label: t("dashboard.metrics.adjusted_gross_profit"),
    value: formatPeso(summary.value?.profitability.adjusted_gross_profit),
    icon: "i-lucide-chart-no-axes-combined",
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

const paginatedSalesByDay = computed(() => {
  const start = (dailyPage.value - 1) * dailyItemsPerPage;
  return (summary.value?.sales_by_day ?? []).slice(
    start,
    start + dailyItemsPerPage
  );
});

const salesByDayTotal = computed(() => summary.value?.sales_by_day.length ?? 0);

watch(params, () => {
  dailyPage.value = 1;
});

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

      <section class="space-y-3">
        <div>
          <h2 class="font-semibold text-highlighted">
            {{ $t("dashboard.profitability") }}
          </h2>
          <p class="text-sm text-muted">
            {{ $t("dashboard.profitability_description") }}
          </p>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            v-for="card in profitabilityCards"
            :key="card.label"
            v-bind="card"
          />
        </div>
      </section>

      <section class="grid gap-4 md:grid-cols-2">
        <DashboardMetricCard
          v-for="card in lossCards"
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

          <UTable :data="paginatedSalesByDay" :columns="dailyColumns">
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

          <template v-if="salesByDayTotal > dailyItemsPerPage" #footer>
            <div class="flex justify-end">
              <UPagination
                v-model:page="dailyPage"
                :items-per-page="dailyItemsPerPage"
                :total="salesByDayTotal"
              />
            </div>
          </template>
        </UCard>
      </section>
    </template>
  </div>
</template>
