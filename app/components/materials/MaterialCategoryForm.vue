<script setup lang="ts">
import { z } from "zod";
import { FetchError } from "ofetch";
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, ref, useI18n, useToast } from "#imports";
import { useMaterialCategoryModule } from "~/composables/useMaterialCategoryModule";
import type {
  MaterialCategory,
  MaterialCategoryPayload,
} from "~/types/material";

const props = defineProps<{
  category?: MaterialCategory;
}>();

const emit = defineEmits<{
  success: [category: MaterialCategory];
}>();

const { t } = useI18n();
const toast = useToast();
const { createMaterialCategory, updateMaterialCategory } =
  useMaterialCategoryModule();

const isUpdating = computed<boolean>(() => !!props.category);
const isSubmitting = ref<boolean>(false);

const schema = z.object({
  name: z.string().min(2),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: props.category?.name ?? "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;

  try {
    const payload: MaterialCategoryPayload = {
      name: event.data.name,
    };

    const result = isUpdating.value
      ? await updateMaterialCategory(props.category!.id, payload)
      : await createMaterialCategory(payload);

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
      state.name = "";
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
    <UFormField :label="$t('material_categories.name')" name="name" required>
      <UInput v-model="state.name" class="w-full" />
    </UFormField>

    <UButton type="submit" :loading="isSubmitting" color="brand">
      {{ isUpdating ? $t("common.save_changes") : $t("common.submit") }}
    </UButton>
  </UForm>
</template>
