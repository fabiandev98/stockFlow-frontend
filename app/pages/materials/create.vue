<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import MaterialForm from "~/components/materials/MaterialForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.MATERIALS_CREATE],
});

const lp = useLocalePath();

async function handleSubmit() {
  await navigateTo(lp("/materials"));
}
</script>

<template>
  <MaterialForm @success="handleSubmit" />
</template>
