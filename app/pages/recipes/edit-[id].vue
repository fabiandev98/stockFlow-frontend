<script setup lang="ts">
import { computed, definePageMeta, useAsyncData, useLocalePath, useProductModule, useRecipeModule, useRoute } from "#imports";
import { FetchError } from "ofetch";
import RecipeForm from "~/components/recipes/RecipeForm.vue";
import { PERMISSION } from "~/constants/permissions";
import type { Recipe } from "~/types/recipe";
import { formatPeso } from "~/utils/currency-format";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.PRODUCTS_UPDATE] });
const route = useRoute();
const productId = computed(() => Number(route.params.id));
const lp = useLocalePath();
const { fetchProductById } = useProductModule();
const { fetchRecipeByProductId } = useRecipeModule();
const { data, refresh } = await useAsyncData(`recipe-${productId.value}`, async () => {
  const product = await fetchProductById(productId.value);
  let recipe: Recipe | null = null;
  try { recipe = await fetchRecipeByProductId(productId.value); } catch (error: unknown) { if (!(error instanceof FetchError && error.statusCode === 404)) throw error; }
  return { product, recipe };
});
async function saved(): Promise<void> { await refresh(); }
</script>
<template>
  <div v-if="data" class="space-y-6"><div class="flex flex-wrap items-start justify-between gap-3"><div><h1 class="text-2xl font-semibold">{{ $t("recipes.recipe_for", { product: data.product.name }) }}</h1><p class="mt-1 text-sm text-muted">{{ $t("recipes.form_help") }}</p></div><UButton icon="i-lucide-arrow-left" variant="ghost" :to="lp('/recipes')">{{ $t("recipes.back_to_recipes") }}</UButton></div>
    <section v-if="data.recipe" class="grid gap-4 md:grid-cols-4"><DashboardMetricCard :label="$t('recipes.cost_per_unit')" :value="formatPeso(data.recipe.cost_per_unit)" icon="i-lucide-badge-dollar-sign" /><DashboardMetricCard :label="$t('recipes.food_cost')" :value="`${Number(data.recipe.food_cost_percentage).toFixed(2)}%`" icon="i-lucide-chart-pie" /><DashboardMetricCard :label="$t('recipes.gross_margin')" :value="formatPeso(data.recipe.gross_margin_per_unit)" icon="i-lucide-chart-line" /><DashboardMetricCard :label="$t('recipes.version')" :value="String(data.recipe.version)" icon="i-lucide-history" /></section>
    <UCard><template #header><h2 class="font-semibold">{{ data.recipe ? $t("recipes.active_recipe") : $t("recipes.create_recipe") }}</h2></template><RecipeForm :product="data.product" :recipe="data.recipe" @success="saved" /></UCard>
  </div>
</template>
