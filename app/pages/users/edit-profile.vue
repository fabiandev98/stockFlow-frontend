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
import { HTTP_STATUS } from "~/constants/http-statuses";
import type { User } from "~/types/user";
import useAuthStore from "~/stores/auth-store";

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
</script>

<template>
  <UserForm
    mode="edit"
    :user="user"
    :show-role-field="false"
    @submit-success="handleSubmit"
  />
</template>

<style scoped></style>
