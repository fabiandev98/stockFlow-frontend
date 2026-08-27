<script setup lang="ts">
import { computed, reactive, ref, useAsyncData, useI18n, useInventoryModule, useLocalePath, useMaterialModule, useProductModule, useToast } from "#imports";
import { FetchError } from "ofetch";
import type { Material } from "~/types/material";
import type { ProductProductionPayload } from "~/types/product";

const props = defineProps<{ productId: number }>();
const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const { fetchProductById, createProductProduction } = useProductModule();
const { fetchMaterials } = useMaterialModule();
const { fetchStockBatches } = useInventoryModule();
const isSubmitting = ref(false);
const nextKey = ref(1);
const { data: product } = await useAsyncData(`product-production-${props.productId}`, () => fetchProductById(props.productId));
const { data: materials } = await useAsyncData("production-materials", () => fetchMaterials({}));
const { data: batches } = await useAsyncData("production-batches", () => fetchStockBatches({ filters: { status: "available" } }));

type UsageRow = { key: number; material_id: number | null; stock_batch_id: number | null; quantity: number };
function row(materialId: number | null = null, quantity = 1): UsageRow { return { key: nextKey.value++, material_id: materialId, stock_batch_id: null, quantity }; }
const state = reactive<{ planned_quantity: number | null; produced_quantity: number; production_date: string; expiration_date: string | null; expiration_override_reason: string | null; notes: string | null; usages: UsageRow[] }>({
  planned_quantity: null, produced_quantity: 1, production_date: new Date().toISOString().slice(0, 10), expiration_date: null, expiration_override_reason: null, notes: null,
  usages: [],
});
if (product.value?.compositions?.length) state.usages = product.value.compositions.map((item) => row(item.material_id, Number(item.quantity_required)));

const materialItems = computed<Material[]>(() => materials.value?.data ?? []);
function batchItems(materialId: number | null) { return (batches.value?.data ?? []).filter((batch) => batch.material_id === materialId).map((batch) => ({ value: batch.id, label: `#${batch.id} · ${Number(batch.available_quantity).toFixed(2)} ${batch.material?.unit ?? ""}${batch.expiration_date ? ` · ${batch.expiration_date}` : ""}` })); }
function addUsage() { state.usages.push(row()); }
function removeUsage(index: number) { state.usages.splice(index, 1); }
function selectMaterial(usage: UsageRow) { usage.stock_batch_id = null; }
function exceeds(usage: UsageRow) { const batch = (batches.value?.data ?? []).find((item) => item.id === usage.stock_batch_id); return batch && usage.quantity > Number(batch.available_quantity); }
async function submit() {
  if (!product.value || state.usages.length === 0 || state.usages.some((usage) => !usage.stock_batch_id || usage.quantity <= 0 || exceeds(usage))) return;
  isSubmitting.value = true;
  try {
    const payload: ProductProductionPayload = { ...state, usages: state.usages.map(({ stock_batch_id, quantity }) => ({ stock_batch_id, quantity })) };
    await createProductProduction(product.value.id, payload);
    toast.add({ title: t("products.production_created"), color: "success" });
    await navigateTo(lp("/products"));
  } catch (error: unknown) {
    toast.add({ title: t("common.generic_error_title"), description: error instanceof FetchError ? error.data?.message ?? error.message : t("common.generic_unknown_error"), color: "error" });
  } finally { isSubmitting.value = false; }
}
</script>

<template>
  <div v-if="product" class="space-y-5">
    <div><h1 class="text-2xl font-semibold">{{ $t("products.register_production") }}: {{ product.name }}</h1><p class="text-sm text-muted">{{ $t("products.production_recipe_hint") }}</p></div>
    <UForm class="space-y-5" @submit="submit">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormField :label="$t('products.planned_quantity')"><UInput v-model.number="state.planned_quantity" type="number" min="0.01" class="w-full" /></UFormField>
        <UFormField :label="$t('products.produced_quantity')" required><UInput v-model.number="state.produced_quantity" type="number" min="0.01" class="w-full" /></UFormField>
        <UFormField :label="$t('products.production_date')" required><UInput v-model="state.production_date" type="date" class="w-full" /></UFormField>
      </div>
      <div class="flex items-center justify-between"><h2 class="font-medium">{{ $t("products.real_materials") }}</h2><UButton type="button" icon="i-lucide-plus" variant="soft" @click="addUsage">{{ $t("products.add_material") }}</UButton></div>
      <div v-for="(usage, index) in state.usages" :key="usage.key" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded border border-neutral-200 p-3">
        <UFormField :label="$t('products.material')" class="md:col-span-4"><USelect v-model="usage.material_id" :items="materialItems" value-key="id" label-key="name" class="w-full" @update:model-value="selectMaterial(usage)" /></UFormField>
        <UFormField :label="$t('inventory.batch')" class="md:col-span-4"><USelect v-model="usage.stock_batch_id" :items="batchItems(usage.material_id)" value-key="value" label-key="label" class="w-full" /></UFormField>
        <UFormField :label="$t('purchases.quantity')" class="md:col-span-3"><UInput v-model.number="usage.quantity" type="number" min="0.01" step="0.01" class="w-full" /><p v-if="exceeds(usage)" class="text-xs text-error">{{ $t("inventory.quantity_exceeds_available") }}</p></UFormField>
        <UButton type="button" color="error" variant="ghost" icon="i-lucide-trash" class="md:col-span-1" @click="removeUsage(index)" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField :label="$t('products.expiration_date')"><UInput v-model="state.expiration_date" type="date" class="w-full" /></UFormField>
        <UFormField :label="$t('products.expiration_override_reason')"><UInput v-model="state.expiration_override_reason" class="w-full" /></UFormField>
      </div>
      <UFormField :label="$t('sales.notes')"><UTextarea v-model="state.notes" class="w-full" /></UFormField>
      <UButton type="submit" color="brand" :loading="isSubmitting">{{ $t("products.register_production") }}</UButton>
    </UForm>
  </div>
</template>
