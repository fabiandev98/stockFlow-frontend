<script setup lang="ts">
import { navigateTo, ref, useAuth, useLocalePath } from "#imports";

const { logout } = useAuth();
const lp = useLocalePath();
const isLoading = ref<boolean>(false);

async function signOut(): Promise<void> {
  if (isLoading.value) return;
  isLoading.value = true;

  await logout();
  await navigateTo(lp("/"));

  isLoading.value = false;
}
</script>

<template>
  <UButton
    :loading="isLoading"
    icon="i-lucide-log-out"
    color="neutral"
    variant="ghost"
    class="size-5 shrink-0"
    @click="signOut"
  />
</template>

<style scoped></style>
