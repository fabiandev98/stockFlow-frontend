<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import ProductForm from "~/components/products/ProductForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PRODUCTS_CREATE],
});

const lp = useLocalePath();

async function handleSubmit() {
  await navigateTo(lp("/products"));
}
</script>

<template>
  <ProductForm @success="handleSubmit" />
</template>
