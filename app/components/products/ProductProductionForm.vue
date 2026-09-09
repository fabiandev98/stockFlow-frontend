<script setup lang="ts">
import { computed, reactive, ref, useAsyncData, useI18n, useInventoryModule, useLocalePath, useMaterialModule, useProductModule, useToast, watch } from "#imports";
import { FetchError } from "ofetch";
import type { Material } from "~/types/material";
import type { Product, ProductProductionPayload } from "~/types/product";
import { formatDisplayDate } from "~/utils/date-format";
import { formatQuantity } from "~/utils/quantity-format";

const props = defineProps<{ productId: number }>();
const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const { fetchProductById, createProductProduction, fetchProducts } = useProductModule();
const { fetchMaterials } = useMaterialModule();
const { fetchStockBatches, fetchProductBatches } = useInventoryModule();
const isSubmitting = ref(false);
const nextKey = ref(1);

const { data: product } = await useAsyncData(`product-production-${props.productId}`, () => fetchProductById(props.productId));
const { data: materials } = await useAsyncData("production-materials", () => fetchMaterials({}));
const { data: stockBatches } = await useAsyncData("production-material-batches", () => fetchStockBatches({ filters: { status: "available" }, perPage: 250 }));
const { data: preparations } = await useAsyncData("production-preparations", () => fetchProducts({ filters: { is_active: true, is_internal_preparation: true } }));
const { data: productBatches } = await useAsyncData("production-preparation-batches", () => fetchProductBatches({ filters: { status: "available" }, perPage: 250 }));

type UsageRow = { key: number; source: "material" | "preparation"; material_id: number | null; stock_batch_id: number | null; source_product_id: number | null; product_batch_id: number | null; quantity: number };
function materialRow(materialId: number | null = null, quantity = 1, stockBatchId: number | null = null): UsageRow {
  return { key: nextKey.value++, source: "material", material_id: materialId, stock_batch_id: stockBatchId, source_product_id: null, product_batch_id: null, quantity };
}
function preparationRow(): UsageRow {
  return { key: nextKey.value++, source: "preparation", material_id: null, stock_batch_id: null, source_product_id: null, product_batch_id: null, quantity: 1 };
}

const state = reactive<{ planned_quantity: number | null; produced_quantity: number; production_date: string; expiration_date: string | null; expiration_override_reason: string | null; notes: string | null; usages: UsageRow[] }>({
  planned_quantity: null,
  produced_quantity: 1,
  production_date: new Date().toISOString().slice(0, 10),
  expiration_date: null,
  expiration_override_reason: null,
  notes: null,
  usages: product.value?.compositions?.map((item) => materialRow(item.material_id, Number(item.quantity_required))) ?? [],
});
const previousProducedQuantity = ref(state.produced_quantity);

watch(() => state.produced_quantity, (producedQuantity) => {
  const previousQuantity = previousProducedQuantity.value;
  if (producedQuantity <= 0 || previousQuantity <= 0 || producedQuantity === previousQuantity) return;

  const factor = producedQuantity / previousQuantity;
  state.usages.forEach((usage) => {
    usage.quantity = Math.round(usage.quantity * factor * 10000) / 10000;
  });
  previousProducedQuantity.value = producedQuantity;
});

const materialItems = computed<Material[]>(() => materials.value?.data ?? []);
const preparationItems = computed<Product[]>(() =>
  (preparations.value?.data ?? []).filter((preparation) => preparation.id !== props.productId)
);

