<script setup lang="ts">
import { computed, navigateTo, reactive, ref, useAsyncData, useI18n, useInventoryModule, useLocalePath, useMaterialModule, useToast } from "#imports";
import { FetchError } from "ofetch";
import type { Material, ProcessedMaterialComponent } from "~/types/material";
import type { StockBatch } from "~/types/purchase";
import { formatDisplayDate } from "~/utils/date-format";
import { formatQuantity } from "~/utils/quantity-format";

type InputRow = { key: number; material_id: number; stock_batch_id: number | null; quantity: number };
type ProcessingItem = { key: number; material: Material; output_quantity: number; expiration_date: string | null; inputs: InputRow[]; excluded_material_ids: number[] };

const { t } = useI18n();
const toast = useToast();
const lp = useLocalePath();
const { fetchMaterials, fetchMaterialById } = useMaterialModule();
const { createMaterialProcessingBatch, fetchStockBatches } = useInventoryModule();
const saving = ref(false);
const loadingMaterialId = ref<number | null>(null);
const selectedMaterialId = ref<number | null>(null);
const nextKey = ref(1);
const items = ref<ProcessingItem[]>([]);
const state = reactive({ processed_at: new Date().toISOString().slice(0, 10), notes: null as string | null });
const { data: materials } = await useAsyncData("material-processing-materials", () => fetchMaterials({}));
const { data: stockBatches } = await useAsyncData("material-processing-stock-batches", () => fetchStockBatches({ filters: { status: "available" }, perPage: 250 }));

