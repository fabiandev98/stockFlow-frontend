<script setup lang="ts">
import { useAuthenticatedMenu } from "#imports";
import NavbarAuthenticated from "~/components/navbar/NavbarAuthenticated.vue";
import NavbarMainLogo from "~/components/navbar/NavbarMainLogo.vue";
import UserMenu from "~/components/user/UserAuthMenu.vue";

const { processed } = useAuthenticatedMenu();
</script>

<template>
  <main>
    <UMain as="section">
      <UDashboardGroup>
        <UDashboardSidebar id="default" collapsible>
          <template #header>
            <NavbarMainLogo />
          </template>
          <template #default="{ collapsed }">
            <UNavigationMenu
              :collapsed="collapsed"
              :items="processed"
              orientation="vertical"
              tooltip
              popover
              color="brand"
            />
          </template>
          <template #footer>
            <UserMenu />
          </template>
        </UDashboardSidebar>
        <UDashboardPanel id="content">
          <template #header>
            <NavbarAuthenticated />
          </template>
          <template #body>
            <slot />
          </template>
        </UDashboardPanel>
      </UDashboardGroup>
    </UMain>
  </main>
</template>

<style scoped></style>
