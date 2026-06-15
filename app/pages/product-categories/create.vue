<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import ProductCategoryForm from "~/components/products/ProductCategoryForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PRODUCT_CATEGORIES_CREATE],
});

const lp = useLocalePath();

async function handleSubmit() {
  await navigateTo(lp("/product-categories"));
}
</script>

<template>
  <ProductCategoryForm @success="handleSubmit" />
</template>
