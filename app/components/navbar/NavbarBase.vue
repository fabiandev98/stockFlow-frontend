<script setup lang="ts">
import NavbarMainLogo from "./NavbarMainLogo.vue";
import { useColorMode } from "#imports";

const colorMode = useColorMode()
</script>

<template>
  <UHeader>
    <template #left>
      <NavbarMainLogo />
    </template>

    <slot />

    <template #right>
      <slot name="right" />
      <SharedColorThemeSelector v-if="!colorMode.forced"/>
    </template>
  </UHeader>
</template>

<style scoped></style>
