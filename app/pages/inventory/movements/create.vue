<script setup lang="ts">
import { definePageMeta } from "#imports";
import StockMovementForm from "~/components/inventory/StockMovementForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.STOCK_MOVEMENTS_CREATE],
});
</script>

<template>
  <StockMovementForm />
</template>
