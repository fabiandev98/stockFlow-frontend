<script setup lang="ts">
import { definePageMeta, navigateTo, useAuth, useI18n, useLocalePath, useToast } from "#imports";
import { reactive, ref, useTemplateRef } from "vue";
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";
import { FetchError } from "ofetch";
import { HTTP_STATUS } from "~/constants/http-statuses";

definePageMeta({
  middleware: ["guest-guard"],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const validations = z.object({
  email: z.email(t("auth.invalid_email")),
});

type Schema = z.output<typeof validations>;

const state = reactive<Partial<Schema>>({
  email: undefined,
});
const form = useTemplateRef("forgotPasswordForm");

const { forgotPassword } = useAuth();
const isSubmitting = ref<boolean>(false);

async function handleSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;
  try {
    isSubmitting.value = true;
    await forgotPassword(event.data.email);

    toast.add({
      color: "success",
      title: t("auth.forgot_password_title"),
      description: t("auth.forgot_password_success"),
    });

    await navigateTo(lp("home"));
  } catch (error: unknown) {
    if (!(error instanceof FetchError)) {
      form.value?.setErrors([
        { name: "email", message: $t("common.generic_unknown_error") },
      ]);
      return;
    }

    if (error.statusCode === HTTP_STATUS.UNPROCESSABLE_CONTENT) {
      form.value?.setErrors([
        { name: "email", message: t("auth.incorrect_creds_error") },
      ]);
    } else {
      form.value?.setErrors([
        { name: "email", message: t("common.generic_unknown_error") },
      ]);
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UContainer class="flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg p-6">
      <h1 class="text-2xl font-semibold text-center mb-6">
        {{ $t("auth.forgot_password") }}
      </h1>

      <UForm
        ref="forgotPasswordForm"
        :schema="validations"
        :state="state"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField name="email" :label="$t('auth.email')">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="john@doe.com"
            class="w-full"
          />
        </UFormField>

        <UButton
          :loading="isSubmitting"
          type="submit"
          color="brand"
          block
        >
          {{ $t("auth.submit") }}
        </UButton>
      </UForm>
    </div>
  </UContainer>
</template>

<style scoped></style>