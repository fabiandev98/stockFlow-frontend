<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui";

type ButtonColor = NonNullable<ButtonProps["color"]>;
interface Props {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ButtonColor;
}
defineProps<Props>();

const emit = defineEmits<{
  close: [confirmed: boolean];
}>();
</script>

<template>
  <UModal :title="title" :close="false" :dismissible="false">
    <template #body>
      {{ message }}
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton
          variant="outline"
          color="neutral"
          @click="emit('close', false)"
        >
          {{ cancelText ?? $t("common.cancel") }}
        </UButton>
        <UButton :color="variant ?? 'error'" @click="emit('close', true)">
          {{ confirmText ?? $t("common.confirm") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
