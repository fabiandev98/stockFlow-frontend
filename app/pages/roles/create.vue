<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import { PERMISSION } from "~/constants/permissions";
import RoleForm from "~/components/roles/RoleForm.vue";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.ROLES_CREATE],
});

const lp = useLocalePath();

async function handleSubmit() {
  await navigateTo(lp("/roles"));
}
</script>

<template>
  <RoleForm @success="handleSubmit" />
</template>

<style scoped></style>
