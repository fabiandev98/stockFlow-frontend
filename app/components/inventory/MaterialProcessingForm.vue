<script setup lang="ts">
import { computed, navigateTo, reactive, ref, useAsyncData, useI18n, useInventoryModule, useLocalePath, useMaterialModule, useToast } from "#imports";
import { FetchError } from "ofetch";
import type { InventoryStockBatch, MaterialProcessingPayload } from "~/types/inventory";
import type { Material } from "~/types/material";
import { formatQuantity } from "~/utils/quantity-format";

const { t } = useI18n();
const toast = useToast();
const lp = useLocalePath();
const { fetchMaterials } = useMaterialModule();
const { fetchStockBatches, createMaterialProcessing } = useInventoryModule();
const saving = ref(false);
const today = new Date().toISOString().slice(0, 10);

const { data: materials } = await useAsyncData("material-processing-materials", () => fetchMaterials({}));
const { data: batches } = await useAsyncData("material-processing-batches", () => fetchStockBatches({ perPage: 100, filters: { status: "available" } }));

const state = reactive<MaterialProcessingPayload>({
  output_material_id: null,
  output_quantity: 0,
  inputs: [{ stock_batch_id: null, quantity: 0 }],
  processed_at: today,
  expiration_date: null,
  notes: null,
});

const processedMaterials = computed<Material[]>(() => (materials.value?.data ?? []).filter((material) => material.processing_type === "processed"));
const rawBatches = computed<InventoryStockBatch[]>(() => (batches.value?.data ?? []).filter((batch) => batch.material?.processing_type === "raw"));
const selectedBatches = computed(() => state.inputs.map((input) => rawBatches.value.find((batch) => batch.id === input.stock_batch_id)));
const sourceMaterialId = computed<number | null>(() => selectedBatches.value.find(Boolean)?.material_id ?? null);
const sourceMaterial = computed(() => selectedBatches.value.find(Boolean)?.material);
const outputMaterial = computed(() => processedMaterials.value.find((material) => material.id === state.output_material_id));
const inputQuantity = computed(() => state.inputs.reduce((total, input) => total + Number(input.quantity || 0), 0));
const wasteQuantity = computed(() => Math.max(0, inputQuantity.value - Number(state.output_quantity || 0)));
const yieldPercentage = computed(() => inputQuantity.value > 0 ? (Number(state.output_quantity || 0) / inputQuantity.value) * 100 : 0);
const inputCost = computed(() => state.inputs.reduce((total, input, index) => total + Number(input.quantity || 0) * Number(selectedBatches.value[index]?.unit_cost ?? 0), 0));
const outputCost = computed(() => Number(state.output_quantity || 0) > 0 ? inputCost.value / Number(state.output_quantity) : 0);
const outputExceedsInput = computed(() => Number(state.output_quantity || 0) > inputQuantity.value);
const invalidInput = computed(() => state.inputs.some((input, index) => !input.stock_batch_id || input.quantity <= 0 || input.quantity > Number(selectedBatches.value[index]?.available_quantity ?? 0)));

function batchItems(index: number) {
  const selected = selectedBatches.value[index];
  const materialId = selected?.material_id ?? sourceMaterialId.value;
  return rawBatches.value
    .filter((batch) => materialId === null || batch.material_id === materialId)
    .map((batch) => ({ value: batch.id, label: `#${batch.id} · ${formatQuantity(batch.available_quantity, batch.material?.unit)} · ${batch.expiration_date ?? "—"}` }));
}

function onBatchChange(index: number): void {
  const selected = selectedBatches.value[index];
  if (!selected) return;
  state.inputs.forEach((input, inputIndex) => {
    const batch = selectedBatches.value[inputIndex];
    if (inputIndex !== index && batch && batch.material_id !== selected.material_id) input.stock_batch_id = null;
  });
}

function addInput(): void { state.inputs.push({ stock_batch_id: null, quantity: 0 }); }
function removeInput(index: number): void { if (state.inputs.length > 1) state.inputs.splice(index, 1); }
function nullable(value: string | null): string | null { return value?.trim() ? value : null; }

