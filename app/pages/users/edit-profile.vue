<script setup lang="ts">
import {
  createError,
  definePageMeta,
  ref,
  useAsyncData,
  useI18n,
  useToast,
  useUserModule,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import UserForm from "~/components/user/UserForm.vue";
import UserPasswordForm from "~/components/user/UserPasswordForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import type { User } from "~/types/user";
import useAuthStore from "~/stores/auth-store";
import { FetchError } from "ofetch";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.USERS_UPDATE],
});

const { t } = useI18n();
const toast = useToast();
const { fetchUser } = useUserModule();
const { user: authUser } = useAuthStore();

const { data, error } = await useAsyncData(() =>
  fetchUser(Number(authUser?.id))
);
if (error.value || !data.value) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}
const user = ref<User>(data.value);
// TODO: Update the auth session visible data
async function handleSubmit(user: User) {
  toast.add({
    color: "success",
    title: t("common.crud.resource_updated", { resource: user.name }),
    description: t("common.crud.resource_updated_description", {
      resource: user.name,
    }),
  });
}

function handlePasswordSubmit() {
  toast.add({
    color: "success",
    title: t("auth.update_password_submit"),
    description: t("auth.password_updated_success"),
  });
}

function handlePasswordError(error: unknown) {
  if (error instanceof FetchError) {
    if (error.statusCode === HTTP_STATUS.UNPROCESSABLE_CONTENT) {
      return;
    }

    const context = `${error.statusCode} - ${error.data?.message ?? error.message}`;

    toast.add({
      color: "error",
      title: t("common.generic_error_title"),
      description: t("common.generic_error", { context }),
    });
    return;
  }

  toast.add({
    color: "error",
    title: t("common.generic_error_title"),
    description: t("common.generic_unknown_error"),
  });
}
</script>

<template>
  <div class="space-y-8">
    <UserForm
      mode="edit"
      :user="user"
      :show-role-field="false"
      @submit-success="handleSubmit"
    />

    <div>
      <h2 class="text-lg font-medium mb-3">
        {{ $t("auth.update_password_submit") }}
      </h2>
      <UserPasswordForm
        :user-id="user.id"
        :require-current-password="true"
        @submit-success="handlePasswordSubmit"
        @submit-error="handlePasswordError"
      />
    </div>
  </div>
</template>

<style scoped></style>
