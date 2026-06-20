<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  definePageMeta,
  useAsyncData,
  useDashboardModule,
  useI18n,
  useLocalePath,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.INVENTORY_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const { fetchSummary } = useDashboardModule();

type PeriodPreset = "today" | "last_7_days" | "month" | "last_30_days" | "custom";
type DashboardBlock = "sales" | "purchases" | "inventory" | "products";

const blockVisibility = reactive<Record<DashboardBlock, boolean>>({
  sales: true,
  purchases: true,
  inventory: true,
  products: true,
});

const periodOptions: { label: string; value: PeriodPreset }[] = [
  { label: t("dashboard.periods.today"), value: "today" },
  { label: t("dashboard.periods.last_7_days"), value: "last_7_days" },
  { label: t("dashboard.periods.month"), value: "month" },
  { label: t("dashboard.periods.last_30_days"), value: "last_30_days" },
  { label: t("dashboard.periods.custom"), value: "custom" },
];

const blockOptions: { key: DashboardBlock; label: string }[] = [
  { key: "sales", label: t("dashboard.blocks.sales") },
  { key: "purchases", label: t("dashboard.blocks.purchases") },
  { key: "inventory", label: t("dashboard.blocks.inventory") },
  { key: "products", label: t("dashboard.blocks.products") },
];

const selectedPeriod = ref<PeriodPreset>("month");
const customStartDate = ref(formatDateInput(startOfMonth(new Date())));
const customEndDate = ref(formatDateInput(new Date()));
const expirationWindowDays = ref(7);
const isConfigurationOpen = ref(false);

const visibleBlocksCount = computed(
  () => Object.values(blockVisibility).filter(Boolean).length
);

const dateRange = computed(() => {
  const today = new Date();

  if (selectedPeriod.value === "custom") {
    return {
      start_date: customStartDate.value,
      end_date: customEndDate.value,
    };
  }

  if (selectedPeriod.value === "today") {
    const date = formatDateInput(today);
    return { start_date: date, end_date: date };
  }

  if (selectedPeriod.value === "last_7_days") {
    return {
      start_date: formatDateInput(addDays(today, -6)),
      end_date: formatDateInput(today),
    };
  }

  if (selectedPeriod.value === "last_30_days") {
    return {
      start_date: formatDateInput(addDays(today, -29)),
      end_date: formatDateInput(today),
    };
  }

  return {
    start_date: formatDateInput(startOfMonth(today)),
    end_date: formatDateInput(today),
  };
});

const summaryParams = computed(() => ({
  ...dateRange.value,
  expiration_window_days: expirationWindowDays.value,
}));

const { data: summary, pending } = await useAsyncData(
  "dashboard-summary",
  () => fetchSummary(summaryParams.value),
  { watch: [summaryParams] }
);

const salesCards = computed(() => [
  {
    label: t("dashboard.metrics.sales_total"),
    value: formatPeso(summary.value?.sales.total),
    icon: "i-lucide-banknote",
    to: lp("/sales"),
  },
  {
    label: t("dashboard.metrics.sales_count"),
    value: String(summary.value?.sales.count ?? 0),
    icon: "i-lucide-receipt",
    to: lp("/sales"),
  },
  {
    label: t("dashboard.metrics.items_sold"),
    value: Number(summary.value?.sales.items_sold ?? 0).toFixed(2),
    icon: "i-lucide-package-check",
    to: lp("/sales"),
  },
]);

const purchaseCards = computed(() => [
  {
    label: t("dashboard.metrics.purchases_total"),
    value: formatPeso(summary.value?.purchases.total),
    icon: "i-lucide-shopping-cart",
    to: lp("/purchases"),
  },
  {
    label: t("dashboard.metrics.purchases_count"),
    value: String(summary.value?.purchases.count ?? 0),
    icon: "i-lucide-clipboard-list",
    to: lp("/purchases"),
  },
]);

const inventoryCards = computed(() => [
  {
    label: t("dashboard.metrics.inventory_value"),
    value: formatPeso(summary.value?.inventory.inventory_value),
    icon: "i-lucide-warehouse",
    to: lp("/inventory"),
  },
  {
    label: t("dashboard.metrics.low_stock_materials"),
    value: String(summary.value?.inventory.low_stock_materials ?? 0),
    icon: "i-lucide-triangle-alert",
    to: lp("/inventory/alerts"),
  },
  {
    label: t("dashboard.metrics.expiring_batches"),
    value: String(summary.value?.inventory.expiring_batches ?? 0),
    icon: "i-lucide-calendar-clock",
    to: lp("/inventory/alerts"),
  },
  {
    label: t("dashboard.metrics.expired_batches"),
    value: String(summary.value?.inventory.expired_batches ?? 0),
    icon: "i-lucide-calendar-x",
    to: lp("/inventory/alerts"),
  },
]);

const maxDailySales = computed(() => {
  const values = summary.value?.sales_by_day.map((item) => Number(item.total)) ?? [];
  return Math.max(...values, 1);
});

const maxTopProductQuantity = computed(() => {
  const values = summary.value?.top_products.map((item) => Number(item.quantity)) ?? [];
  return Math.max(...values, 1);
});