async function submit(): Promise<void> {
  if (saving.value || !state.output_material_id || invalidInput.value || outputExceedsInput.value || Number(state.output_quantity) <= 0) return;
  saving.value = true;
  try {
    await createMaterialProcessing({ ...state, notes: nullable(state.notes) });
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
      <h2 class="font-semibold">{{ $t("inventory.process_material") }}</h2>
      <p class="mt-1 text-sm text-muted">{{ $t("inventory.process_material_description") }}</p>
      <div class="mt-5 grid gap-4 md:grid-cols-3">
        <UFormField :label="$t('inventory.processed_material')" required><USelect v-model="state.output_material_id" :items="processedMaterials" value-key="id" label-key="name" class="w-full" /></UFormField>
        <UFormField :label="$t('inventory.movement_date')" required><UInput v-model="state.processed_at" type="date" class="w-full" /></UFormField>
        <UFormField :label="$t('purchases.expiration_date')"><UInput v-model="state.expiration_date" type="date" class="w-full" /></UFormField>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between"><h2 class="font-semibold">{{ $t("inventory.input_batches") }}</h2><UButton type="button" icon="i-lucide-plus" variant="soft" @click="addInput">{{ $t("inventory.add_batch") }}</UButton></div>
      <div v-for="(input, index) in state.inputs" :key="index" class="grid items-end gap-3 rounded-xl border border-default p-4 md:grid-cols-[minmax(16rem,2fr)_minmax(9rem,1fr)_auto]">
        <UFormField :label="$t('inventory.batch')" required><USelect v-model="input.stock_batch_id" :items="batchItems(index)" value-key="value" label-key="label" class="w-full" @update:model-value="onBatchChange(index)" /></UFormField>
        <UFormField :label="$t('purchases.quantity')" required><UInput v-model.number="input.quantity" type="number" min="0.0001" step="0.0001" class="w-full" /><p v-if="selectedBatches[index]" class="mt-1 text-xs text-muted">{{ $t("inventory.available_quantity_hint", { quantity: formatQuantity(selectedBatches[index]?.available_quantity, selectedBatches[index]?.material?.unit) }) }}</p></UFormField>
        <UButton type="button" icon="i-lucide-trash-2" color="error" variant="ghost" :disabled="state.inputs.length === 1" @click="removeInput(index)" />
      </div>
    </div>

    <div class="grid gap-4 rounded-xl border border-default bg-elevated/30 p-5 md:grid-cols-4">
      <UFormField :label="$t('inventory.output_quantity')" required><UInput v-model.number="state.output_quantity" type="number" min="0.0001" step="0.0001" class="w-full" /><p v-if="outputExceedsInput" class="mt-1 text-xs text-error">{{ $t("inventory.quantity_exceeds_available", { available: formatQuantity(inputQuantity, sourceMaterial?.unit) }) }}</p></UFormField>
      <div><p class="text-sm text-muted">{{ $t("inventory.processing_yield") }}</p><p class="mt-2 text-lg font-semibold">{{ yieldPercentage.toFixed(2) }}%</p></div>
      <div><p class="text-sm text-muted">{{ $t("inventory.processing_waste") }}</p><p class="mt-2 text-lg font-semibold">{{ formatQuantity(wasteQuantity, sourceMaterial?.unit) }}</p></div>
      <div><p class="text-sm text-muted">{{ $t("inventory.processing_cost") }}</p><p class="mt-2 text-lg font-semibold">{{ outputCost.toFixed(2) }} / {{ outputMaterial?.unit ?? "" }}</p></div>
    </div>
    <UFormField :label="$t('inventory.reason')"><UTextarea v-model="state.notes" :rows="3" class="w-full" /></UFormField>
    <UButton type="submit" color="primary" icon="i-lucide-scissors" :loading="saving" :disabled="invalidInput || outputExceedsInput || !state.output_material_id">{{ $t("inventory.process_material") }}</UButton>
  </form>
</template>
