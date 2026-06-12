<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  useAsyncData,
  useI18n,
  useLocalePath,
  useMaterialModule,
  useRoute,
} from "#imports";
import MaterialForm from "~/components/materials/MaterialForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.MATERIALS_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchMaterialById } = useMaterialModule();

const { data, error } = await useAsyncData(() =>
  fetchMaterialById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

async function handleSubmit() {
  await navigateTo(lp("/materials"));
}
</script>

<template>
  <MaterialForm :material="data" @success="handleSubmit" />
</template>
