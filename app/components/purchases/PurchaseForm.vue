<script setup lang="ts">
import { z } from "zod";
import { FetchError } from "ofetch";
import {
  computed,
  reactive,
  ref,
  useAsyncData,
  useI18n,
  useMaterialModule,
  useProductModule,
  usePurchaseModule,
  useSupplierModule,
  useToast,
} from "#imports";
import type { Material } from "~/types/material";
import type { Product } from "~/types/product";
import type { Purchase, PurchasePayload } from "~/types/purchase";
import { formatPeso } from "~/utils/currency-format";

type PurchaseItemType = "material" | "product";

interface PurchaseFormItem {
  key: number;
  item_type: PurchaseItemType;
  material_id: number | null;
  product_id: number | null;
  quantity: number;
  unit_cost: number;
  expiration_date: string | null;
}

const props = defineProps<{
  purchase?: Purchase;
}>();

const emit = defineEmits<{
  success: [purchase: Purchase];
}>();

const { t } = useI18n();
const toast = useToast();
const { fetchSuppliers } = useSupplierModule();
const { fetchMaterials } = useMaterialModule();
const { fetchProducts } = useProductModule();
const { createPurchase, updatePurchase } = usePurchaseModule();

const isUpdating = computed<boolean>(() => !!props.purchase);
const isSubmitting = ref<boolean>(false);
const nextItemKey = ref<number>(1);

const { data: suppliers } = await useAsyncData("purchase-form-suppliers", () =>
  fetchSuppliers({})
);
const { data: materials } = await useAsyncData("purchase-form-materials", () =>
  fetchMaterials({})
);
const { data: products } = await useAsyncData("purchase-form-products", () =>
  fetchProducts({ filters: { is_composed: false, is_active: true } })
);

