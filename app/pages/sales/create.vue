<script setup lang="ts">
import { definePageMeta, navigateTo, useLocalePath } from "#imports";
import SaleForm from "~/components/sales/SaleForm.vue";
import { PERMISSION } from "~/constants/permissions";
import type { Sale } from "~/types/sale";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.SALES_CREATE],
});

const lp = useLocalePath();

async function handleSubmit(sale: Sale) {
  await navigateTo(lp("/sales/show-" + sale.id));
}
</script>

<template>
  <SaleForm @success="handleSubmit" />
</template>