const availableMaterials = computed(() => (materials.value?.data ?? []).filter((material) => material.processing_type === "processed" && !items.value.some((item) => item.material.id === material.id)));
const batches = computed<StockBatch[]>(() => stockBatches.value?.data ?? []);
function components(item: ProcessingItem): ProcessedMaterialComponent[] { return item.material.processing_components ?? []; }
function expected(component: ProcessedMaterialComponent, item: ProcessingItem): number { return Math.round(Number(component.quantity_per_unit) * item.output_quantity * 10000) / 10000; }
function rows(item: ProcessingItem, materialId: number): InputRow[] { return item.inputs.filter((input) => input.material_id === materialId); }
function isExcluded(item: ProcessingItem, materialId: number): boolean { return item.excluded_material_ids.includes(materialId); }
function batch(input: InputRow): StockBatch | undefined { return batches.value.find((candidate) => candidate.id === input.stock_batch_id); }
function validBatches(materialId: number): StockBatch[] { return batches.value.filter((candidate) => candidate.material_id === materialId).filter((candidate) => !candidate.expiration_date || candidate.expiration_date >= state.processed_at).sort((a, b) => (a.expiration_date ?? "9999-12-31").localeCompare(b.expiration_date ?? "9999-12-31") || a.id - b.id); }
function batchItems(item: ProcessingItem, input: InputRow) {
  const used = new Set(item.inputs.filter((candidate) => candidate.key !== input.key).map((candidate) => candidate.stock_batch_id).filter((id): id is number => id !== null));
  return validBatches(input.material_id).map((candidate) => ({ value: candidate.id, label: `#${candidate.id} · ${formatQuantity(candidate.available_quantity, candidate.material?.unit)}${candidate.expiration_date ? ` · ${t("common.expires_on")}: ${formatDisplayDate(candidate.expiration_date)}` : ""}`, disabled: used.has(candidate.id) }));
}
function addInput(item: ProcessingItem, materialId: number, quantity = 0, stockBatchId: number | null = null): void { item.inputs.push({ key: nextKey.value++, material_id: materialId, stock_batch_id: stockBatchId, quantity }); }
function removeInput(item: ProcessingItem, key: number): void {
  const removed = item.inputs.find((input) => input.key === key);
  item.inputs = item.inputs.filter((input) => input.key !== key);

  if (removed && rows(item, removed.material_id).length === 0 && !isExcluded(item, removed.material_id)) {
    item.excluded_material_ids.push(removed.material_id);
  }
}
function assignFefo(item: ProcessingItem, component: ProcessedMaterialComponent): void {
  item.excluded_material_ids = item.excluded_material_ids.filter((materialId) => materialId !== component.raw_material_id);
  item.inputs = item.inputs.filter((input) => input.material_id !== component.raw_material_id);
  let remaining = expected(component, item);
  for (const candidate of validBatches(component.raw_material_id)) {
    if (remaining <= 0) break;
    const quantity = Math.min(remaining, Number(candidate.available_quantity));
    if (quantity > 0) addInput(item, component.raw_material_id, quantity, candidate.id);
    remaining = Math.round((remaining - quantity) * 10000) / 10000;
  }
  if (remaining > 0) { addInput(item, component.raw_material_id, remaining); toast.add({ title: t("common.generic_error_title"), description: t("products.fefo_insufficient_stock"), color: "warning" }); }
}
function total(item: ProcessingItem, materialId: number): number { return rows(item, materialId).reduce((sum, input) => sum + Number(input.quantity || 0), 0); }
function exceeds(input: InputRow): boolean { return input.quantity > Number(batch(input)?.available_quantity ?? 0); }
function invalidItem(item: ProcessingItem): boolean {
  return components(item).length === 0 || item.output_quantity <= 0 || item.inputs.length === 0 || item.inputs.some((input) => !input.stock_batch_id || input.quantity <= 0 || exceeds(input)) || components(item).some((component) => !isExcluded(item, component.raw_material_id) && total(item, component.raw_material_id) + 0.0001 < expected(component, item));
}
async function addProcessedMaterial(): Promise<void> {
  const id = selectedMaterialId.value;
  if (!id || loadingMaterialId.value) return;
  loadingMaterialId.value = id;
  try {
    const material = await fetchMaterialById(id);
    const item: ProcessingItem = { key: nextKey.value++, material, output_quantity: 1, expiration_date: null, inputs: [], excluded_material_ids: [] };
    items.value.push(item);
    components(item).forEach((component) => assignFefo(item, component));
    selectedMaterialId.value = null;
  } finally { loadingMaterialId.value = null; }
}
function removeItem(key: number): void { items.value = items.value.filter((item) => item.key !== key); }
function updateQuantity(item: ProcessingItem): void { components(item).filter((component) => !isExcluded(item, component.raw_material_id)).forEach((component) => assignFefo(item, component)); }
function setOutputQuantity(item: ProcessingItem, value: string | number | null): void {
  item.output_quantity = Number(value) || 0;
  updateQuantity(item);
}
async function submit(): Promise<void> {
  if (saving.value || items.value.length === 0 || items.value.some(invalidItem)) return;
  saving.value = true;
  try {
    await createMaterialProcessingBatch({ processed_at: state.processed_at, notes: state.notes?.trim() || null, items: items.value.map((item) => ({ output_material_id: item.material.id, output_quantity: item.output_quantity, expiration_date: item.expiration_date, inputs: item.inputs.map(({ stock_batch_id, quantity }) => ({ stock_batch_id, quantity })) })) });
    toast.add({ title: t("inventory.processing_saved"), color: "success" });
    await navigateTo(lp("/inventory/movements"));
  } catch (error: unknown) {
    toast.add({ title: t("common.generic_error_title"), description: error instanceof FetchError ? t("common.generic_error", { context: `${error.statusCode} - ${error.data?.message ?? error.message}` }) : t("common.generic_unknown_error"), color: "error" });
  } finally { saving.value = false; }
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="submit">
    <div class="rounded-xl border border-default p-5">
      <h2 class="font-semibold">{{ $t("inventory.process_material") }}</h2><p class="mt-1 text-sm text-muted">{{ $t("inventory.process_material_description") }}</p>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <UFormField :label="$t('inventory.processed_material')"><USelect v-model="selectedMaterialId" :items="availableMaterials" value-key="id" label-key="name" :placeholder="$t('inventory.select_processed_material')" :loading="loadingMaterialId !== null" class="w-full" @update:model-value="addProcessedMaterial" /></UFormField>
        <UFormField :label="$t('inventory.movement_date')" required><UInput v-model="state.processed_at" type="date" class="w-full" /></UFormField>
      </div>
    </div>

    <p v-if="!items.length" class="rounded-lg border border-dashed border-default p-5 text-sm text-muted">{{ $t("inventory.select_processed_material") }}</p>
    <section v-for="item in items" :key="item.key" class="space-y-3 rounded-xl border border-default p-5">
      <div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="font-semibold">{{ item.material.name }}</h2><p class="mt-1 text-sm text-muted">{{ $t("materials.processing_components_help") }}</p></div><div class="flex items-end gap-2"><UFormField :label="$t('inventory.output_quantity')" required><UInput :model-value="item.output_quantity" type="number" min="0.0001" step="0.0001" @update:model-value="setOutputQuantity(item, $event)" @keydown.enter.prevent /></UFormField><UButton type="button" color="error" variant="ghost" icon="i-lucide-trash" @click="removeItem(item.key)" /></div></div>
      <div v-for="component in components(item)" :key="component.id" class="space-y-2">
        <div v-if="isExcluded(item, component.raw_material_id)" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-default bg-elevated/30 p-4">
          <div><p class="font-medium">{{ component.raw_material?.name }}</p><p class="text-sm text-muted">{{ $t('inventory.material_omitted') }}</p></div>
          <UButton type="button" size="sm" icon="i-lucide-sparkles" variant="soft" @click="assignFefo(item, component)">{{ $t('inventory.restore_fefo') }}</UButton>
        </div>
        <template v-else><div v-for="input in rows(item, component.raw_material_id)" :key="input.key" class="grid items-start gap-3 rounded-lg border border-default bg-elevated/30 p-4 md:grid-cols-[minmax(13rem,1.25fr)_auto_minmax(16rem,1.4fr)_minmax(8rem,.65fr)_auto]">
          <UFormField :label="$t('products.material')"><UInput :model-value="component.raw_material?.name ?? ''" readonly class="w-full" /><p class="mt-1 text-xs text-muted">{{ $t("inventory.expected_quantity", { quantity: formatQuantity(expected(component, item), component.unit) }) }}</p></UFormField>
          <UTooltip :text="$t('products.assign_fefo_help')"><UButton type="button" size="sm" icon="i-lucide-sparkles" variant="soft" square class="mt-6" @click="assignFefo(item, component)" /></UTooltip>
          <UFormField :label="$t('inventory.batch')"><USelect v-model="input.stock_batch_id" :items="batchItems(item, input)" :placeholder="$t('inventory.batch')" value-key="value" label-key="label" class="w-full" /></UFormField>
          <UFormField :label="$t('inventory.quantity_used', { unit: component.unit })"><UInput v-model.number="input.quantity" type="number" min="0.0001" step="0.0001" class="w-full" /><p v-if="exceeds(input)" class="mt-1 text-xs text-error">{{ $t("inventory.quantity_exceeds_available", { available: formatQuantity(batch(input)?.available_quantity ?? 0, component.unit) }) }}</p></UFormField>
          <UButton type="button" color="error" variant="ghost" icon="i-lucide-trash" class="mt-6" @click="removeInput(item, input.key)" />
        </div></template>
        <div v-if="!isExcluded(item, component.raw_material_id)" class="flex justify-end px-1"><p class="text-sm text-muted">{{ $t("inventory.total_used", { quantity: formatQuantity(total(item, component.raw_material_id), component.unit) }) }}</p></div>
      </div>
      <UFormField :label="$t('purchases.expiration_date')"><UInput v-model="item.expiration_date" type="date" class="max-w-md" /></UFormField>
    </section>
    <UFormField :label="$t('inventory.reason')"><UInput v-model="state.notes" class="w-full" /></UFormField>
    <UButton type="submit" color="primary" icon="i-lucide-scissors" :loading="saving" :disabled="!items.length">{{ $t("inventory.process_material") }}</UButton>
  </form>
</template>
