<script setup lang="ts">
defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <UButton
    icon="i-lucide-trash"
    color="error"
    size="sm"
    :loading="loading"
    @click="emit('click')"
  />
</template>

<style scoped></style>
