<script setup lang="ts">
import { definePageMeta, useI18n, useLocalePath, useRecipeModule } from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { Recipe } from "~/types/recipe";
import { formatPeso } from "~/utils/currency-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.PRODUCTS_READ] });
const { t } = useI18n();
const lp = useLocalePath();
const { fetchRecipes } = useRecipeModule();
const columns: TableColumn<Recipe>[] = [
  { accessorKey: "product.name", header: t("recipes.product"), enableSorting: false },
  { accessorKey: "version", header: t("recipes.version"), enableSorting: false },
  { id: "sale_price", accessorFn: (recipe) => recipe.product?.sale_price ?? 0, header: t("products.sale_price"), enableSorting: false },
  { accessorKey: "cost_per_unit", header: t("recipes.cost_per_unit"), enableSorting: false },
  { accessorKey: "food_cost_percentage", header: t("recipes.food_cost"), enableSorting: false },
  { accessorKey: "gross_margin_per_unit", header: t("recipes.gross_margin"), enableSorting: false },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];
</script>
<template>
  <div class="space-y-5"><div><h1 class="text-2xl font-semibold">{{ $t("recipes.title") }}</h1><p class="mt-1 text-sm text-muted">{{ $t("recipes.description") }}</p></div>
    <SharedLazyLoadedDatatable :columns="columns" :fetch-function="fetchRecipes" data-key="recipes" :empty-message="$t('recipes.empty')" global-filter-enabled>
      <template #sale_price-cell="{ row }">{{ formatPeso(row.original.product?.sale_price ?? 0) }}</template>
      <template #cost_per_unit-cell="{ row }">{{ formatPeso(row.original.cost_per_unit) }}</template>
      <template #food_cost_percentage-cell="{ row }"><UBadge :color="row.original.target_food_cost_percentage && row.original.food_cost_percentage > Number(row.original.target_food_cost_percentage) ? 'error' : 'success'">{{ Number(row.original.food_cost_percentage).toFixed(2) }}%</UBadge></template>
      <template #gross_margin_per_unit-cell="{ row }">{{ formatPeso(row.original.gross_margin_per_unit) }}</template>
      <template #action-cell="{ row }"><UButton icon="i-lucide-chef-hat" variant="soft" :to="lp('/recipes/edit-' + row.original.product_id)">{{ $t("common.edit") }}</UButton></template>
    </SharedLazyLoadedDatatable>
  </div>
</template>
