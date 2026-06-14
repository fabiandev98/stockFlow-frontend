<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  useAsyncData,
  useI18n,
  useLocalePath,
  useRoute,
  useSupplierModule,
} from "#imports";
import SupplierForm from "~/components/suppliers/SupplierForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.SUPPLIERS_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchSupplierById } = useSupplierModule();

const { data, error } = await useAsyncData(() =>
  fetchSupplierById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

async function handleSubmit() {
  await navigateTo(lp("/suppliers"));
}
</script>

<template>
  <SupplierForm :supplier="data" @success="handleSubmit" />
</template>
