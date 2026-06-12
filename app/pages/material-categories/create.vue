<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import MaterialCategoryForm from "~/components/materials/MaterialCategoryForm.vue";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.MATERIAL_CATEGORIES_CREATE],
});

const lp = useLocalePath();

async function handleSubmit() {
  await navigateTo(lp("/material-categories"));
}
</script>

<template>
  <MaterialCategoryForm @success="handleSubmit" />
</template>
