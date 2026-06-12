<script setup lang="ts">
import { definePageMeta } from "#imports";

definePageMeta({
  middleware: ["auth-guard"],
});
</script>

<template>
  <div>Dashboard home content</div>
</template>

<style scoped></style>
