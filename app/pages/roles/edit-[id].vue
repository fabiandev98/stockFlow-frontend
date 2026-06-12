<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  useAsyncData,
  useI18n,
  useLocalePath,
  useRoleModule,
  useRoute,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import { HTTP_STATUS } from "~/constants/http-statuses";
import RoleForm from "~/components/roles/RoleForm.vue";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.ROLES_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchRoleById } = useRoleModule();

const { data, error } = await useAsyncData(() =>
  fetchRoleById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

async function handleSubmit() {
  await navigateTo(lp("/roles"));
}
</script>

<template>
  <RoleForm :role="data" @success="handleSubmit" />
</template>

<style scoped></style>
