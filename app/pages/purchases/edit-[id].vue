<script setup lang="ts">
import {
  createError,
  definePageMeta,
  navigateTo,
  useAsyncData,
  useI18n,
  useLocalePath,
  usePurchaseModule,
  useRoute,
} from "#imports";
import PurchaseForm from "~/components/purchases/PurchaseForm.vue";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PURCHASES_UPDATE],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchPurchaseById } = usePurchaseModule();

const { data, error } = await useAsyncData(() =>
  fetchPurchaseById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

async function handleSubmit() {
  await navigateTo(lp("/purchases"));
}
</script>

<template>
  <PurchaseForm :purchase="data" @success="handleSubmit" />
</template>
