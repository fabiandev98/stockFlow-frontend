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
  covers: z.number().int().min(1).nullable(),
  discount_amount: z.number().min(0),
  tax_rate: z.number().min(0).max(100),
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
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
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
  covers: number | null;
  discount_amount: number;
  tax_rate: number;
  notes: string | null;
  items: SaleFormItem[];
}>({
  sale_date: today(),
  covers: null,
  discount_amount: 0,
  tax_rate: 0,
  notes: null,
  items: [createItem()],
});

const productItems = computed<Product[]>(() => products.value?.data ?? []);
const subtotalAmount = computed<number>(() =>
  state.items.reduce((total, item) => {
    const product = selectedProduct(item);
    return total + item.quantity * Number(product?.sale_price ?? 0);
  }, 0)
);
const discountExceedsSubtotal = computed<boolean>(
  () => state.discount_amount > subtotalAmount.value
);
const taxableAmount = computed<number>(() =>
  Math.max(0, subtotalAmount.value - state.discount_amount)
);
const taxAmount = computed<number>(
  () => taxableAmount.value * (state.tax_rate / 100)
);
const totalAmount = computed<number>(() => taxableAmount.value + taxAmount.value);
const hasInsufficientStock = computed<boolean>(() =>
  state.items.some((item) => quantityExceedsAvailable(item))
);

function selectedProduct(item: SaleFormItem): Product | undefined {
  return productItems.value.find((product) => product.id === item.product_id);
}

function availableProductItems(item: SaleFormItem): Product[] {
  const selectedProductIds = state.items
    .filter((saleItem) => saleItem.key !== item.key)
    .map((saleItem) => saleItem.product_id)
    .filter((productId): productId is number => productId !== null);

  return productItems.value.filter(
    (product) => !selectedProductIds.includes(product.id)
  );
}

function availableToSell(item: SaleFormItem): number {
  return Number(selectedProduct(item)?.available_to_sell ?? 0);
}

function availableLabel(item: SaleFormItem): string {
  return `${availableToSell(item).toFixed(2)} u`;
}

function selectedQuantity(item: SaleFormItem): number {
  if (!item.product_id) return 0;

  return state.items
    .filter((saleItem) => saleItem.product_id === item.product_id)
    .reduce((total, saleItem) => total + Number(saleItem.quantity ?? 0), 0);
}

function selectedQuantityLabel(item: SaleFormItem): string {
  return `${selectedQuantity(item).toFixed(2)} u`;
}

function quantityExceedsAvailable(item: SaleFormItem): boolean {
  if (!item.product_id) return false;

  return selectedQuantity(item) > availableToSell(item);
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
    covers: state.covers,
    discount_amount: state.discount_amount,
    tax_rate: state.tax_rate,
    notes: nullableText(state.notes),
    items: state.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
  };
}