function selectedIds(current: UsageRow): Set<number> {
  return new Set(state.usages.map((usage) => usage.source === "material" ? usage.stock_batch_id : usage.product_batch_id).filter((id): id is number => id !== null && id !== (current.source === "material" ? current.stock_batch_id : current.product_batch_id)));
}
function materialBatchItems(usage: UsageRow) {
  return (stockBatches.value?.data ?? []).filter((batch) => batch.material_id === usage.material_id).filter((batch) => !batch.expiration_date || batch.expiration_date >= state.production_date).map((batch) => ({ value: batch.id, label: `#${batch.id} · ${formatQuantity(batch.available_quantity, batch.material?.unit)}${batch.expiration_date ? ` · ${t("common.expires_on")}: ${formatDisplayDate(batch.expiration_date)}` : ""}`, disabled: selectedIds(usage).has(batch.id) }));
}
function preparationBatchItems(usage: UsageRow) {
  return (productBatches.value?.data ?? []).filter((batch) => batch.product_id === usage.source_product_id).filter((batch) => !batch.expiration_date || batch.expiration_date >= state.production_date).map((batch) => ({ value: batch.id, label: `#${batch.id} · ${formatQuantity(batch.available_quantity)}${batch.expiration_date ? ` · ${t("common.expires_on")}: ${formatDisplayDate(batch.expiration_date)}` : ""}`, disabled: selectedIds(usage).has(batch.id) }));
}
function exceeds(usage: UsageRow) {
  const batch = usage.source === "material" ? (stockBatches.value?.data ?? []).find((item) => item.id === usage.stock_batch_id) : (productBatches.value?.data ?? []).find((item) => item.id === usage.product_batch_id);
  return batch && usage.quantity > Number(batch.available_quantity);
}
function removeUsage(index: number) { state.usages.splice(index, 1); }
function assignFefo(index: number) {
  const usage = state.usages[index];
  if (!usage || usage.source !== "material" || !usage.material_id || usage.quantity <= 0) return;

  const usedByOthers = new Set(state.usages.filter((item, itemIndex) => itemIndex !== index).map((item) => item.stock_batch_id).filter((id): id is number => id !== null));
  const candidates = (stockBatches.value?.data ?? [])
    .filter((batch) => batch.material_id === usage.material_id)
    .filter((batch) => !usedByOthers.has(batch.id))
    .filter((batch) => !batch.expiration_date || batch.expiration_date >= state.production_date)
    .sort((first, second) => (first.expiration_date ?? "9999-12-31").localeCompare(second.expiration_date ?? "9999-12-31"));
  let remaining = usage.quantity;
  const allocations: UsageRow[] = [];
  for (const batch of candidates) {
    if (remaining <= 0) break;
    const quantity = Math.min(remaining, Number(batch.available_quantity));
    if (quantity > 0) allocations.push(materialRow(usage.material_id, quantity, batch.id));
    remaining -= quantity;
  }
  if (remaining > 0) allocations.push(materialRow(usage.material_id, remaining));
  state.usages.splice(index, 1, ...allocations);
  if (remaining > 0) toast.add({ title: t("common.generic_error_title"), description: t("products.fefo_insufficient_stock"), color: "warning" });
}

async function submit() {
  const ids = state.usages.map((usage) => usage.source === "material" ? usage.stock_batch_id : usage.product_batch_id).filter((id): id is number => id !== null);
  if (!product.value || state.usages.length === 0 || new Set(ids).size !== ids.length || state.usages.some((usage) => !(usage.source === "material" ? usage.stock_batch_id : usage.product_batch_id) || usage.quantity <= 0 || exceeds(usage))) return;
  isSubmitting.value = true;
  try {
    const payload: ProductProductionPayload = { ...state, usages: state.usages.map(({ stock_batch_id, product_batch_id, quantity }) => ({ stock_batch_id, product_batch_id, quantity })) };
    await createProductProduction(product.value.id, payload);
  } catch (error: unknown) {
    toast.add({ title: t("common.generic_error_title"), description: error instanceof FetchError ? error.data?.message ?? error.message : t("common.generic_unknown_error"), color: "error" });
    return;
  } finally { isSubmitting.value = false; }
  toast.add({ title: t("products.production_created"), color: "success" });
  try {
    await navigateTo(lp("/products"));
  } catch {
    // The production is already persisted; a navigation problem must not be reported as a save error.
  }
}
</script>

