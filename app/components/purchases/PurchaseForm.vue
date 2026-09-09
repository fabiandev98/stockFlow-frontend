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
  has_expiration: boolean;
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
        has_expiration: z.boolean(),
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
    has_expiration: item?.has_expiration ?? !!item?.expiration_date,
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
        has_expiration: !!item.expiration_date,
        expiration_date: item.expiration_date?.slice(0, 10) ?? null,
      })
    ) ?? [],
});

const itemPicker = reactive<{
  item_type: PurchaseItemType;
  material_id: number | null;
  product_id: number | null;
}>({ item_type: "material", material_id: null, product_id: null });

const materialItems = computed<Material[]>(() => materials.value?.data ?? []);
const productItems = computed<Product[]>(() => products.value?.data ?? []);
const itemTypeItems = computed<{ label: string; value: PurchaseItemType }[]>(() => [
  { label: t("purchases.item_types.material"), value: "material" },
  { label: t("purchases.item_types.product"), value: "product" },
]);
const totalCost = computed<number>(() =>
  state.items.reduce((total, item) => total + item.quantity * item.unit_cost, 0)
);

function selectedMaterial(item: PurchaseFormItem): Material | undefined {
  return materialItems.value.find((material) => material.id === item.material_id);
}

function setPickerItemType(itemType: PurchaseItemType): void {
  if (itemPicker.item_type === itemType) return;

  itemPicker.item_type = itemType;
  itemPicker.material_id = null;
  itemPicker.product_id = null;
}

function shouldShowExpirationDate(item: PurchaseFormItem): boolean {
  return item.item_type === "material"
    ? !!selectedMaterial(item)?.is_perishable
    : item.has_expiration;
}

function itemTotal(item: PurchaseFormItem): string {
  return formatPeso(item.quantity * item.unit_cost);
}

function itemUnit(item: PurchaseFormItem): string {
  return item.item_type === "material"
    ? selectedMaterial(item)?.unit ?? ""
    : "u";
}

function quantityLabel(item: PurchaseFormItem): string {
  const unit = itemUnit(item);

  return unit ? `${t("purchases.quantity")} (${unit})` : t("purchases.quantity");
}

function selectInitialZero(event: FocusEvent): void {
  const input = event.target;

  if (input instanceof HTMLInputElement && Number(input.value) === 0) {
    input.select();
  }
}

