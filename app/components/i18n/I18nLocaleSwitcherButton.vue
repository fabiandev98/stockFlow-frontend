<script setup lang="ts">
import { useLynxLocaleSwitcher } from "#imports";

const localeSwitchOptions = useLynxLocaleSwitcher();
</script>

<template>
  <UDropdownMenu :items="localeSwitchOptions">
    <UButton color="neutral" variant="ghost">
      <UIcon name="i-lucide-globe" class="size-5 shrink-0" />
    </UButton>
  </UDropdownMenu>
</template>

<style scoped></style>
