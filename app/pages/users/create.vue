<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  ref,
  useAsyncData,
  useI18n,
  useLocalePath,
  useToast,
  useUserModule,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import UserForm from "~/components/user/UserForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import type { Role } from "~/types/role";
import type { User } from "~/types/user";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.USERS_CREATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const { fetchCurrentUserRolesBelow } = useUserModule();

const { data, error } = await useAsyncData(() => fetchCurrentUserRolesBelow());
const availableRoles = ref<Role[]>(data.value ?? []);

if (error.value) {
  throw createError({
    statusCode: HTTP_STATUS.FORBIDDEN,
    statusMessage: t("common.generic_unknown_error"),
    fatal: true,
  });
}

async function handleSubmit(user: User) {
  toast.add({
    color: "success",
    title: t("common.crud.resource_created", { resource: user.name }),
    description: t("common.crud.resource_deleted_description", {
      resource: user.name,
    }),
  });
  await navigateTo(lp("/users"));
}
</script>

<template>
  <UserForm
    mode="create"
    :show-role-field="true"
    :available-roles="availableRoles"
    @submit-success="handleSubmit"
  />
</template>

<style scoped></style>
