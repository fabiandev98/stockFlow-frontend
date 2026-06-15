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
  useProductCategoryModule,
  useProductModule,
  useToast,
} from "#imports";
import type { Material } from "~/types/material";
import type { Product, ProductPayload } from "~/types/product";
import { formatPeso } from "~/utils/currency-format";

interface ProductFormComposition {
  key: number;
  material_id: number | null;
  quantity_required: number;
  unit: string;
}

const props = defineProps<{
  product?: Product;
}>();

const emit = defineEmits<{
  success: [product: Product];
}>();

const { t } = useI18n();
const toast = useToast();
const { fetchProductCategories } = useProductCategoryModule();
const { fetchMaterials } = useMaterialModule();
const { createProduct, updateProduct } = useProductModule();

const isUpdating = computed<boolean>(() => !!props.product);
const isSubmitting = ref<boolean>(false);
const nextCompositionKey = ref<number>(1);

const { data: categories } = await useAsyncData("product-form-categories", () =>
  fetchProductCategories({})
);
const { data: materials } = await useAsyncData("product-form-materials", () =>
  fetchMaterials({})
);

const schema = z.object({
  product_category_id: z.number().nullable(),
  name: z.string().min(2),
  sale_price: z.number().min(0),
  is_active: z.boolean(),
  compositions: z
    .array(
      z.object({
        material_id: z.number().min(1),
        quantity_required: z.number().min(0.01),
        unit: z.string().min(1),
      })
    )
    .min(1),
});

function createComposition(
  composition?: Partial<ProductFormComposition>
): ProductFormComposition {
  return {
    key: nextCompositionKey.value++,
    material_id: composition?.material_id ?? null,
    quantity_required: composition?.quantity_required ?? 1,
    unit: composition?.unit ?? "u",
  };
}

const state = reactive<{
  product_category_id: number | null;
  name: string;
  sale_price: number;
  is_active: boolean;
  compositions: ProductFormComposition[];
}>({
  product_category_id: props.product?.product_category_id ?? null,
  name: props.product?.name ?? "",
  sale_price: Number(props.product?.sale_price ?? 0),
  is_active: props.product?.is_active ?? true,
  compositions:
    props.product?.compositions?.map((composition) =>
      createComposition({
        material_id: composition.material_id,
        quantity_required: Number(composition.quantity_required),
        unit: composition.unit,
      })
    ) ?? [createComposition()],
});

const materialItems = computed<Material[]>(() => materials.value?.data ?? []);
const formattedSalePrice = computed<string>(() => formatPeso(state.sale_price));

function selectedMaterial(
  composition: ProductFormComposition
): Material | undefined {
  return materialItems.value.find(
    (material) => material.id === composition.material_id
  );
}

function handleMaterialChange(composition: ProductFormComposition): void {
  const material = selectedMaterial(composition);
  if (material) {
    composition.unit = material.unit;
  }
}

function addComposition(): void {
  state.compositions.push(createComposition());
}

function removeComposition(index: number): void {
  if (state.compositions.length === 1) return;
  state.compositions.splice(index, 1);
}

function payloadFromState(): ProductPayload {
  return {
    product_category_id: state.product_category_id,
    name: state.name,
    sale_price: state.sale_price,
    is_active: state.is_active,
    compositions: state.compositions.map((composition) => ({
      material_id: composition.material_id,
      quantity_required: composition.quantity_required,
      unit: composition.unit,
    })),
  };
}

async function onSubmit() {
  isSubmitting.value = true;

  try {
    const payload = payloadFromState();

    const result = isUpdating.value
      ? await updateProduct(props.product!.id, payload)
      : await createProduct(payload);

    toast.add({
      title: t(
        isUpdating.value
          ? "common.crud.resource_updated"
          : "common.crud.resource_created",
        { resource: result.name }
      ),
      color: "success",
    });

    emit("success", result);

    if (!isUpdating.value) {
      Object.assign(state, {
        product_category_id: null,
        name: "",
        sale_price: 0,
        is_active: true,
        compositions: [createComposition()],
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
      <UFormField :label="$t('products.name')" name="name" required>
        <UInput v-model="state.name" class="w-full" />
      </UFormField>

      <UFormField :label="$t('products.category')" name="product_category_id">
        <USelect
          v-model="state.product_category_id"
          :items="categories?.data ?? []"
          value-key="id"
          label-key="name"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
      <UFormField :label="$t('products.sale_price')" name="sale_price" required>
        <UInput
          v-model.number="state.sale_price"
          type="number"
          min="0"
          step="0.01"
          class="w-full"
        />
      </UFormField>

      <div>
        <p class="text-xs text-neutral-500">
          {{ $t("products.formatted_sale_price") }}
        </p>
        <p class="font-medium">
          {{ formattedSalePrice }}
        </p>
      </div>
    </div>

    <UFormField name="is_active">
      <UCheckbox v-model="state.is_active" :label="$t('products.is_active')" />
    </UFormField>

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-medium">
          {{ $t("products.compositions") }}
        </h2>
        <UButton
          type="button"
          icon="i-lucide-plus"
          variant="soft"
          @click="addComposition"
        >
          {{ $t("products.add_composition") }}
        </UButton>
      </div>

      <div
        v-for="(composition, index) in state.compositions"
        :key="composition.key"
        class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end border border-neutral-200 rounded p-3"
      >
        <UFormField
          :label="$t('products.material')"
          :name="`compositions.${index}.material_id`"
          class="lg:col-span-5"
          required
        >
          <USelect
            v-model="composition.material_id"
            :items="materialItems"
            value-key="id"
            label-key="name"
            class="w-full"
            @update:model-value="handleMaterialChange(composition)"
          />
        </UFormField>

        <UFormField
          :label="$t('products.quantity_required')"
          :name="`compositions.${index}.quantity_required`"
          class="lg:col-span-3"
          required
        >
          <UInput
            v-model.number="composition.quantity_required"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('products.unit')"
          :name="`compositions.${index}.unit`"
          class="lg:col-span-3"
          required
        >
          <UInput v-model="composition.unit" class="w-full" />
        </UFormField>

        <div class="lg:col-span-1 flex justify-end">
          <UButton
            type="button"
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            :disabled="state.compositions.length === 1"
            @click="removeComposition(index)"
          />
        </div>
      </div>
    </div>

    <UButton type="submit" :loading="isSubmitting" color="brand">
      {{ isUpdating ? $t("common.save_changes") : $t("common.submit") }}
    </UButton>
  </UForm>
</template>
