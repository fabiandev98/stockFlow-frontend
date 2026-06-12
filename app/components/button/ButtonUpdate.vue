<script setup lang="ts">
defineProps<{
  route: string;
}>();
</script>

<template>
  <UButton icon="i-lucide-pen" color="neutral" size="sm" :to="route" />
</template>

<style scoped></style>