const schema = z.object({
  supplier_id: z.number().nullable(),
  purchase_date: z.string().min(1),
  notes: z.string().nullable(),
  items: z
    .array(
      z.object({
        item_type: z.enum(["material", "product"]),
        material_id: z.number().nullable(),
        product_id: z.number().nullable(),
        quantity: z.number().min(0.01),
        unit_cost: z.number().min(0),
        expiration_date: z.string().nullable(),
      }).refine(
        (item) =>
          (item.item_type === "material" && item.material_id !== null) ||
          (item.item_type === "product" && item.product_id !== null),
        { message: "Select an item" }
      )
    )
    .min(1),
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function createItem(item?: Partial<PurchaseFormItem>): PurchaseFormItem {
  return {
    key: nextItemKey.value++,
    item_type: item?.item_type ?? "material",
    material_id: item?.material_id ?? null,
    product_id: item?.product_id ?? null,
    quantity: item?.quantity ?? 1,
    unit_cost: item?.unit_cost ?? 0,
    expiration_date: item?.expiration_date ?? null,
  };
}

const state = reactive<{
  supplier_id: number | null;
  purchase_date: string;
  notes: string | null;
  items: PurchaseFormItem[];
}>({
  supplier_id: props.purchase?.supplier_id ?? null,
  purchase_date: props.purchase?.purchase_date?.slice(0, 10) ?? today(),
  notes: props.purchase?.notes ?? null,
  items:
    props.purchase?.items?.map((item) =>
      createItem({
        material_id: item.material_id,
        product_id: item.product_id,
        item_type: item.product_id ? "product" : "material",
        quantity: Number(item.quantity),
        unit_cost: Number(item.unit_cost),
        expiration_date: item.expiration_date?.slice(0, 10) ?? null,
      })
    ) ?? [createItem()],
});

const materialItems = computed<Material[]>(() => materials.value?.data ?? []);
const productItems = computed<Product[]>(() => products.value?.data ?? []);
const itemTypeItems = computed(() => [
  { label: t("purchases.item_types.material"), value: "material" },
  { label: t("purchases.item_types.product"), value: "product" },
]);
const totalCost = computed<number>(() =>
  state.items.reduce((total, item) => total + item.quantity * item.unit_cost, 0)
);

function selectedMaterial(item: PurchaseFormItem): Material | undefined {
  return materialItems.value.find((material) => material.id === item.material_id);
}

function handleItemTypeChange(item: PurchaseFormItem): void {
  item.material_id = null;
  item.product_id = null;
  item.expiration_date = null;
}

function handleMaterialChange(item: PurchaseFormItem): void {
  if (!selectedMaterial(item)?.is_perishable) {
    item.expiration_date = null;
  }
}

function itemTotal(item: PurchaseFormItem): string {
  return formatPeso(item.quantity * item.unit_cost);
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

function payloadFromState(): PurchasePayload {
  return {
    supplier_id: state.supplier_id,
    purchase_date: state.purchase_date,
    notes: nullableText(state.notes),
    items: state.items.map((item) => ({
      material_id: item.item_type === "material" ? item.material_id : null,
      product_id: item.item_type === "product" ? item.product_id : null,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      expiration_date: item.expiration_date,
    })),
  };
}

async function onSubmit() {
  isSubmitting.value = true;

  try {
    const payload = payloadFromState();

    const result = isUpdating.value
      ? await updatePurchase(props.purchase!.id, payload)
      : await createPurchase(payload);

    toast.add({
      title: t(
        isUpdating.value
          ? "common.crud.resource_updated"
          : "common.crud.resource_created",
        { resource: t("purchases.resource_name") }
      ),
      color: "success",
    });

    emit("success", result);

    if (!isUpdating.value) {
      Object.assign(state, {
        supplier_id: null,
        purchase_date: today(),
        notes: null,
        items: [createItem()],
      });
    }
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
      <UFormField :label="$t('purchases.supplier')" name="supplier_id">
        <USelect
          v-model="state.supplier_id"
          :items="suppliers?.data ?? []"
          value-key="id"
          label-key="name"
          class="w-full"
        />
      </UFormField>

      <UFormField
        :label="$t('purchases.purchase_date')"
        name="purchase_date"
        required
      >
        <UInput v-model="state.purchase_date" type="date" class="w-full" />
      </UFormField>
    </div>

    <UFormField :label="$t('purchases.notes')" name="notes">
      <UTextarea v-model="state.notes" class="w-full" />
    </UFormField>

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-medium">
          {{ $t("purchases.items") }}
        </h2>
        <UButton
          type="button"
          icon="i-lucide-plus"
          variant="soft"
          @click="addItem"
        >
          {{ $t("purchases.add_item") }}
        </UButton>
      </div>

      <div
        v-for="(item, index) in state.items"
        :key="item.key"
        class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end border border-neutral-200 rounded p-3"
      >
        <UFormField
          :label="$t('purchases.item_type')"
          :name="`items.${index}.item_type`"
          class="lg:col-span-2"
          required
        >
          <USelect
            v-model="item.item_type"
            :items="itemTypeItems"
            value-key="value"
            label-key="label"
            class="w-full"
            @update:model-value="handleItemTypeChange(item)"
          />
        </UFormField>

        <UFormField
          v-if="item.item_type === 'material'"
          :label="$t('purchases.material')"
          :name="`items.${index}.material_id`"
          class="lg:col-span-3"
          required
        >
          <USelect
            v-model="item.material_id"
            :items="materialItems"
            value-key="id"
            label-key="name"
            class="w-full"
            @update:model-value="handleMaterialChange(item)"
          />
        </UFormField>

        <UFormField
          v-else
          :label="$t('purchases.product')"
          :name="`items.${index}.product_id`"
          class="lg:col-span-3"
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
          :label="$t('purchases.quantity')"
          :name="`items.${index}.quantity`"
          class="lg:col-span-2"
          required
        >
          <UInput
            v-model.number="item.quantity"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('purchases.unit_cost')"
          :name="`items.${index}.unit_cost`"
          class="lg:col-span-2"
          required
        >
          <UInput
            v-model.number="item.unit_cost"
            type="number"
            min="0"
            step="0.01"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="
            item.item_type === 'product' || selectedMaterial(item)?.is_perishable
          "
          :label="$t('purchases.expiration_date')"
          :name="`items.${index}.expiration_date`"
          class="lg:col-span-2"
        >
          <UInput
            v-model="item.expiration_date"
            type="date"
            class="w-full"
          />
        </UFormField>

        <div v-else class="lg:col-span-2">
          <p class="text-xs text-neutral-500">
            {{ $t("purchases.expiration_date") }}
          </p>
          <p class="text-sm text-neutral-400">
            {{ $t("purchases.not_perishable") }}
          </p>
        </div>

        <div class="lg:col-span-2">
          <p class="text-xs text-neutral-500">
            {{ $t("purchases.item_total") }}
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
        {{ $t("purchases.total_cost") }}
      </p>
      <p class="text-lg font-semibold">
        {{ formatPeso(totalCost) }}
      </p>
    </div>

    <UButton type="submit" :loading="isSubmitting" color="brand">
      {{ isUpdating ? $t("common.save_changes") : $t("common.submit") }}
    </UButton>
  </UForm>
</template>
