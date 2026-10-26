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
import type { Material, MaterialPayload, ProcessedMaterialComponentPayload } from "~/types/material";

const props = defineProps<{
  material?: Material;
}>();

const emit = defineEmits<{
  success: [material: Material];
}>();

const { t } = useI18n();
const toast = useToast();
const { fetchMaterialCategories } = useMaterialCategoryModule();
const { createMaterial, fetchMaterials, updateMaterial } = useMaterialModule();

const isUpdating = computed<boolean>(() => !!props.material);
const isSubmitting = ref<boolean>(false);

const { data: categories } = await useAsyncData("material-categories-form", () =>
  fetchMaterialCategories({})
);
const { data: materials } = await useAsyncData("materials-processing-components", () => fetchMaterials({}));

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
  processing_type: z.enum(["raw", "processed", "ready_to_use"]),
  unit: z.string().min(1),
  minimum_stock: z.number().min(0),
  is_perishable: z.boolean(),
  default_expiration_days: z.number().min(1).nullable(),
  processing_components: z.array(z.object({ raw_material_id: z.number().nullable(), quantity_per_unit: z.number().min(0.0001) })),
}).superRefine((data, context) => {
  if (data.processing_type !== "processed") return;

  const selectedIds = new Set<number>();
  data.processing_components.forEach((component, index) => {
    if (component.raw_material_id === null) return;

    if (selectedIds.has(component.raw_material_id)) {
      context.addIssue({
        code: "custom",
        message: t("materials.duplicate_raw_material"),
        path: ["processing_components", index, "raw_material_id"],
      });
    }

    selectedIds.add(component.raw_material_id);
  });
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  material_category_id: props.material?.material_category_id ?? null,
  name: props.material?.name ?? "",
  processing_type: props.material?.processing_type ?? "raw",
  unit: props.material?.unit ?? "u",
  minimum_stock: Number(props.material?.minimum_stock ?? 0),
  is_perishable: props.material?.is_perishable ?? false,
  default_expiration_days: props.material?.default_expiration_days ?? null,
  processing_components: props.material?.processing_components?.map((component) => ({ raw_material_id: component.raw_material_id, quantity_per_unit: Number(component.quantity_per_unit) })) ?? [],
});

const rawMaterials = computed(() => (materials.value?.data ?? []).filter((material) => material.processing_type === "raw" && material.id !== props.material?.id));
const canAddProcessingComponent = computed(() => state.processing_components.filter((component) => component.raw_material_id !== null).length < rawMaterials.value.length);

function rawMaterialItems(index: number) {
  return rawMaterials.value.map((material) => ({
    ...material,
    disabled: state.processing_components.some((component, componentIndex) => componentIndex !== index && component.raw_material_id === material.id),
  }));
}

function rawMaterialUnit(rawMaterialId: number | null): string {
  return rawMaterials.value.find((material) => material.id === rawMaterialId)?.unit ?? "—";
}

function addProcessingComponent(): void {
  state.processing_components.push({ raw_material_id: null, quantity_per_unit: 1 });
}

function removeProcessingComponent(index: number): void {
  state.processing_components.splice(index, 1);
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;

  try {
    const payload: MaterialPayload = {
      ...event.data,
      default_expiration_days: event.data.is_perishable
        ? event.data.default_expiration_days
        : null,
      processing_components: event.data.processing_type === "processed"
        ? event.data.processing_components as ProcessedMaterialComponentPayload[]
        : [],
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
        processing_type: "raw",
        unit: "u",
        minimum_stock: 0,
        is_perishable: false,
        default_expiration_days: null,
        processing_components: [],
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
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
    <UFormField name="name" class="md:col-span-2">
      <template #label>
        <SharedFormFieldLabel
          :label="$t('materials.name')"
          :hint="$t('materials.hints.name')"
          required
        />
      </template>
      <UInput v-model="state.name" class="w-full" />
    </UFormField>

      <UFormField :label="$t('materials.processing_type')" name="processing_type" required>
        <USelect
          v-model="state.processing_type"
          :items="[
            { label: $t('materials.processing_types.raw'), value: 'raw' },
            { label: $t('materials.processing_types.processed'), value: 'processed' },
            { label: $t('materials.processing_types.ready_to_use'), value: 'ready_to_use' },
          ]"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>

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

      <UFormField name="unit" class="md:col-span-2">
        <template #label>
          <SharedFormFieldLabel
            :label="$t('materials.unit')"
            :hint="$t('materials.hints.unit')"
            required
          />
        </template>
        <USelect
          v-model="state.unit"
          :items="unitItems"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>

      <UFormField name="minimum_stock" class="md:col-span-2">
        <template #label>
          <SharedFormFieldLabel
            :label="$t('materials.minimum_stock')"
            :hint="$t('materials.hints.minimum_stock')"
            required
          />
        </template>
        <UInput v-model.number="state.minimum_stock" type="number" min="0" step="0.01" class="w-full" />
      </UFormField>

    </div>

    <div v-if="state.processing_type === 'processed'" class="space-y-3 rounded-xl border border-default bg-elevated/30 p-4">
      <div class="flex items-center justify-between gap-3"><div><h2 class="font-semibold">{{ $t("materials.processing_components") }}</h2><p class="mt-1 text-sm text-muted">{{ $t("materials.processing_components_help") }}</p></div><UButton type="button" icon="i-lucide-plus" variant="soft" :disabled="!canAddProcessingComponent" @click="addProcessingComponent">{{ $t("materials.add_raw_material") }}</UButton></div>
      <p v-if="!state.processing_components.length" class="text-sm text-warning">{{ $t("materials.processing_components_required") }}</p>
      <div v-for="(component, index) in state.processing_components" :key="index" class="grid items-end gap-3 md:grid-cols-[minmax(14rem,2fr)_minmax(10rem,1fr)_minmax(5rem,.45fr)_auto]">
        <UFormField :label="$t('materials.raw_material')" required><USelect v-model="component.raw_material_id" :items="rawMaterialItems(index)" value-key="id" label-key="name" class="w-full" /></UFormField>
        <UFormField :label="$t('materials.quantity_per_processed_unit')" required><UInput v-model.number="component.quantity_per_unit" type="number" min="0.0001" step="0.0001" class="w-full" /></UFormField>
        <UFormField :label="$t('materials.unit')"><UInput :model-value="rawMaterialUnit(component.raw_material_id)" disabled class="w-full" /></UFormField>
        <UButton type="button" icon="i-lucide-trash-2" color="error" variant="ghost" @click="removeProcessingComponent(index)" />
      </div>
    </div>

    <UFormField name="is_perishable">
      <UCheckbox
        v-model="state.is_perishable"
        :label="$t('materials.is_perishable')"
      />
    </UFormField>

    <UFormField
      v-if="state.is_perishable"
      name="default_expiration_days"
    >
      <template #label>
        <SharedFormFieldLabel
          :label="$t('materials.default_expiration_days')"
          :hint="$t('materials.hints.default_expiration_days')"
          required
        />
      </template>
      <UInput
        v-model.number="state.default_expiration_days"
        type="number"
        min="1"
      />
    </UFormField>

    <UButton type="submit" :loading="isSubmitting" color="primary">
      {{ isUpdating ? $t("common.save_changes") : $t("common.submit") }}
    </UButton>
  </UForm>
</template>
