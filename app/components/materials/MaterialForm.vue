<script setup lang="ts">
import { z } from "zod";
import { FetchError } from "ofetch";
import type { FormSubmitEvent } from "#ui/types";
import {
  computed,
  reactive,
  ref,
  useAsyncData,
  useI18n,
  useToast,
} from "#imports";
import { useMaterialCategoryModule } from "~/composables/useMaterialCategoryModule";
import { useMaterialModule } from "~/composables/useMaterialModule";
import type { Material, MaterialPayload } from "~/types/material";

const props = defineProps<{
  material?: Material;
}>();

const emit = defineEmits<{
  success: [material: Material];
}>();

const { t } = useI18n();
const toast = useToast();
const { fetchMaterialCategories } = useMaterialCategoryModule();
const { createMaterial, updateMaterial } = useMaterialModule();

const isUpdating = computed<boolean>(() => !!props.material);
const isSubmitting = ref<boolean>(false);

const { data: categories } = await useAsyncData("material-categories-form", () =>
  fetchMaterialCategories({})
);

const unitItems = [
  { label: t("materials.units.g"), value: "g" },
  { label: t("materials.units.kg"), value: "kg" },
  { label: t("materials.units.ml"), value: "ml" },
  { label: t("materials.units.l"), value: "l" },
  { label: t("materials.units.oz"), value: "oz" },
  { label: t("materials.units.lb"), value: "lb" },
  { label: t("materials.units.u"), value: "u" },
  { label: t("materials.units.box"), value: "box" },
  { label: t("materials.units.pack"), value: "pack" },
];

const schema = z.object({
  material_category_id: z.number().nullable(),
  name: z.string().min(2),
  unit: z.string().min(1),
  minimum_stock: z.number().min(0),
  is_perishable: z.boolean(),
  default_expiration_days: z.number().min(1).nullable(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  material_category_id: props.material?.material_category_id ?? null,
  name: props.material?.name ?? "",
  unit: props.material?.unit ?? "u",
  minimum_stock: Number(props.material?.minimum_stock ?? 0),
  is_perishable: props.material?.is_perishable ?? false,
  default_expiration_days: props.material?.default_expiration_days ?? null,
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;

  try {
    const payload: MaterialPayload = {
      ...event.data,
      default_expiration_days: event.data.is_perishable
        ? event.data.default_expiration_days
        : null,
    };

    const result = isUpdating.value
      ? await updateMaterial(props.material!.id, payload)
      : await createMaterial(payload);

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
        material_category_id: null,
        name: "",
        unit: "u",
        minimum_stock: 0,
        is_perishable: false,
        default_expiration_days: null,
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
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField :label="$t('materials.name')" name="name" required>
      <UInput v-model="state.name" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField
        :label="$t('materials.category')"
        name="material_category_id"
      >
        <USelect
          v-model="state.material_category_id"
          :items="categories?.data ?? []"
          value-key="id"
          label-key="name"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('materials.unit')" name="unit" required>
        <USelect
          v-model="state.unit"
          :items="unitItems"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField
      :label="$t('materials.minimum_stock')"
      name="minimum_stock"
      required
    >
      <UInput v-model.number="state.minimum_stock" type="number" step="0.01" />
    </UFormField>

    <UFormField name="is_perishable">
      <UCheckbox
        v-model="state.is_perishable"
        :label="$t('materials.is_perishable')"
      />
    </UFormField>

    <UFormField
      v-if="state.is_perishable"
      :label="$t('materials.default_expiration_days')"
      name="default_expiration_days"
      required
    >
      <UInput
        v-model.number="state.default_expiration_days"
        type="number"
        min="1"
      />
    </UFormField>

    <UButton type="submit" :loading="isSubmitting" color="brand">
      {{ isUpdating ? $t("common.save_changes") : $t("common.submit") }}
    </UButton>
  </UForm>
</template>
