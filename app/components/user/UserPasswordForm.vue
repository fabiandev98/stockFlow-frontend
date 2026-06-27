<script setup lang="ts">
import * as z from "zod";
import { computed, reactive, ref, useTemplateRef } from "vue";
import { useI18n, useUserModule } from "#imports";
import type { FormSubmitEvent } from "@nuxt/ui";
import { FetchError } from "ofetch";
import { HTTP_STATUS } from "~/constants/http-statuses";
import type { UpdateUserPasswordPayload } from "~/types/user-form";

const props = defineProps<{
  userId: number;
  requireCurrentPassword?: boolean;
  submitButtonText?: string;
}>();

const emit = defineEmits<{
  "submit-success": [];
  "submit-error": [error: unknown];
}>();

const { t } = useI18n();

const shouldRequireCurrentPassword = computed<boolean>(
  () => props.requireCurrentPassword ?? true
);

const schema = computed(() =>
  z
    .object({
      current_password: shouldRequireCurrentPassword.value
        ? z.string().min(1, t("auth.current_password_required"))
        : z.string().optional(),
      password: z.string().min(8, t("auth.password_min_len")),
      password_confirmation: z.string().min(8, t("auth.password_min_len")),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t("auth.passwords_dont_match"),
      path: ["password_confirmation"],
    })
);

type PasswordFormData = {
  current_password?: string;
  password: string;
  password_confirmation: string;
};

const state = reactive<Partial<UpdateUserPasswordPayload>>({
  current_password: undefined,
  password: undefined,
  password_confirmation: undefined,
});

const form = useTemplateRef("passwordForm");
const isSubmitting = ref<boolean>(false);

const buttonText = computed(() => {
  if (props.submitButtonText) return props.submitButtonText;
  return t("auth.update_password_submit");
});

async function handleSubmit(event: FormSubmitEvent<PasswordFormData>) {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    const { updateUserPassword } = useUserModule();

    await updateUserPassword(props.userId, {
      ...(shouldRequireCurrentPassword.value && {
        current_password: event.data.current_password,
      }),
      password: event.data.password,
      password_confirmation: event.data.password_confirmation,
    });

    state.current_password = undefined;
    state.password = undefined;
    state.password_confirmation = undefined;

    emit("submit-success");
  } catch (error: unknown) {
    emit("submit-error", error);

    if (!(error instanceof FetchError)) {
      form.value?.setErrors([
        { name: "password", message: t("common.generic_unknown_error") },
      ]);
      return;
    }

    if (error.statusCode === HTTP_STATUS.UNPROCESSABLE_CONTENT) {
      const backendErrors = error.data?.errors || {};
      const formErrors = Object.entries(backendErrors).map(
        ([field, messages]) => ({
          name: field,
          message: Array.isArray(messages) ? messages[0] : messages,
        })
      );

      if (formErrors.length > 0) {
        form.value?.setErrors(formErrors);
      }
      return;
    }

    form.value?.setErrors([
      { name: "password", message: t("common.generic_unknown_error") },
    ]);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UForm
    ref="passwordForm"
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="handleSubmit"
  >
    <UFormField
      v-if="shouldRequireCurrentPassword"
      name="current_password"
      :label="$t('auth.current_password')"
    >
      <UInput
        v-model="state.current_password"
        type="password"
        :placeholder="$t('auth.password_placeholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField name="password" :label="$t('auth.new_password')">
      <UInput
        v-model="state.password"
        type="password"
        :placeholder="$t('auth.password_placeholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="password_confirmation"
      :label="$t('auth.password_confirmation')"
    >
      <UInput
        v-model="state.password_confirmation"
        type="password"
        :placeholder="$t('auth.password_placeholder')"
        class="w-full"
      />
    </UFormField>

    <UButton
      :loading="isSubmitting"
      type="submit"
      color="brand"
      block
      class="mt-2"
    >
      {{ buttonText }}
    </UButton>
  </UForm>
</template>
