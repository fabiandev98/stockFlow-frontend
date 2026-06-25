<script setup lang="ts">
import { computed } from "vue";
import {
  definePageMeta,
  useAsyncData,
  useDashboardModule,
  useDashboardPeriod,
  useI18n,
  useLocalePath,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import { formatPeso } from "~/utils/currency-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.INVENTORY_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const { fetchSummary } = useDashboardModule();
const {
  selectedPeriod,
  customStartDate,
  customEndDate,
  expirationWindowDays,
  params,
} = useDashboardPeriod(true);

const { data: summary, pending } = await useAsyncData(
  "dashboard-overview",
  () => fetchSummary(params.value),
  { watch: [params] }
);

const overviewCards = computed(() => [
  {
    label: t("dashboard.metrics.sales_total"),
    value: formatPeso(summary.value?.sales.total),
    icon: "i-lucide-banknote",
    detail: t("dashboard.metrics.registered_count", {
      count: summary.value?.sales.count ?? 0,
    }),
  },
  {
    label: t("dashboard.metrics.purchases_total"),
    value: formatPeso(summary.value?.purchases.total),
    icon: "i-lucide-shopping-cart",
    detail: t("dashboard.metrics.registered_count", {
      count: summary.value?.purchases.count ?? 0,
    }),
  },
  {
    label: t("dashboard.metrics.inventory_value"),
    value: formatPeso(summary.value?.inventory.inventory_value),
    icon: "i-lucide-warehouse",
    detail: t("dashboard.metrics.low_stock_count", {
      count: summary.value?.inventory.low_stock_materials ?? 0,
    }),
  },
  {
    label: t("dashboard.metrics.inventory_alerts"),
    value: String(
      (summary.value?.inventory.expiring_batches ?? 0) +
        (summary.value?.inventory.expired_batches ?? 0)
    ),
    icon: "i-lucide-triangle-alert",
    detail: t("dashboard.metrics.expiration_alert_detail", {
      expiring: summary.value?.inventory.expiring_batches ?? 0,
      expired: summary.value?.inventory.expired_batches ?? 0,
    }),
  },
]);

const analysisLinks = computed(() => [
  {
    title: t("dashboard.sales_analysis"),
    description: t("dashboard.sales_analysis_description"),
    icon: "i-lucide-chart-no-axes-combined",
    to: lp("/dashboard/sales"),
  },
  {
    title: t("dashboard.purchases_analysis"),
    description: t("dashboard.purchases_analysis_description"),
    icon: "i-lucide-chart-column-increasing",
    to: lp("/dashboard/purchases"),
  },
]);
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          {{ $t("dashboard.overview") }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ $t("dashboard.overview_description") }}
        </p>
      </div>

      <DashboardPeriodFilters
        v-model:period="selectedPeriod"
        v-model:start-date="customStartDate"
        v-model:end-date="customEndDate"
        v-model:expiration-window-days="expirationWindowDays"
        show-expiration-window
      />
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="index in 4" :key="index" class="h-32 rounded-lg" />
    </div>

    <template v-else-if="summary">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          v-for="card in overviewCards"
          :key="card.label"
          v-bind="card"
        />
      </section>

      <section class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-highlighted">
            {{ $t("dashboard.detailed_analysis") }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ $t("dashboard.detailed_analysis_description") }}
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <NuxtLink
            v-for="analysis in analysisLinks"
            :key="analysis.title"
            :to="analysis.to"
            class="group border border-default p-5 transition-colors hover:bg-elevated"
          >
            <div class="flex items-start gap-4">
              <div class="flex size-10 shrink-0 items-center justify-center bg-elevated">
                <UIcon :name="analysis.icon" class="size-5 text-primary" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="font-semibold text-highlighted">
                    {{ analysis.title }}
                  </h3>
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-4 text-muted transition-transform group-hover:translate-x-1"
                  />
                </div>
                <p class="mt-1 text-sm text-muted">
                  {{ analysis.description }}
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>
