<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import ProductForm from "~/components/products/ProductForm.vue";
import { PERMISSION } from "~/constants/permissions";
definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.PRODUCTS_CREATE] });
const lp = useLocalePath();
</script>
<template><ProductForm mode="preparation" @success="navigateTo(lp('/internal-preparations'))" /></template>
