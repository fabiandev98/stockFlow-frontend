<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import PurchaseForm from "~/components/purchases/PurchaseForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PURCHASES_CREATE],
});

const lp = useLocalePath();

async function handleSubmit() {
  await navigateTo(lp("/purchases"));
}
</script>

<template>
  <PurchaseForm @success="handleSubmit" />
</template>
