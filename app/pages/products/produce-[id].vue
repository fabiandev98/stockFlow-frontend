<script setup lang="ts">
import { definePageMeta, useRoute } from "#imports";
import ProductProductionForm from "~/components/products/ProductProductionForm.vue";
import { PERMISSION } from "~/constants/permissions";
definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.PRODUCTS_UPDATE] });
const route = useRoute();
</script>
<template><ProductProductionForm :product-id="Number(route.params.id)" /></template>
