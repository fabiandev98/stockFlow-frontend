<script setup lang="ts">
import { definePageMeta, navigateTo, useI18n, useLocalePath, useToast } from "#imports";
import type { User } from "~/types/user";
import UserForm from "~/components/user/UserForm.vue";

definePageMeta({
  middleware: ["guest-guard"],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();

async function handleSubmit(user: User) {
  toast.add({
    color: "success",
    title: t("common.crud.resource_created", { resource: user.name }),
    description: t("common.crud.resource_deleted_description", {
      resource: user.name,
    }),
  });
  await navigateTo(lp("/"));
}

</script>
<template>
  <UContainer class="flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg p-6">
      <h1 class="text-2xl font-semibold text-center mb-6">
        {{ $t("auth.register_title") }}
      </h1>
      <UserForm
        mode="register"
        :show-role-field="false"
        @submit-success="handleSubmit"
      />
    </div>
  </UContainer>
</template>
<style scoped></style>