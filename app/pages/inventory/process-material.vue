<script setup lang="ts">
import { definePageMeta } from "#imports";
import MaterialProcessingCompositionForm from "~/components/inventory/MaterialProcessingCompositionForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.STOCK_MOVEMENTS_CREATE] });
</script>

<template><MaterialProcessingCompositionForm /></template>