function addSelectedItem(): void {
  const isMaterial = itemPicker.item_type === "material";
  const selectedId = isMaterial ? itemPicker.material_id : itemPicker.product_id;
  if (selectedId === null) return;

  state.items.push(createItem({
    item_type: itemPicker.item_type,
    material_id: isMaterial ? selectedId : null,
    product_id: isMaterial ? null : selectedId,
  }));
  itemPicker.material_id = null;
  itemPicker.product_id = null;
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
      expiration_date: shouldShowExpirationDate(item) ? item.expiration_date : null,
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
        items: [],
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
        name="purchase_date"
      >
        <template #label>
          <SharedFormFieldLabel
            :label="$t('purchases.purchase_date')"
            :hint="$t('purchases.hints.purchase_date')"
            required
          />
        </template>
        <UInput v-model="state.purchase_date" type="date" class="w-full" />
      </UFormField>
    </div>

    <UFormField :label="$t('purchases.notes')" name="notes">
      <UTextarea v-model="state.notes" class="w-full" />
    </UFormField>

    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3"><h2 class="text-base font-medium">{{ $t("purchases.items") }}</h2></div>
      <div class="grid grid-cols-1 items-end gap-3 rounded-lg border border-default bg-elevated/30 p-4 xl:grid-cols-[minmax(14rem,.8fr)_minmax(0,1fr)_auto]">
        <UFormField :label="$t('purchases.item_type')"><div class="grid grid-cols-2 gap-2"><UButton v-for="itemType in itemTypeItems" :key="itemType.value" type="button" :variant="itemPicker.item_type === itemType.value ? 'solid' : 'outline'" color="neutral" size="sm" @click="setPickerItemType(itemType.value)">{{ itemType.label }}</UButton></div></UFormField>
        <UFormField v-if="itemPicker.item_type === 'material'" :label="$t('purchases.material')"><USelect v-model="itemPicker.material_id" :items="materialItems" value-key="id" label-key="name" class="w-full" /></UFormField>
        <UFormField v-else :label="$t('purchases.product')"><USelect v-model="itemPicker.product_id" :items="productItems" value-key="id" label-key="name" class="w-full" /></UFormField>
        <UButton type="button" icon="i-lucide-plus" color="primary" class="w-full whitespace-nowrap xl:w-auto" :disabled="itemPicker.item_type === 'material' ? itemPicker.material_id === null : itemPicker.product_id === null" @click="addSelectedItem">{{ $t("purchases.add_item") }}</UButton>
      </div>
      <div class="overflow-x-auto rounded-lg border border-default"><table class="w-full min-w-[980px] text-left"><thead class="bg-elevated/30 text-sm text-muted"><tr><th class="px-4 py-3">{{ $t('purchases.item_type') }}</th><th class="px-4 py-3">{{ $t('purchases.material') }}</th><th class="px-4 py-3">{{ $t('purchases.quantity') }}</th><th class="px-4 py-3">{{ $t('products.unit') }}</th><th class="px-4 py-3">{{ $t('purchases.unit_cost') }}</th><th class="px-4 py-3">{{ $t('purchases.expiration_date') }}</th><th class="px-4 py-3 text-right">{{ $t('purchases.item_total') }}</th><th class="w-12 px-2 py-3" /></tr></thead><tbody><tr v-for="(item, index) in state.items" :key="item.key" class="border-t border-default"><td class="px-4 py-3 text-sm">{{ item.item_type === 'material' ? $t('purchases.item_types.material') : $t('purchases.item_types.product') }}</td><td class="min-w-60 px-4 py-3 font-medium">{{ item.item_type === 'material' ? selectedMaterial(item)?.name ?? '—' : productItems.find(product => product.id === item.product_id)?.name ?? '—' }}</td><td class="min-w-30 px-4 py-3"><UInput v-model.number="item.quantity" type="number" min="0.01" step="0.01" :aria-label="quantityLabel(item)" class="w-full" /></td><td class="whitespace-nowrap px-4 py-3 text-sm text-muted">{{ itemUnit(item) || '—' }}</td><td class="min-w-34 px-4 py-3"><UInput v-model.number="item.unit_cost" type="number" min="0" step="0.01" :aria-label="$t('purchases.unit_cost')" class="w-full" @focus="selectInitialZero" /></td><td class="min-w-42 px-4 py-3"><template v-if="item.item_type === 'product'"><UCheckbox v-model="item.has_expiration" :label="$t('purchases.has_expiration')" /><UInput v-if="item.has_expiration" v-model="item.expiration_date" type="date" class="mt-2 w-full" /></template><UInput v-else-if="shouldShowExpirationDate(item)" v-model="item.expiration_date" type="date" :aria-label="$t('purchases.expiration_date')" class="w-full" /><span v-else class="text-sm text-muted">—</span></td><td class="whitespace-nowrap px-4 py-3 text-right font-semibold">{{ itemTotal(item) }}</td><td class="px-2 py-3"><UButton type="button" icon="i-lucide-trash" color="error" variant="ghost" :aria-label="$t('common.delete')" @click="removeItem(index)" /></td></tr><tr v-if="state.items.length === 0"><td colspan="8" class="px-4 py-8 text-center text-sm text-muted">{{ $t('purchases.add_item') }}</td></tr></tbody></table></div>
    </div>

    <div class="flex items-center justify-between border-t pt-4">
      <p class="text-sm text-neutral-500">
        {{ $t("purchases.total_cost") }}
      </p>
      <p class="text-lg font-semibold">
        {{ formatPeso(totalCost) }}
      </p>
    </div>

    <UButton type="submit" :loading="isSubmitting" color="primary">
      {{ isUpdating ? $t("common.save_changes") : $t("common.submit") }}
    </UButton>
  </UForm>
</template>
