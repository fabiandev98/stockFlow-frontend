<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import SupplierForm from "~/components/suppliers/SupplierForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.SUPPLIERS_CREATE],
});

const lp = useLocalePath();

async function handleSubmit() {
  await navigateTo(lp("/suppliers"));
}
</script>

<template>
  <SupplierForm @success="handleSubmit" />
</template>
