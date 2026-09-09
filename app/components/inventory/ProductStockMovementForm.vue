<script setup lang="ts">
import { z } from "zod";
import { FetchError } from "ofetch";
import {
  computed,
  navigateTo,
  reactive,
  ref,
  useAsyncData,
  useI18n,
  useInventoryModule,
  useLocalePath,
  useRoute,
  useToast,
} from "#imports";
import type { ProductBatch } from "~/types/purchase";
import type { ProductStockMovementPayload } from "~/types/inventory";
import { formatQuantity } from "~/utils/quantity-format";

type ProductStockMovementFormState = Omit<
  ProductStockMovementPayload,
  "product_batch_id"
> & {
  product_batch_id: number | undefined;
};

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const toast = useToast();
const { fetchProductBatches, createProductStockMovement } = useInventoryModule();
const isSubmitting = ref(false);

const { data: productBatches } = await useAsyncData(
  "product-stock-movement-form-batches",
  () => fetchProductBatches({})
);

const schema = z.object({
  product_batch_id: z.number().min(1),
  type: z.enum(["waste", "expired"]),
  quantity: z.number().min(0.01),
  reason: z.string().trim().min(1),
  movement_date: z.string().nullable(),
});

const state = reactive<ProductStockMovementFormState>({
  product_batch_id: Number(route.query.batch) || undefined,
  type: route.query.type === "expired" ? "expired" : "waste",
  quantity: 1,
  reason: "",
  movement_date: null,
});

const batchItems = computed(() => (productBatches.value?.data ?? []).map((batch) => ({
  label: batchLabel(batch),
  value: batch.id,
})));
const selectedBatch = computed(() =>
  (productBatches.value?.data ?? []).find((batch) => batch.id === state.product_batch_id)
);
const availableQuantity = computed(() => Number(selectedBatch.value?.available_quantity ?? 0));
const exceedsAvailableStock = computed(() => state.quantity > availableQuantity.value);
const availableStockLabel = computed(() => formatQuantity(availableQuantity.value));

function batchLabel(batch: ProductBatch): string {
  const product = batch.product?.name ?? `#${batch.product_id}`;
  const expiration = batch.expiration_date ? ` - ${batch.expiration_date}` : "";
  return `#${batch.id} - ${product} (${formatQuantity(batch.available_quantity)})${expiration}`;
}

async function onSubmit() {
  if (!state.product_batch_id || exceedsAvailableStock.value) {
    toast.add({
      title: t("common.generic_error_title"),
      description: t("inventory.quantity_exceeds_available", { available: availableStockLabel.value }),
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    await createProductStockMovement({
      ...state,
      product_batch_id: state.product_batch_id,
      reason: state.reason.trim(),
      movement_date: state.movement_date || null,
    });
    toast.add({ title: t("common.crud.resource_created", { resource: t("inventory.product_waste") }), color: "success" });
    await navigateTo(lp("/inventory/product-movements"));
  } catch (error: unknown) {
    toast.add({
      title: t("common.generic_error_title"),
      description: error instanceof FetchError
        ? t("common.generic_error", { context: `${error.statusCode} - ${error.data?.message ?? error.message}` })
        : t("common.generic_unknown_error"),
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField :label="$t('inventory.product_batch')" name="product_batch_id" required>
        <USelect v-model="state.product_batch_id" :items="batchItems" value-key="value" label-key="label" class="w-full" />
      </UFormField>
      <UFormField :label="$t('inventory.movement_type')" name="type" required>
        <USelect v-model="state.type" :items="[{ label: $t('inventory.movement_types.waste'), value: 'waste' }, { label: $t('inventory.movement_types.expired'), value: 'expired' }]" value-key="value" label-key="label" class="w-full" />
      </UFormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField :label="$t('purchases.quantity')" name="quantity" required>
        <UInput v-model.number="state.quantity" type="number" min="0.01" step="0.01" class="w-full" />
        <p v-if="selectedBatch" class="mt-1 text-xs text-neutral-500">{{ $t('inventory.available_quantity_hint', { quantity: availableStockLabel }) }}</p>
        <p v-if="exceedsAvailableStock" class="mt-1 text-xs text-red-600">{{ $t('inventory.quantity_exceeds_available', { available: availableStockLabel }) }}</p>
      </UFormField>
      <UFormField :label="$t('inventory.movement_date')" name="movement_date">
        <UInput v-model="state.movement_date" type="datetime-local" class="w-full" />
      </UFormField>
    </div>
    <UFormField :label="$t('inventory.reason')" name="reason" required>
      <UTextarea v-model="state.reason" class="w-full" />
    </UFormField>
    <UButton type="submit" :loading="isSubmitting" :disabled="exceedsAvailableStock" color="primary">{{ $t('common.submit') }}</UButton>
  </UForm>
</template>
