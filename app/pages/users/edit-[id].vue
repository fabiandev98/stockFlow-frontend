<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  ref,
  useAsyncData,
  useI18n,
  useLocalePath,
  useRoute,
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
  permissions: [PERMISSION.USERS_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const route = useRoute();
const { fetchCurrentUserRolesBelow, fetchUser } = useUserModule();

const { data, error } = await useAsyncData(() =>
  fetchUser(Number(route.params.id))
);
if (error.value || !data.value) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}
const user = ref<User>(data.value);

const { data: roleData, error: roleError } = await useAsyncData(() =>
  fetchCurrentUserRolesBelow()
);
const availableRoles = ref<Role[]>(roleData.value ?? []);

if (roleError.value) {
  throw createError({
    statusCode: HTTP_STATUS.FORBIDDEN,
    statusMessage: t("common.generic_unknown_error"),
    fatal: true,
  });
}

async function handleSubmit(user: User) {
  toast.add({
    color: "success",
    title: t("common.crud.resource_updated", { resource: user.name }),
    description: t("common.crud.resource_updated_description", {
      resource: user.name,
    }),
  });
  await navigateTo(lp("/users"));
}
</script>

<template>
  <UserForm
    mode="edit"
    :user="user"
    :show-role-field="true"
    :available-roles="availableRoles"
    @submit-success="handleSubmit"
  />
</template>

<style scoped></style>
