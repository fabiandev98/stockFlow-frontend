<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { definePageMeta, useDashboardModule, useI18n, useLazyAsyncData, useLocalePath } from "#imports";
import { PERMISSION } from "~/constants/permissions";
import type { DashboardPeriod, DashboardSummary, DashboardSummaryParams } from "~/types/dashboard";
import { formatPeso } from "~/utils/currency-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.INVENTORY_READ] });

type QueryMode = "day" | "range";
interface ReportData { current: DashboardSummary; previous?: DashboardSummary; }

const { t, locale } = useI18n();
const lp = useLocalePath();
const { fetchSummary } = useDashboardModule();
const mode = ref<QueryMode>("day");
const startDate = ref("");
const endDate = ref("");
const compareEnabled = ref(false);
const comparisonMode = ref<QueryMode>("day");
const comparisonStartDate = ref("");
const comparisonEndDate = ref("");
const maxDate = ref("");
const appliedCurrent = ref<DashboardSummaryParams | null>(null);
const appliedComparison = ref<DashboardSummaryParams | null>(null);

function previousDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}
const comparisonMaxDate = computed(() => startDate.value ? previousDate(startDate.value) : maxDate.value);

watch(mode, (value) => {
  comparisonMode.value = value;
  comparisonStartDate.value = "";
  comparisonEndDate.value = "";
});

onMounted(() => { maxDate.value = new Date().toISOString().slice(0, 10); });

function normalizedRange(queryMode: QueryMode, start: string, end: string): DashboardSummaryParams | null {
  if (!start || (queryMode === "range" && !end)) return null;
  const finalEnd = queryMode === "day" ? start : end;
  if (start > finalEnd || (maxDate.value && finalEnd > maxDate.value)) return null;
  return { start_date: start, end_date: finalEnd };
}

const canQuery = computed(() => {
  const current = normalizedRange(mode.value, startDate.value, endDate.value);
  if (!current) return false;
  if (!compareEnabled.value) return true;
  const comparison = normalizedRange(comparisonMode.value, comparisonStartDate.value, comparisonEndDate.value);
  return Boolean(comparison && comparison.end_date < current.start_date);
});

const { data: report, pending, error, execute } = useLazyAsyncData<ReportData | null>(
  "dashboard-kpi-reports",
  async () => {
    if (!appliedCurrent.value) return null;
    const [current, previous] = await Promise.all([
      fetchSummary(appliedCurrent.value),
      appliedComparison.value ? fetchSummary(appliedComparison.value) : Promise.resolve(undefined),
    ]);
    return { current, previous };
  },
  { server: false, immediate: false, dedupe: "defer" },
);

async function applyQuery(): Promise<void> {
  const current = normalizedRange(mode.value, startDate.value, endDate.value);
  const comparison = compareEnabled.value
    ? normalizedRange(comparisonMode.value, comparisonStartDate.value, comparisonEndDate.value)
    : null;
  if (!current || (compareEnabled.value && (!comparison || comparison.end_date >= current.start_date))) return;
  appliedCurrent.value = current;
  appliedComparison.value = comparison;
  await execute();
}

