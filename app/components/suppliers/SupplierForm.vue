<script setup lang="ts">
import { z } from "zod";
import { FetchError } from "ofetch";
import type { FormSubmitEvent } from "#ui/types";
import { computed, reactive, ref, useI18n, useToast } from "#imports";
import { useSupplierModule } from "~/composables/useSupplierModule";
import type { Supplier, SupplierPayload } from "~/types/supplier";

const props = defineProps<{
  supplier?: Supplier;
}>();

const emit = defineEmits<{
  success: [supplier: Supplier];
}>();

const { t } = useI18n();
const toast = useToast();
const { createSupplier, updateSupplier } = useSupplierModule();

const isUpdating = computed<boolean>(() => !!props.supplier);
const isSubmitting = ref<boolean>(false);

const schema = z.object({
  name: z.string().min(2),
  contact_name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.email().nullable().or(z.literal("")),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: props.supplier?.name ?? "",
  contact_name: props.supplier?.contact_name ?? null,
  phone: props.supplier?.phone ?? null,
  email: props.supplier?.email ?? null,
});

function nullableText(value: string | null): string | null {
  return value && value.trim() !== "" ? value : null;
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;

  try {
    const payload: SupplierPayload = {
      name: event.data.name,
      contact_name: nullableText(event.data.contact_name),
      phone: nullableText(event.data.phone),
      email: nullableText(event.data.email),
    };

    const result = isUpdating.value
      ? await updateSupplier(props.supplier!.id, payload)
      : await createSupplier(payload);

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
        name: "",
        contact_name: null,
        phone: null,
        email: null,
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
    <UFormField :label="$t('suppliers.name')" name="name" required>
      <UInput v-model="state.name" class="w-full" />
    </UFormField>

    <UFormField :label="$t('suppliers.contact_name')" name="contact_name">
      <UInput v-model="state.contact_name" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField :label="$t('suppliers.phone')" name="phone">
        <UInput v-model="state.phone" class="w-full" />
      </UFormField>

      <UFormField :label="$t('suppliers.email')" name="email">
        <UInput v-model="state.email" type="email" class="w-full" />
      </UFormField>
    </div>

    <UButton type="submit" :loading="isSubmitting" color="brand">
      {{ isUpdating ? $t("common.save_changes") : $t("common.submit") }}
    </UButton>
  </UForm>
</template>
