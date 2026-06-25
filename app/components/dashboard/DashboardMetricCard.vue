<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  icon: string;
  detail?: string;
}>();
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm text-muted">{{ label }}</p>
        <p class="mt-1 text-2xl font-semibold text-highlighted">{{ value }}</p>
        <p v-if="detail" class="mt-2 text-xs text-muted">{{ detail }}</p>
      </div>
      <UIcon :name="icon" class="size-7 shrink-0 text-primary" />
    </div>
  </UCard>
</template>
