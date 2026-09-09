<script setup lang="ts">
import { createError, definePageMeta, navigateTo, useAsyncData, useI18n, useLocalePath, useProductModule, useRoute } from "#imports";
import ProductForm from "~/components/products/ProductForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";
definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.PRODUCTS_UPDATE] });
const { t } = useI18n(); const lp = useLocalePath(); const route = useRoute(); const { fetchProductById } = useProductModule();
const { data, error } = await useAsyncData(() => fetchProductById(Number(route.params.id)));
if (error.value || data.value === null || !data.value.is_internal_preparation) throw createError({ statusCode: HTTP_STATUS.NOT_FOUND, statusMessage: t("http_error.404"), fatal: true });
</script>
<template><ProductForm :product="data" mode="preparation" @success="navigateTo(lp('/internal-preparations'))" /></template>
