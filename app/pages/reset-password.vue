<script setup lang="ts">
import {
  definePageMeta,
  navigateTo,
  useAuth,
  useI18n,
  useLocalePath,
  useRoute,
  useToast,
} from "#imports";
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
const route = useRoute();

const validations = z
  .object({
    email: z.string().email(t("auth.invalid_email")),
    password: z.string().min(8, t("auth.password_min_len")),
    password_confirmation: z.string().min(8, t("auth.password_min_len")),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: t("auth.passwords_dont_match"),
    path: ["password_confirmation"],
  });

type Schema = z.output<typeof validations>;

const state = reactive<Partial<Schema>>({
  email: (route.query.email as string) || undefined,
  password: undefined,
  password_confirmation: undefined,
});

const form = useTemplateRef("resetPasswordForm");

const { resetPassword } = useAuth();
const isSubmitting = ref<boolean>(false);

const token = route.query.token as string;

if (!token || !state.email) {
  toast.add({
    color: "error",
    title: t("auth.reset_password_title"),
    description: t("auth.invalid_reset_link"),
  });
  navigateTo(lp("/"));
}

async function handleSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;
  try {
    isSubmitting.value = true;
    await resetPassword({
      email: event.data.email,
      token: token,
      password: event.data.password,
      password_confirmation: event.data.password_confirmation,
    });

    toast.add({
      color: "success",
      title: t("auth.reset_password_title"),
      description: t("auth.reset_password_success"),
    });

    await navigateTo(lp("/"));
  } catch (error: unknown) {
    if (!(error instanceof FetchError)) {
      form.value?.setErrors([
        { name: "password", message: t("common.generic_unknown_error") },
      ]);
      return;
    }

    if (error.statusCode === HTTP_STATUS.UNPROCESSABLE_CONTENT) {
      form.value?.setErrors([
        { name: "password", message: t("auth.invalid_reset_token") },
      ]);
    } else {
      form.value?.setErrors([
        { name: "password", message: t("common.generic_unknown_error") },
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
        {{ $t("auth.reset_password") }}
      </h1>

      <UForm
        ref="resetPasswordForm"
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
            readonly
          />
        </UFormField>

        <UFormField name="password" :label="$t('auth.new_password')">
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UFormField
          name="password_confirmation"
          :label="$t('auth.password_confirmation')"
        >
          <UInput
            v-model="state.password_confirmation"
            type="password"
            class="w-full"
          />
        </UFormField>

        <UButton :loading="isSubmitting" type="submit" color="brand" block>
          {{ $t("auth.reset_password_submit") }}
        </UButton>
      </UForm>
    </div>
  </UContainer>
</template>
