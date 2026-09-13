<script setup lang="ts">
import { definePageMeta } from "#imports";
import MaterialProcessingForm from "~/components/inventory/MaterialProcessingForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.STOCK_MOVEMENTS_CREATE] });
</script>

<template><MaterialProcessingForm /></template>