async function onSubmit() {
  if (hasInsufficientStock.value || discountExceedsSubtotal.value) {
    toast.add({
      title: t("common.generic_error_title"),
      description: discountExceedsSubtotal.value
        ? t("sales.discount_exceeds_subtotal")
        : t("sales.quantity_exceeds_available"),
      color: "error",
    });

    return;
  }

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
      covers: null,
      discount_amount: 0,
      tax_rate: 0,
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
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UFormField name="sale_date">
        <template #label>
          <SharedFormFieldLabel
            :label="$t('sales.sale_date')"
            :hint="$t('sales.hints.sale_date')"
            required
          />
        </template>
        <UInput v-model="state.sale_date" type="date" class="w-full" />
      </UFormField>

      <UFormField name="covers">
        <template #label>
          <SharedFormFieldLabel
            :label="$t('sales.covers')"
            :hint="$t('sales.hints.covers')"
          />
        </template>
        <UInput
          v-model.number="state.covers"
          type="number"
          min="1"
          step="1"
          class="w-full"
        />
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
        class="relative grid grid-cols-1 lg:grid-cols-12 gap-3 items-end border border-neutral-200 rounded p-4 pr-14"
      >
        <UButton
          type="button"
          icon="i-lucide-trash"
          color="error"
          variant="ghost"
          class="absolute right-3 top-3"
          :disabled="state.items.length === 1"
          @click="removeItem(index)"
        />

        <UFormField
          :name="`items.${index}.product_id`"
          class="lg:col-span-5"
        >
          <template #label>
            <SharedFormFieldLabel
              :label="$t('sales.product')"
              :hint="$t('sales.hints.product')"
              required
            />
          </template>
          <USelect
            v-model="item.product_id"
            :items="availableProductItems(item)"
            value-key="id"
            label-key="name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :name="`items.${index}.quantity`"
          class="lg:col-span-2"
        >
          <template #label>
            <SharedFormFieldLabel
              :label="$t('sales.quantity')"
              :hint="$t('sales.hints.quantity')"
              required
            />
          </template>
          <UInput
            v-model.number="item.quantity"
            type="number"
            min="1"
            step="1"
            class="w-full"
            :color="quantityExceedsAvailable(item) ? 'error' : 'neutral'"
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

        <div class="lg:col-span-3">
          <p class="text-xs text-neutral-500">
            {{ $t("products.available_to_sell") }}
          </p>
          <p
            class="font-medium"
            :class="quantityExceedsAvailable(item) ? 'text-error' : ''"
          >
            {{ availableLabel(item) }}
          </p>
          <p v-if="quantityExceedsAvailable(item)" class="mt-1 text-xs text-error">
            {{
              $t("sales.quantity_exceeds_available_with_quantity", {
                available: availableLabel(item),
                selected: selectedQuantityLabel(item),
              })
            }}
          </p>
        </div>

        <div class="lg:col-span-12 flex items-center justify-end gap-3 border-t border-neutral-200 pt-3 mt-1">
          <p class="text-xs text-neutral-500">
            {{ $t("sales.item_total") }}
          </p>
          <p class="text-lg font-semibold text-highlighted">
            {{ itemTotal(item) }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
      <UFormField name="discount_amount">
        <template #label>
          <SharedFormFieldLabel
            :label="$t('sales.discount_amount')"
            :hint="$t('sales.hints.discount_amount')"
          />
        </template>
        <UInput
          v-model.number="state.discount_amount"
          type="number"
          min="0"
          step="0.01"
          class="w-full"
          :color="discountExceedsSubtotal ? 'error' : 'neutral'"
        />
        <p v-if="discountExceedsSubtotal" class="mt-1 text-xs text-error">
          {{ $t("sales.discount_exceeds_subtotal") }}
        </p>
      </UFormField>

      <UFormField name="tax_rate">
        <template #label>
          <SharedFormFieldLabel
            :label="$t('sales.tax_rate')"
            :hint="$t('sales.hints.tax_rate')"
          />
        </template>
        <UInput
          v-model.number="state.tax_rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          class="w-full"
        />
      </UFormField>

      <div class="md:col-span-2 space-y-2 rounded border border-neutral-200 p-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-neutral-500">{{ $t("sales.subtotal_amount") }}</span>
          <span>{{ formatPeso(subtotalAmount) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-neutral-500">{{ $t("sales.discount_amount") }}</span>
          <span>-{{ formatPeso(state.discount_amount) }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-neutral-500">{{ $t("sales.tax_amount") }}</span>
          <span>{{ formatPeso(taxAmount) }}</span>
        </div>
        <div class="flex items-center justify-between border-t pt-2">
          <span class="font-medium">{{ $t("sales.total_amount") }}</span>
          <span class="text-lg font-semibold">{{ formatPeso(totalAmount) }}</span>
        </div>
      </div>
    </div>

    <UButton
      type="submit"
      :loading="isSubmitting"
      :disabled="hasInsufficientStock || discountExceedsSubtotal"
      color="brand"
    >
      {{ $t("common.submit") }}
    </UButton>
  </UForm>
</template>
