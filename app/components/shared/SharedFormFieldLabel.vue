<script setup lang="ts">
defineProps<{
  label: string;
  hint?: string;
  required?: boolean;
}>();
</script>

<template>
  <span class="inline-flex items-center gap-1.5">
    <span>{{ label }}</span>
    <span v-if="required" class="text-error">*</span>
    <UTooltip v-if="hint" :text="hint">
      <UIcon
        name="i-lucide-circle-help"
        class="size-3.5 cursor-help text-muted"
      />
    </UTooltip>
  </span>
</template>
