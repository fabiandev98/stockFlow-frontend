<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  useAsyncData,
  useI18n,
  useLocalePath,
  useMaterialCategoryModule,
  useRoute,
} from "#imports";
import MaterialCategoryForm from "~/components/materials/MaterialCategoryForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.MATERIAL_CATEGORIES_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchMaterialCategoryById } = useMaterialCategoryModule();

const { data, error } = await useAsyncData(() =>
  fetchMaterialCategoryById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

async function handleSubmit() {
  await navigateTo(lp("/material-categories"));
}
</script>

<template>
  <MaterialCategoryForm :category="data" @success="handleSubmit" />
</template>
