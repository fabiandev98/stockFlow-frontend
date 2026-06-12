<script setup lang="ts">
import NavbarGuest from "~/components/navbar/NavbarGuest.vue";
</script>

<template>
  <main>
    <NavbarGuest />
    <UMain as="section">
      <slot />
    </UMain>
  </main>
</template>

<style scoped></style>
