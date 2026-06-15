<script setup lang="ts">
import { z } from "zod";
import { FetchError } from "ofetch";
import {
  computed,
  reactive,
  ref,
  useAsyncData,
  useI18n,
  useProductModule,
  useSaleModule,
  useToast,
} from "#imports";
import type { Product } from "~/types/product";
import type { Sale, SalePayload } from "~/types/sale";
import { formatPeso } from "~/utils/currency-format";

interface SaleFormItem {
  key: number;
  product_id: number | null;
  quantity: number;
}

const emit = defineEmits<{
  success: [sale: Sale];
}>();

const { t } = useI18n();
const toast = useToast();
const { fetchProducts } = useProductModule();
const { createSale } = useSaleModule();

const isSubmitting = ref<boolean>(false);
const nextItemKey = ref<number>(1);

const { data: products } = await useAsyncData("sale-form-products", () =>
  fetchProducts({ filters: { is_active: true } })
);

const schema = z.object({
  sale_date: z.string().min(1),
  notes: z.string().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.number().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function createItem(item?: Partial<SaleFormItem>): SaleFormItem {
  return {
    key: nextItemKey.value++,
    product_id: item?.product_id ?? null,
    quantity: item?.quantity ?? 1,
  };
}

const state = reactive<{
  sale_date: string;
  notes: string | null;
  items: SaleFormItem[];
}>({
  sale_date: today(),
  notes: null,
  items: [createItem()],
});

const productItems = computed<Product[]>(() => products.value?.data ?? []);
const totalAmount = computed<number>(() =>
  state.items.reduce((total, item) => {
    const product = selectedProduct(item);
    return total + item.quantity * Number(product?.sale_price ?? 0);
  }, 0)
);

function selectedProduct(item: SaleFormItem): Product | undefined {
  return productItems.value.find((product) => product.id === item.product_id);
}

function itemTotal(item: SaleFormItem): string {
  return formatPeso(item.quantity * Number(selectedProduct(item)?.sale_price ?? 0));
}

function addItem(): void {
  state.items.push(createItem());
}

function removeItem(index: number): void {
  if (state.items.length === 1) return;
  state.items.splice(index, 1);
}

function nullableText(value: string | null): string | null {
  return value && value.trim() !== "" ? value : null;
}

function payloadFromState(): SalePayload {
  return {
    sale_date: state.sale_date,
    notes: nullableText(state.notes),
    items: state.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
  };
}

async function onSubmit() {
  isSubmitting.value = true;

  try {
    const result = await createSale(payloadFromState());

    toast.add({
      title: t("common.crud.resource_created", {
        resource: `${t("sales.resource_name")} #${result.id}`,
      }),
      color: "success",
    });

    emit("success", result);

    Object.assign(state, {
      sale_date: today(),
      notes: null,
      items: [createItem()],
    });
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
      <UFormField :label="$t('sales.sale_date')" name="sale_date" required>
        <UInput v-model="state.sale_date" type="date" class="w-full" />
      </UFormField>

      <UFormField :label="$t('sales.notes')" name="notes">
        <UTextarea v-model="state.notes" class="w-full" />
      </UFormField>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-medium">
          {{ $t("sales.items") }}
        </h2>
        <UButton
          type="button"
          icon="i-lucide-plus"
          variant="soft"
          @click="addItem"
        >
          {{ $t("sales.add_item") }}
        </UButton>
      </div>

      <div
        v-for="(item, index) in state.items"
        :key="item.key"
        class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end border border-neutral-200 rounded p-3"
      >
        <UFormField
          :label="$t('sales.product')"
          :name="`items.${index}.product_id`"
          class="lg:col-span-5"
          required
        >
          <USelect
            v-model="item.product_id"
            :items="productItems"
            value-key="id"
            label-key="name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('sales.quantity')"
          :name="`items.${index}.quantity`"
          class="lg:col-span-2"
          required
        >
          <UInput
            v-model.number="item.quantity"
            type="number"
            min="1"
            step="1"
            class="w-full"
          />
        </UFormField>

        <div class="lg:col-span-2">
          <p class="text-xs text-neutral-500">
            {{ $t("sales.unit_price") }}
          </p>
          <p class="font-medium">
            {{ formatPeso(selectedProduct(item)?.sale_price) }}
          </p>
        </div>

        <div class="lg:col-span-2">
          <p class="text-xs text-neutral-500">
            {{ $t("sales.item_total") }}
          </p>
          <p class="font-medium">
            {{ itemTotal(item) }}
          </p>
        </div>

        <div class="lg:col-span-1 flex justify-end">
          <UButton
            type="button"
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            :disabled="state.items.length === 1"
            @click="removeItem(index)"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between border-t pt-4">
      <p class="text-sm text-neutral-500">
        {{ $t("sales.total_amount") }}
      </p>
      <p class="text-lg font-semibold">
        {{ formatPeso(totalAmount) }}
      </p>
    </div>

    <UButton type="submit" :loading="isSubmitting" color="brand">
      {{ $t("common.submit") }}
    </UButton>
  </UForm>
</template>