const metricOptions = computed(() => [
  { key: "net_sales", label: t("dashboard.metrics.net_sales"), current: report.value?.current.profitability.net_sales, previous: report.value?.previous?.profitability.net_sales, currency: true },
  { key: "covers", label: t("sales.covers"), current: report.value?.current.sales.count, previous: report.value?.previous?.sales.count, currency: false },
  { key: "ticket", label: t("dashboard.metrics.average_ticket"), current: averageTicket(report.value?.current.sales.total, report.value?.current.sales.count), previous: averageTicket(report.value?.previous?.sales.total, report.value?.previous?.sales.count), currency: true },
  { key: "cogs", label: t("dashboard.metrics.cogs"), current: report.value?.current.profitability.cogs, previous: report.value?.previous?.profitability.cogs, currency: true, improvementWhenLower: true },
  { key: "gross_profit", label: t("dashboard.metrics.gross_profit"), current: report.value?.current.profitability.gross_profit, previous: report.value?.previous?.profitability.gross_profit, currency: true },
  { key: "food_cost", label: t("dashboard.metrics.actual_food_cost"), current: report.value?.current.profitability.actual_food_cost_percentage, previous: report.value?.previous?.profitability.actual_food_cost_percentage, currency: false, percentage: true, improvementWhenLower: true, to: "/dashboard/reports/food-cost" },
  { key: "waste", label: t("dashboard.metrics.waste_cost"), current: report.value?.current.profitability.waste_cost, previous: report.value?.previous?.profitability.waste_cost, currency: true, improvementWhenLower: true, to: "/dashboard/reports/waste" },
]);
const selectedMetrics = ref<string[]>(["net_sales", "covers", "ticket", "cogs", "gross_profit", "food_cost", "waste"]);
const visibleMetrics = computed(() => metricOptions.value.filter((metric) => selectedMetrics.value.includes(metric.key)));
function averageTicket(total?: string, count?: number): number { return count ? Number(total ?? 0) / count : 0; }
function isMetricSelected(key: string): boolean { return selectedMetrics.value.includes(key); }
function setMetricSelected(key: string, selected: boolean): void { selectedMetrics.value = selected ? [...new Set([...selectedMetrics.value, key])] : selectedMetrics.value.filter((item) => item !== key); }
function difference(current: string | number | undefined, previous: string | number | undefined): number { return Number(current ?? 0) - Number(previous ?? 0); }
function display(metric: { current: string | number | undefined; currency?: boolean; percentage?: boolean }, value = metric.current): string { if (metric.percentage) return `${Number(value ?? 0).toFixed(2)}%`; return metric.currency ? formatPeso(value) : Number(value ?? 0).toFixed(0); }
function comparisonDisplay(metric: { current: string | number | undefined; percentage?: boolean }, value: number): string { return metric.percentage ? `${Math.abs(value).toFixed(2)} pp` : display(metric, Math.abs(value)); }
function comparisonDetail(metric: { current: string | number | undefined; percentage?: boolean }, value: number): string { return `${value === 0 ? "" : value > 0 ? "↑ " : "↓ "}${comparisonDisplay(metric, value)}`; }
function comparisonClass(metric: { improvementWhenLower?: boolean }, value: number): string {
  if (value === 0) return "text-muted";
  return (metric.improvementWhenLower ? value < 0 : value > 0) ? "text-success" : "text-error";
}
function formatPeriod(period?: DashboardPeriod): string {
  if (!period) return "";
  const formatter = new Intl.DateTimeFormat(locale.value, { day: "numeric", month: "short", year: "numeric" });
  const formatDate = (date: string) => formatter.format(new Date(`${date}T12:00:00`));
  return period.start_date === period.end_date ? formatDate(period.start_date) : `${formatDate(period.start_date)} – ${formatDate(period.end_date)}`;
}
const comparisonColumns = computed(() => [
  { accessorKey: "label", header: t("reports.metric") },
  { id: "current", header: formatPeriod(report.value?.current.period) },
  { id: "previous", header: formatPeriod(report.value?.previous?.period) },
  { id: "difference", header: t("reports.variation") },
]);
function csvValue(metric: { percentage?: boolean }, value: string | number | undefined): string {
  const formatted = new Intl.NumberFormat(locale.value, { useGrouping: false, maximumFractionDigits: 2 }).format(Number(value ?? 0));
  return metric.percentage ? `${formatted}%` : formatted;
}
function csvCell(value: string): string { return /[;"\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value; }
function exportCsv(): void {
  const period = report.value?.current.period;
  const hasComparison = Boolean(report.value?.previous);
  const headers = hasComparison
    ? [t("reports.metric"), t("reports.current_period"), t("reports.compared_period"), t("reports.difference")]
    : [t("reports.metric"), t("reports.current_period")];
  const rows = [headers, ...visibleMetrics.value.map((metric) => {
    const current = csvValue(metric, metric.current);
    return hasComparison
      ? [metric.label, current, csvValue(metric, metric.previous), csvValue(metric, difference(metric.current, metric.previous))]
      : [metric.label, current];
  })];
  const csv = `\uFEFFsep=;\n${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.href = url;
  link.download = `stockflow-kpi-${period?.start_date ?? "report"}-${period?.end_date ?? "report"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="space-y-7">
    <div><h1 class="text-2xl font-semibold text-highlighted">{{ $t("reports.title") }}</h1><p class="mt-1 text-sm text-muted">{{ $t("reports.description") }}</p></div>
    <UCard>
      <template #header><h2 class="font-semibold">{{ $t("reports.query_title") }}</h2></template>
      <ClientOnly>
        <div class="grid gap-4 lg:grid-cols-4">
          <UFormField :label="$t('reports.query_type')"><USelect v-model="mode" :items="[{ label: $t('reports.single_day'), value: 'day' }, { label: $t('reports.period'), value: 'range' }]" /></UFormField>
          <UFormField :label="mode === 'day' ? $t('reports.day') : $t('inventory.start_date')"><UInput v-model="startDate" type="date" :max="maxDate" /></UFormField>
          <UFormField v-if="mode === 'range'" :label="$t('inventory.end_date')"><UInput v-model="endDate" type="date" :min="startDate || undefined" :max="maxDate" /></UFormField>
          <div class="flex items-end"><USwitch v-model="compareEnabled" :label="$t('reports.compare_period')" /></div>
        </div>
        <div v-if="compareEnabled" class="mt-4 grid gap-4 border-t border-default pt-4 lg:grid-cols-4">
          <UFormField :label="$t('reports.comparison_type')"><UInput :model-value="comparisonMode === 'day' ? $t('reports.single_day') : $t('reports.period')" disabled /></UFormField>
          <UFormField :label="comparisonMode === 'day' ? $t('reports.comparison_day') : $t('inventory.start_date')"><UInput v-model="comparisonStartDate" type="date" :max="comparisonMaxDate" /></UFormField>
          <UFormField v-if="comparisonMode === 'range'" :label="$t('inventory.end_date')"><UInput v-model="comparisonEndDate" type="date" :min="comparisonStartDate || undefined" :max="comparisonMaxDate" /></UFormField>
        </div>
        <template #fallback><USkeleton class="h-28 w-full" /></template>
      </ClientOnly>
      <UButton class="mt-5" icon="i-lucide-search" :disabled="!canQuery" :loading="pending" @click="applyQuery">{{ $t("reports.query_kpi") }}</UButton>
    </UCard>
    <UAlert v-if="error" color="error" :title="$t('reports.query_error')" :description="error.message" />
    <UCard v-else-if="!report && !pending"><p class="text-sm text-muted">{{ $t("reports.query_required") }}</p></UCard>
    <div v-else-if="pending" class="grid gap-4 md:grid-cols-3"><USkeleton v-for="i in 3" :key="i" class="h-28" /></div>
    <template v-else-if="report">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><NuxtLink v-for="metric in visibleMetrics" :key="metric.key" :to="metric.to ? lp(metric.to) : undefined" :class="metric.to ? 'block transition-transform hover:-translate-y-0.5' : ''"><DashboardMetricCard :label="metric.label" :value="display(metric)" icon="i-lucide-chart-no-axes-combined" :detail="report.previous ? `${comparisonDetail(metric, difference(metric.current, metric.previous))} ${$t('reports.vs_previous')}` : undefined" /></NuxtLink></section>
      <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]"><UCard v-if="report.previous"><template #header><h2 class="font-semibold">{{ $t("reports.comparison") }}</h2></template><UTable :data="visibleMetrics" :columns="comparisonColumns"><template #current-cell="{ row }">{{ display(row.original) }}</template><template #previous-cell="{ row }">{{ display(row.original, row.original.previous) }}</template><template #difference-cell="{ row }"><span class="font-medium" :class="comparisonClass(row.original, difference(row.original.current, row.original.previous))">{{ comparisonDetail(row.original, difference(row.original.current, row.original.previous)) }}</span></template></UTable></UCard><UCard><template #header><h2 class="font-semibold">{{ $t("reports.export") }}</h2></template><p class="mb-4 text-sm text-muted">{{ $t("reports.select_metrics") }}</p><UCheckbox v-for="metric in metricOptions" :key="metric.key" :model-value="isMetricSelected(metric.key)" :label="metric.label" class="mb-3" @update:model-value="setMetricSelected(metric.key, Boolean($event))" /><UButton class="mt-4 w-full" icon="i-lucide-download" :disabled="!selectedMetrics.length" @click="exportCsv">{{ $t("reports.export_csv") }}</UButton></UCard></section>
    </template>
  </div>
</template>
