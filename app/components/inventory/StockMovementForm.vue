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
  useToast,
} from "#imports";
import type {
  InventoryStockBatch,
  StockMovementPayload,
  StockMovementType,
} from "~/types/inventory";

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const { fetchStockBatches, createStockMovement } = useInventoryModule();

const isSubmitting = ref<boolean>(false);

const { data: stockBatches } = await useAsyncData(
  "stock-movement-form-batches",
  () => fetchStockBatches({ filters: { status: "available" } })
);

const schema = z.object({
  stock_batch_id: z.number().min(1),
  type: z.string().min(1),
  quantity: z.number().min(0.01),
  reason: z.string().nullable(),
  movement_date: z.string().nullable(),
});

const state = reactive<StockMovementPayload>({
  stock_batch_id: null,
  type: "adjustment_out",
  quantity: 1,
  reason: null,
  movement_date: null,
});

const movementTypes = computed(() =>
  (
    [
      "manual_in",
      "manual_out",
      "adjustment_in",
      "adjustment_out",
      "waste",
      "expired",
    ] satisfies StockMovementType[]
  ).map((type) => ({
    label: t(`inventory.movement_types.${type}`),
    value: type,
  }))
);

const batchItems = computed(() =>
  (stockBatches.value?.data ?? []).map((batch) => ({
    label: batchLabel(batch),
    value: batch.id,
  }))
);

const selectedBatch = computed<InventoryStockBatch | undefined>(() =>
  (stockBatches.value?.data ?? []).find(
    (batch) => batch.id === state.stock_batch_id
  )
);

const availableQuantity = computed<number>(() =>
  Number(selectedBatch.value?.available_quantity ?? 0)
);

const selectedBatchUnit = computed<string>(() => selectedBatch.value?.material?.unit ?? "");

const decreasesStock = computed<boolean>(() =>
  ["manual_out", "adjustment_out", "waste", "expired"].includes(state.type)
);

const exceedsAvailableStock = computed<boolean>(
  () => decreasesStock.value && state.quantity > availableQuantity.value
);

const availableStockLabel = computed<string>(() =>
  `${availableQuantity.value.toFixed(2)} ${selectedBatchUnit.value}`.trim()
);

function batchLabel(batch: InventoryStockBatch): string {
  const material = batch.material?.name ?? `#${batch.material_id}`;
  const quantity = Number(batch.available_quantity).toFixed(2);
  const unit = batch.material?.unit ?? "";

  return `#${batch.id} - ${material} (${quantity} ${unit})`;
}

function nullableText(value: string | null): string | null {
  return value && value.trim() !== "" ? value : null;
}

async function onSubmit() {
  if (exceedsAvailableStock.value) {
    toast.add({
      title: t("common.generic_error_title"),
      description: t("inventory.quantity_exceeds_available", {
        available: availableStockLabel.value,
      }),
      color: "error",
    });

    return;
  }

  isSubmitting.value = true;

  try {
    await createStockMovement({
      ...state,
      reason: nullableText(state.reason),
      movement_date: nullableText(state.movement_date),
    });

    toast.add({
      title: t("common.crud.resource_created", {
        resource: t("inventory.movement"),
      }),
      color: "success",
    });

    await navigateTo(lp("/inventory/movements"));
  } catch (error: unknown) {
    toast.add({
      title: t("common.generic_error_title"),
      description:
        error instanceof FetchError
          ? t("common.generic_error", {
              context: `${error.statusCode} - ${
                error.data?.message ?? error.message
              }`,
            })
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
      <UFormField :label="$t('inventory.batch')" name="stock_batch_id" required>
        <USelect
          v-model="state.stock_batch_id"
          :items="batchItems"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('inventory.movement_type')" name="type" required>
        <USelect
          v-model="state.type"
          :items="movementTypes"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField :label="$t('purchases.quantity')" name="quantity" required>
        <UInput
          v-model.number="state.quantity"
          type="number"
          min="0.01"
          step="0.01"
          class="w-full"
        />
        <p v-if="selectedBatch" class="mt-1 text-xs text-neutral-500">
          {{
            $t("inventory.available_quantity_hint", {
              quantity: availableStockLabel,
            })
          }}
        </p>
        <p v-if="exceedsAvailableStock" class="mt-1 text-xs text-red-600">
          {{
            $t("inventory.quantity_exceeds_available", {
              available: availableStockLabel,
            })
          }}
        </p>
      </UFormField>

      <UFormField :label="$t('inventory.movement_date')" name="movement_date">
        <UInput v-model="state.movement_date" type="datetime-local" class="w-full" />
      </UFormField>
    </div>

    <UFormField :label="$t('inventory.reason')" name="reason">
      <UTextarea v-model="state.reason" class="w-full" />
    </UFormField>

    <UButton
      type="submit"
      :loading="isSubmitting"
      :disabled="exceedsAvailableStock"
      color="brand"
    >
      {{ $t("common.submit") }}
    </UButton>
  </UForm>
</template>
