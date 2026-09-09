<script setup lang="ts">
import { computed, reactive, ref, useAsyncData, useI18n, useMaterialModule, useRecipeModule, useToast } from "#imports";
import { FetchError } from "ofetch";
import type { Material } from "~/types/material";
import type { Product } from "~/types/product";
import type { Recipe, RecipePayload } from "~/types/recipe";
import { formatQuantity } from "~/utils/quantity-format";

interface IngredientForm { key: number; material_id: number | null; net_quantity: number; expected_yield_percentage: number; }

const props = defineProps<{ product: Product; recipe?: Recipe | null }>();
const emit = defineEmits<{ success: [recipe: Recipe] }>();
const { t } = useI18n();
const toast = useToast();
const { fetchMaterials } = useMaterialModule();
const { saveRecipe } = useRecipeModule();
const saving = ref(false);
const nextKey = ref(1);
const { data: materials } = await useAsyncData("recipe-materials", () => fetchMaterials({}));
const materialItems = computed<Material[]>(() => materials.value?.data ?? []);

function row(source?: Partial<IngredientForm>): IngredientForm {
  return { key: nextKey.value++, material_id: source?.material_id ?? null, net_quantity: source?.net_quantity ?? 1, expected_yield_percentage: source?.expected_yield_percentage ?? 100 };
}

const state = reactive<{ yield_quantity: number; yield_unit: string; target_food_cost_percentage: number | null; instructions: string; ingredients: IngredientForm[] }>({
  yield_quantity: Number(props.recipe?.yield_quantity ?? 1),
  yield_unit: props.recipe?.yield_unit ?? "u",
  target_food_cost_percentage: props.recipe?.target_food_cost_percentage === null || props.recipe?.target_food_cost_percentage === undefined ? null : Number(props.recipe.target_food_cost_percentage),
  instructions: props.recipe?.instructions ?? "",
  ingredients: props.recipe?.ingredients.map((ingredient) => row({ material_id: ingredient.material_id, net_quantity: Number(ingredient.net_quantity), expected_yield_percentage: Number(ingredient.expected_yield_percentage) }))
    ?? props.product.compositions?.map((composition) => row({ material_id: composition.material_id, net_quantity: Number(composition.quantity_required), expected_yield_percentage: 100 }))
    ?? [row()],
});

function materialFor(item: IngredientForm): Material | undefined { return materialItems.value.find((material) => material.id === item.material_id); }
function consumption(item: IngredientForm): number { return item.expected_yield_percentage > 0 ? item.net_quantity / (item.expected_yield_percentage / 100) : 0; }
function addIngredient(): void { state.ingredients.push(row()); }
function removeIngredient(index: number): void { if (state.ingredients.length > 1) state.ingredients.splice(index, 1); }

async function submit(): Promise<void> {
  if (saving.value || state.ingredients.some((item) => item.material_id === null)) return;
  saving.value = true;
  try {
    const payload: RecipePayload = {
      yield_quantity: state.yield_quantity,
      yield_unit: state.yield_unit,
      target_food_cost_percentage: state.target_food_cost_percentage,
      instructions: state.instructions || null,
      ingredients: state.ingredients.map(({ material_id, net_quantity, expected_yield_percentage }) => ({ material_id, net_quantity, expected_yield_percentage })),
    };
    emit("success", await saveRecipe(props.product.id, payload));
    toast.add({ title: t("recipes.saved"), color: "success" });
  } catch (error: unknown) {
    toast.add({ title: t("common.generic_error_title"), description: error instanceof FetchError ? t("common.generic_error", { context: `${error.statusCode} - ${error.data?.message ?? error.message}` }) : t("common.generic_unknown_error"), color: "error" });
  } finally { saving.value = false; }
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="submit">
    <div class="grid gap-4 md:grid-cols-3">
      <UFormField :label="$t('recipes.recipe_yield')" required><UInput v-model.number="state.yield_quantity" type="number" min="0.01" step="0.01" /></UFormField>
      <UFormField :label="$t('recipes.yield_unit')" required><UInput v-model="state.yield_unit" maxlength="50" /></UFormField>
      <UFormField :label="$t('recipes.target_food_cost')"><UInput v-model.number="state.target_food_cost_percentage" type="number" min="0.01" max="100" step="0.01" /></UFormField>
    </div>

    <div class="flex items-center justify-between gap-3"><h2 class="font-semibold">{{ $t("recipes.ingredients") }}</h2><UButton type="button" icon="i-lucide-plus" variant="soft" @click="addIngredient">{{ $t("recipes.add_ingredient") }}</UButton></div>
    <div v-for="(item, index) in state.ingredients" :key="item.key" class="grid items-end gap-3 rounded-lg border border-default bg-elevated/30 p-4 md:grid-cols-[minmax(13rem,2fr)_minmax(7rem,.8fr)_minmax(8rem,.9fr)_minmax(8rem,.9fr)_auto]">
      <UFormField :label="$t('recipes.material')" required><USelect v-model="item.material_id" :items="materialItems" value-key="id" label-key="name" class="w-full" /></UFormField>
      <UFormField :label="$t('recipes.net_quantity')" required><UInput v-model.number="item.net_quantity" type="number" min="0.0001" step="0.0001" /></UFormField>
      <UFormField :label="$t('recipes.expected_yield')" required><UInput v-model.number="item.expected_yield_percentage" type="number" min="0.01" max="100" step="0.01" /></UFormField>
      <div><p class="text-sm text-muted">{{ $t("recipes.inventory_consumption") }}</p><p class="mt-2 font-medium">{{ formatQuantity(consumption(item), materialFor(item)?.unit) }}</p></div>
      <UButton type="button" icon="i-lucide-trash-2" color="error" variant="ghost" :disabled="state.ingredients.length === 1" @click="removeIngredient(index)" />
    </div>
    <UFormField :label="$t('recipes.instructions')"><UTextarea v-model="state.instructions" :rows="4" class="w-full" /></UFormField>
    <div class="flex justify-end"><UButton type="submit" color="primary" icon="i-lucide-save" :loading="saving">{{ $t("recipes.activate_new_version") }}</UButton></div>
  </form>
</template>
