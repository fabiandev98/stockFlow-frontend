<script setup lang="ts">
import { definePageMeta } from "#imports";
import ProductStockMovementForm from "~/components/inventory/ProductStockMovementForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.STOCK_MOVEMENTS_CREATE] });
</script>

<template><ProductStockMovementForm /></template>