<template>
  <div v-if="product" class="space-y-5">
    <div><h1 class="text-2xl font-semibold">{{ $t("products.register_production") }}: {{ product.name }}</h1><p class="text-sm text-muted">{{ $t("products.production_recipe_hint") }}</p></div>
    <UForm class="space-y-5" @submit="submit">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <UFormField :label="$t('products.planned_quantity')"><UInput v-model.number="state.planned_quantity" type="number" min="0.01" step="0.01" class="w-full" /></UFormField>
        <UFormField :label="$t('products.produced_quantity')" required><UInput v-model.number="state.produced_quantity" type="number" min="0.01" step="0.01" class="w-full" /></UFormField>
        <UFormField :label="$t('products.production_date')" required><UInput v-model="state.production_date" type="date" class="w-full" /></UFormField>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2"><h2 class="font-medium">{{ $t("products.real_materials") }}</h2><div class="flex gap-2"><UButton type="button" icon="i-lucide-plus" variant="soft" @click="state.usages.push(materialRow())">{{ $t("products.add_material") }}</UButton><UButton type="button" icon="i-lucide-plus" variant="soft" @click="state.usages.push(preparationRow())">{{ $t("products.add_preparation") }}</UButton></div></div>
      <div v-for="(usage, index) in state.usages" :key="usage.key" class="grid grid-cols-1 items-end gap-3 rounded-lg border border-default bg-elevated/30 p-4 md:grid-cols-12">
        <UFormField v-if="usage.source === 'material'" :label="$t('products.material')" class="md:col-span-4"><div class="flex gap-2"><USelect v-model="usage.material_id" :items="materialItems" value-key="id" label-key="name" class="w-full" @update:model-value="usage.stock_batch_id = null" /><UTooltip :text="$t('products.assign_fefo_help')"><UButton v-if="usage.material_id" type="button" size="sm" icon="i-lucide-sparkles" variant="soft" square @click="assignFefo(index)" /></UTooltip></div></UFormField>
        <UFormField v-else :label="$t('products.preparation')" class="md:col-span-4"><USelect v-model="usage.source_product_id" :items="preparationItems" value-key="id" label-key="name" class="w-full" @update:model-value="usage.product_batch_id = null" /></UFormField>
        <UFormField :label="$t('inventory.batch')" class="md:col-span-4"><USelect v-if="usage.source === 'material'" v-model="usage.stock_batch_id" :items="materialBatchItems(usage)" :placeholder="usage.material_id && materialBatchItems(usage).length === 0 ? $t('products.no_valid_batches_for_production_date') : $t('inventory.batch')" value-key="value" label-key="label" class="w-full" /><USelect v-else v-model="usage.product_batch_id" :items="preparationBatchItems(usage)" :placeholder="$t('inventory.batch')" value-key="value" label-key="label" class="w-full" /></UFormField>
        <UFormField :label="$t('purchases.quantity')" class="md:col-span-2"><UInput v-model.number="usage.quantity" type="number" min="0.01" step="0.01" class="w-full" /><p v-if="exceeds(usage)" class="text-xs text-error">{{ $t("inventory.quantity_exceeds_available") }}</p></UFormField>
        <UButton type="button" color="error" variant="ghost" icon="i-lucide-trash" class="md:col-span-1" @click="removeUsage(index)" />
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2"><UFormField :label="$t('products.expiration_date')"><UInput v-model="state.expiration_date" type="date" class="w-full" /></UFormField><UFormField :label="$t('products.expiration_override_reason')"><UInput v-model="state.expiration_override_reason" class="w-full" /></UFormField></div>
      <UFormField :label="$t('sales.notes')"><UTextarea v-model="state.notes" class="w-full" /></UFormField>
      <UButton type="submit" color="primary" :loading="isSubmitting">{{ $t("products.register_production") }}</UButton>
    </UForm>
  </div>
</template>
