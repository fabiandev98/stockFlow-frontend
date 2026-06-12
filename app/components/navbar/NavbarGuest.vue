<script setup lang="ts">
import NavbarBase from "./NavbarBase.vue";
import I18nLocaleSwitcherButton from "../i18n/I18nLocaleSwitcherButton.vue";
</script>

<template>
  <NavbarBase>
    <template #right>
      <I18nLocaleSwitcherButton />
    </template>
  </NavbarBase>
</template>

<style scoped></style>
