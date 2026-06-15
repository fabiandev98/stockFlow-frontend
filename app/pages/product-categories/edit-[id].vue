<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  useAsyncData,
  useI18n,
  useLocalePath,
  useProductCategoryModule,
  useRoute,
} from "#imports";
import ProductCategoryForm from "~/components/products/ProductCategoryForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PRODUCT_CATEGORIES_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchProductCategoryById } = useProductCategoryModule();

const { data, error } = await useAsyncData(() =>
  fetchProductCategoryById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

async function handleSubmit() {
  await navigateTo(lp("/product-categories"));
}
</script>

<template>
  <ProductCategoryForm :category="data" @success="handleSubmit" />
</template>
