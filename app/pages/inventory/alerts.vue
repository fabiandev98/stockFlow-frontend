<script setup lang="ts">
import { computed, ref } from "vue";
import { definePageMeta, useAsyncData, useI18n, useInventoryModule, useLocalePath, useState } from "#imports";
import { PERMISSION } from "~/constants/permissions";
import type { InventoryMaterial, InventoryStockBatch } from "~/types/inventory";
import type { ProductBatch } from "~/types/purchase";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.INVENTORY_READ] });

const lp = useLocalePath();
const { t } = useI18n();
const { fetchInventoryAlerts } = useInventoryModule();
const filter = ref("");
const expiryAge = ref<"all" | "recent" | "older">("all");
const alertReferenceDay = useState("inventory-alerts-reference-day", () => {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
});
const { data } = await useAsyncData("inventory-alerts", () => fetchInventoryAlerts());

function quantity(value: string | number | null | undefined, unit?: string): string {
  return `${Number(value ?? 0).toFixed(2)}${unit ? ` ${unit}` : ""}`;
}
function batchMaterial(batch: InventoryStockBatch): string { return batch.material?.name ?? `#${batch.material_id}`; }
function supplier(batch: InventoryStockBatch): string { return batch.purchase_item?.purchase?.supplier?.name ?? "-"; }
function batchValue(batch: InventoryStockBatch): number { return Number(batch.available_quantity) * Number(batch.unit_cost); }
function productBatchValue(batch: ProductBatch): number { return Number(batch.available_quantity) * Number(batch.unit_cost); }
function batchProduct(batch: ProductBatch): string { return batch.product?.name ?? `#${batch.product_id}`; }
function daysExpired(batch: Pick<InventoryStockBatch, "expiration_date">): number {
  if (!batch.expiration_date) return 0;
  const expiration = Date.parse(`${batch.expiration_date.slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.floor((alertReferenceDay.value - expiration) / 86_400_000));
}
function stockLabel(material: InventoryMaterial): string { return quantity(material.available_stock, material.unit); }

const expiredBatches = computed(() => (data.value?.expired_batches ?? [])
  .filter((batch) => {
    const query = filter.value.trim().toLowerCase();
    const matchesText = !query || `${batchMaterial(batch)} ${supplier(batch)}`.toLowerCase().includes(query);
    const age = daysExpired(batch);
    const matchesAge = expiryAge.value === "all" || (expiryAge.value === "recent" ? age <= 30 : age > 30);
    return matchesText && matchesAge;
  })
  .sort((a, b) => batchValue(b) - batchValue(a) || daysExpired(b) - daysExpired(a)));
const totalExpiredValue = computed(() =>
  (data.value?.expired_batches ?? []).reduce((total, batch) => total + batchValue(batch), 0)
  + (data.value?.expired_product_batches ?? []).reduce((total, batch) => total + productBatchValue(batch), 0)
);
const totalExpiredQuantity = computed(() =>
  (data.value?.expired_batches ?? []).reduce((total, batch) => total + Number(batch.available_quantity), 0)
  + (data.value?.expired_product_batches ?? []).reduce((total, batch) => total + Number(batch.available_quantity), 0)
);
const topSupplier = computed(() => {
  const totals = new Map<string, number>();
  for (const batch of data.value?.expired_batches ?? []) totals.set(supplier(batch), (totals.get(supplier(batch)) ?? 0) + batchValue(batch));
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
});
const expiredProductBatches = computed(() => [...(data.value?.expired_product_batches ?? [])]
  .sort((a, b) => productBatchValue(b) - productBatchValue(a) || daysExpired(a) - daysExpired(b)));
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">{{ $t("inventory.alerts") }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t("inventory.alerts_description") }}</p>
    </div>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardMetricCard :label="$t('inventory.low_stock')" :value="String(data?.low_stock_materials.length ?? 0)" icon="i-lucide-package-search" />
      <DashboardMetricCard :label="$t('inventory.expired_with_stock')" :value="String((data?.expired_batches.length ?? 0) + (data?.expired_product_batches.length ?? 0))" icon="i-lucide-circle-alert" />
      <DashboardMetricCard :label="$t('inventory.committed_value')" :value="formatPeso(totalExpiredValue)" icon="i-lucide-badge-dollar-sign" />
      <DashboardMetricCard :label="$t('inventory.most_affected_supplier')" :value="topSupplier" icon="i-lucide-truck" />
    </section>

    <section class="space-y-3">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><div class="flex items-center gap-1"><h2 class="text-lg font-semibold text-highlighted">{{ $t("inventory.expired_with_stock") }}</h2><UTooltip :text="$t('inventory.expired_stock_help')"><UButton icon="i-lucide-circle-help" color="neutral" variant="link" square :aria-label="$t('inventory.expired_stock_help')" /></UTooltip></div><p class="text-sm text-muted">{{ $t("inventory.expired_stock_summary", { quantity: quantity(totalExpiredQuantity) }) }}</p></div>
        <div class="flex flex-col gap-3 sm:flex-row"><UInput v-model="filter" icon="i-lucide-search" :placeholder="$t('inventory.filter_material_or_supplier')" /><USelect v-model="expiryAge" :items="[{ label: $t('inventory.all_expired'), value: 'all' }, { label: $t('inventory.expired_last_30_days'), value: 'recent' }, { label: $t('inventory.expired_over_30_days'), value: 'older' }]" /></div>
      </div>
      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <div class="hidden grid-cols-[minmax(13rem,1.5fr)_minmax(7rem,.6fr)_minmax(9rem,.8fr)_minmax(8rem,.7fr)_minmax(11rem,1fr)_2.5rem] gap-4 border-b border-default px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
          <span>{{ $t("inventory.batch_material") }}</span><span class="text-right">{{ $t("purchases.quantity") }}</span><span>{{ $t("inventory.expired_days") }}</span><span class="text-right">{{ $t("inventory.lost_value") }}</span><span>{{ $t("suppliers.menu_title") }}</span><span class="text-center">{{ $t("inventory.action") }}</span>
        </div>
        <div v-for="batch in expiredBatches" :key="batch.id" class="grid gap-2 border-b border-default p-4 last:border-0 md:grid-cols-[minmax(13rem,1.5fr)_minmax(7rem,.6fr)_minmax(9rem,.8fr)_minmax(8rem,.7fr)_minmax(11rem,1fr)_2.5rem] md:items-center md:gap-4">
          <div><p class="font-semibold text-highlighted">#{{ batch.id }} · {{ batchMaterial(batch) }}</p><p class="mt-1 text-xs text-muted md:hidden">{{ supplier(batch) }}</p></div>
          <p class="md:text-right"><span class="mr-2 text-xs text-muted md:hidden">{{ $t("purchases.quantity") }}:</span>{{ quantity(batch.available_quantity, batch.material?.unit) }}</p>
          <p class="text-error"><span class="mr-2 text-xs text-muted md:hidden">{{ $t("inventory.expired_days") }}:</span>{{ t("inventory.days", { count: daysExpired(batch) }) }} · {{ formatDisplayDate(batch.expiration_date) }}</p>
          <p class="font-medium md:text-right"><span class="mr-2 text-xs text-muted md:hidden">{{ $t("inventory.lost_value") }}:</span>{{ formatPeso(batchValue(batch)) }}</p>
          <p class="hidden text-sm text-muted md:block">{{ supplier(batch) }}</p>
          <UTooltip :text="$t('inventory.register_waste')"><UButton :to="lp(`/inventory/movements/create?batch=${batch.id}&type=expired`)" color="error" variant="link" icon="i-lucide-trash-2" size="sm" square class="justify-self-center" :aria-label="$t('inventory.register_waste')" /></UTooltip>
        </div>
        <p v-if="!expiredBatches.length" class="p-6 text-center text-sm text-muted">{{ $t("inventory.expired_filter_empty") }}</p>
      </UCard>
    </section>

    <UCard v-if="expiredProductBatches.length" :ui="{ body: 'p-0 sm:p-0' }">
      <template #header><h2 class="font-semibold">{{ $t("inventory.expired_product_batches") }}</h2></template>
      <div v-for="batch in expiredProductBatches" :key="batch.id" class="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-default px-4 py-3 last:border-0">
        <div class="min-w-44 flex-1"><p class="font-semibold text-highlighted">#{{ batch.id }} · {{ batchProduct(batch) }}</p><p class="text-xs text-muted">{{ quantity(batch.available_quantity) }}</p></div>
        <p class="text-sm text-error">{{ t("inventory.days", { count: daysExpired(batch) }) }} · {{ formatDisplayDate(batch.expiration_date) }}</p>
        <p class="font-medium">{{ formatPeso(productBatchValue(batch)) }}</p>
        <UTooltip :text="$t('inventory.register_waste')"><UButton :to="lp(`/inventory/product-movements/create?batch=${batch.id}&type=expired`)" color="error" variant="link" icon="i-lucide-trash-2" size="sm" square :aria-label="$t('inventory.register_waste')" /></UTooltip>
      </div>
    </UCard>

    <section class="grid gap-5 xl:grid-cols-2">
      <UCard><template #header><h2 class="font-semibold">{{ $t("inventory.low_stock_materials") }}</h2></template><div v-for="material in data?.low_stock_materials ?? []" :key="material.id" class="flex items-center justify-between border-b border-default py-3 last:border-0"><div><p class="font-medium">{{ material.name }}</p><p class="text-sm text-muted">{{ material.category?.name ?? "-" }}</p></div><p class="text-sm">{{ stockLabel(material) }} / {{ quantity(material.minimum_stock, material.unit) }}</p></div><p v-if="!data?.low_stock_materials.length" class="text-sm text-muted">{{ $t("inventory.no_low_stock_alerts") }}</p></UCard>
      <UCard><template #header><h2 class="font-semibold">{{ $t("inventory.expiring_batches") }}</h2></template><div v-for="batch in data?.expiring_batches ?? []" :key="batch.id" class="flex items-center justify-between border-b border-default py-3 last:border-0"><div><p class="font-medium">#{{ batch.id }} · {{ batchMaterial(batch) }}</p><p class="text-sm text-muted">{{ quantity(batch.available_quantity, batch.material?.unit) }}</p></div><p class="text-sm text-warning">{{ formatDisplayDate(batch.expiration_date) }}</p></div><p v-if="!data?.expiring_batches.length" class="text-sm text-muted">{{ $t("inventory.no_expiring_alerts") }}</p></UCard>
    </section>
  </div>
</template>
