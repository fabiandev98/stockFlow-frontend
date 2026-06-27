<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  ref,
  useAccessControl,
  useAsyncData,
  useI18n,
  useLocalePath,
  useRoute,
  useToast,
  useUserModule,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import UserForm from "~/components/user/UserForm.vue";
import UserPasswordForm from "~/components/user/UserPasswordForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import type { Role } from "~/types/role";
import type { User } from "~/types/user";
import useAuthStore from "~/stores/auth-store";
import { FetchError } from "ofetch";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.USERS_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const route = useRoute();
const authStore = useAuthStore();
const { fetchCurrentUserRolesBelow, fetchUser } = useUserModule();
const { userCan, roleCan } = useAccessControl([PERMISSION.USERS_UPDATE]);

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

const canUpdatePassword = (): boolean => {
  const currentUser = authStore.user;
  const targetUser = user.value;

  if (!currentUser) {
    return false;
  }

  if (currentUser.id === targetUser.id) {
    return true;
  }

  const targetHierarchy = targetUser.role?.hierarchy;
  if (targetHierarchy === undefined) {
    return false;
  }

  return userCan(PERMISSION.USERS_UPDATE) && roleCan(targetHierarchy);
};

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
      :show-role-field="true"
      :available-roles="availableRoles"
      @submit-success="handleSubmit"
    />

    <div v-if="canUpdatePassword()">
      <h2 class="text-lg font-medium mb-3">
        {{ $t("auth.update_password_submit") }}
      </h2>
      <UserPasswordForm
        :user-id="user.id"
        :require-current-password="authStore.user?.id === user.id"
        @submit-success="handlePasswordSubmit"
        @submit-error="handlePasswordError"
      />
    </div>
  </div>
</template>

<style scoped></style>
