<script setup lang="ts">
import { onMounted, ref } from "vue";
import { definePageMeta, useDashboardModule, useDashboardPeriod, useLazyAsyncData, useLocalePath } from "#imports";
import { PERMISSION } from "~/constants/permissions";
import { formatPeso } from "~/utils/currency-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.INVENTORY_READ] });

const lp = useLocalePath();
const { fetchSummary } = useDashboardModule();
const { selectedPeriod, customStartDate, customEndDate, params } = useDashboardPeriod();
const isClientReady = ref(false);
onMounted(() => { isClientReady.value = true; });

const { data: summary, pending } = useLazyAsyncData(
  "food-cost-summary",
  () => fetchSummary(params.value),
  { watch: [params], server: false, dedupe: "defer" },
);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <UButton :to="lp('/dashboard/reports')" icon="i-lucide-arrow-left" color="neutral" variant="link" class="-ml-3">{{ $t("reports.back_to_reports") }}</UButton>
        <h1 class="text-2xl font-semibold text-highlighted">{{ $t("reports.food_cost_title") }}</h1>
        <p class="mt-1 text-sm text-muted">{{ $t("reports.food_cost_description") }}</p>
      </div>
      <ClientOnly>
        <DashboardPeriodFilters v-model:period="selectedPeriod" v-model:start-date="customStartDate" v-model:end-date="customEndDate" />
        <template #fallback><USkeleton class="h-10 w-56" /></template>
      </ClientOnly>
    </div>

    <section v-if="!isClientReady || pending || !summary" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="i in 4" :key="i" class="h-28" />
    </section>
    <template v-else>
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard :label="$t('dashboard.metrics.net_sales')" :value="formatPeso(summary.profitability.net_sales)" icon="i-lucide-wallet-cards" />
        <DashboardMetricCard :label="$t('dashboard.metrics.cogs')" :value="formatPeso(summary.profitability.cogs)" icon="i-lucide-package-minus" />
        <DashboardMetricCard :label="$t('dashboard.metrics.waste_cost')" :value="formatPeso(summary.profitability.waste_cost)" icon="i-lucide-trash-2" />
        <DashboardMetricCard :label="$t('dashboard.metrics.actual_food_cost')" :value="`${Number(summary.profitability.actual_food_cost_percentage).toFixed(2)}%`" icon="i-lucide-percent" />
      </section>
      <UCard>
        <template #header><h2 class="font-semibold">{{ $t("reports.how_food_cost_is_calculated") }}</h2></template>
        <div class="grid gap-4 text-sm md:grid-cols-3">
          <div><p class="text-muted">{{ $t("dashboard.metrics.cogs") }}</p><p class="mt-1 text-lg font-semibold">{{ formatPeso(summary.profitability.cogs) }}</p></div>
          <div><p class="text-muted">+ {{ $t("dashboard.metrics.waste_cost") }}</p><p class="mt-1 text-lg font-semibold">{{ formatPeso(summary.profitability.waste_cost) }}</p></div>
          <div><p class="text-muted">÷ {{ $t("dashboard.metrics.net_sales") }}</p><p class="mt-1 text-lg font-semibold">{{ Number(summary.profitability.actual_food_cost_percentage).toFixed(2) }}%</p></div>
        </div>
        <UButton class="mt-5" :to="lp('/dashboard/reports/waste')" icon="i-lucide-arrow-right">{{ $t("reports.view_waste_detail") }}</UButton>
      </UCard>
    </template>
  </div>
</template>
