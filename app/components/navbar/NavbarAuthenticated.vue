<script setup lang="ts">
import I18nLocaleSwitcherButton from "../i18n/I18nLocaleSwitcherButton.vue";
import { useColorMode } from "#imports";

const colorMode = useColorMode()
</script>

<template>
  <UDashboardNavbar>
    <template #leading>
      <UDashboardSidebarCollapse />
    </template>
    <template #right>
      <I18nLocaleSwitcherButton />
      <SharedColorThemeSelector v-if="!colorMode.forced"/>
    </template>
  </UDashboardNavbar>
</template>

<style scoped></style>