function metricWidth(value: string | number, max: number): string {
  return `${Math.max(4, (Number(value) / max) * 100)}%`;
}

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function showAllBlocks(): void {
  Object.keys(blockVisibility).forEach((key) => {
    blockVisibility[key as DashboardBlock] = true;
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          {{ $t("dashboard.menu_title") }}
        </h1>
        <p class="text-sm text-muted mt-1">
          {{ $t("dashboard.subtitle") }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UFormField :label="$t('dashboard.period')">
          <USelect
            v-model="selectedPeriod"
            :items="periodOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="selectedPeriod === 'custom'"
          :label="$t('dashboard.start_date')"
        >
          <UInput
            v-model="customStartDate"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="selectedPeriod === 'custom'"
          :label="$t('dashboard.end_date')"
        >
          <UInput
            v-model="customEndDate"
            type="date"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('dashboard.expiration_window_days')">
          <UInputNumber
            v-model="expirationWindowDays"
            :min="1"
            class="w-full"
          />
        </UFormField>

        <div class="flex items-end">
          <UButton
            icon="i-lucide-sliders-horizontal"
            color="neutral"
            variant="outline"
            class="w-full justify-center"
            @click="isConfigurationOpen = true"
          >
            {{
              $t("dashboard.configure_view_with_count", {
                visible: visibleBlocksCount,
                total: blockOptions.length,
              })
            }}
          </UButton>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="isConfigurationOpen"
      :title="$t('dashboard.configure_view')"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{ $t("dashboard.configure_view_description") }}
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <UCheckbox
              v-for="block in blockOptions"
              :key="block.key"
              v-model="blockVisibility[block.key]"
              :label="block.label"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between gap-3 w-full">
          <UButton color="neutral" variant="ghost" @click="showAllBlocks">
            {{ $t("dashboard.show_all_blocks") }}
          </UButton>
          <UButton @click="isConfigurationOpen = false">
            {{ $t("common.confirm") }}
          </UButton>
        </div>
      </template>
    </UModal>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="index in 4" :key="index" class="h-28 rounded-lg" />
    </div>

    <template v-else-if="summary">
      <section v-if="blockVisibility.sales" class="space-y-4">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ $t("dashboard.blocks.sales") }}
        </h2>

        <div class="grid gap-4 md:grid-cols-3">
          <UCard v-for="card in salesCards" :key="card.label">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm text-muted">
                  {{ card.label }}
                </p>
                <p class="text-2xl font-semibold text-highlighted mt-1">
                  {{ card.value }}
                </p>
                <UButton
                  :to="card.to"
                  size="xs"
                  color="neutral"
                  variant="link"
                  class="px-0 mt-2"
                >
                  {{ $t("dashboard.view_detail") }}
                </UButton>
              </div>
              <UIcon :name="card.icon" class="size-8 text-primary" />
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            {{ $t("dashboard.sales_by_day") }}
          </template>

          <div v-if="summary.sales_by_day.length" class="space-y-3">
            <div
              v-for="item in summary.sales_by_day"
              :key="item.date"
              class="grid gap-2 sm:grid-cols-[8rem_1fr_8rem] sm:items-center"
            >
              <span class="text-sm text-muted">
                {{ formatDisplayDate(item.date) }}
              </span>
              <div class="h-2 rounded-full bg-accented overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary"
                  :style="{ width: metricWidth(item.total, maxDailySales) }"
                />
              </div>
              <span class="text-sm font-medium text-highlighted sm:text-right">
                {{ formatPeso(item.total) }}
              </span>
            </div>
          </div>
          <p v-else class="text-sm text-muted">
            {{ $t("dashboard.no_sales_by_day") }}
          </p>
        </UCard>
      </section>

      <section v-if="blockVisibility.purchases" class="space-y-4">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ $t("dashboard.blocks.purchases") }}
        </h2>

        <div class="grid gap-4 md:grid-cols-2">
          <UCard v-for="card in purchaseCards" :key="card.label">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm text-muted">
                  {{ card.label }}
                </p>
                <p class="text-2xl font-semibold text-highlighted mt-1">
                  {{ card.value }}
                </p>
                <UButton
                  :to="card.to"
                  size="xs"
                  color="neutral"
                  variant="link"
                  class="px-0 mt-2"
                >
                  {{ $t("dashboard.view_detail") }}
                </UButton>
              </div>
              <UIcon :name="card.icon" class="size-8 text-primary" />
            </div>
          </UCard>
        </div>
      </section>

      <section v-if="blockVisibility.inventory" class="space-y-4">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ $t("dashboard.blocks.inventory") }}
        </h2>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <UCard v-for="card in inventoryCards" :key="card.label">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm text-muted">
                  {{ card.label }}
                </p>
                <p class="text-2xl font-semibold text-highlighted mt-1">
                  {{ card.value }}
                </p>
                <UButton
                  :to="card.to"
                  size="xs"
                  color="neutral"
                  variant="link"
                  class="px-0 mt-2"
                >
                  {{ $t("dashboard.view_detail") }}
                </UButton>
              </div>
              <UIcon :name="card.icon" class="size-8 text-primary" />
            </div>
          </UCard>
        </div>
      </section>

      <section v-if="blockVisibility.products" class="space-y-4">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ $t("dashboard.blocks.products") }}
        </h2>

        <UCard>
          <template #header>
            {{ $t("dashboard.top_products") }}
          </template>

          <div v-if="summary.top_products.length" class="space-y-4">
            <div
              v-for="product in summary.top_products"
              :key="product.product_id"
              class="space-y-2"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium text-highlighted">
                  {{ product.product_name }}
                </span>
                <span class="text-sm text-muted">
                  {{ formatPeso(product.total) }}
                </span>
              </div>
              <div class="h-2 rounded-full bg-accented overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary"
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
    </template>
  </div>
</template>
