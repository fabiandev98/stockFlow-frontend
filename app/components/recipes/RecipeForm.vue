<script setup lang="ts">
import { computed, reactive, ref, useAsyncData, useI18n, useMaterialModule, useRecipeModule, useToast } from "#imports";
import { FetchError } from "ofetch";
import type { Material } from "~/types/material";
import type { Product } from "~/types/product";
import type { Recipe, RecipePayload } from "~/types/recipe";

interface IngredientForm { key: number; material_id: number | null; net_quantity: number; }

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
const recipeUnitItems = computed(() => ["g", "kg", "ml", "l", "oz", "lb", "u", "box", "pack"].map((value) => ({
  value,
  label: t(`materials.units.${value}`),
})));

function row(source?: Partial<IngredientForm>): IngredientForm {
  return { key: nextKey.value++, material_id: source?.material_id ?? null, net_quantity: source?.net_quantity ?? 1 };
}

const state = reactive<{ yield_quantity: number; yield_unit: string; target_food_cost_percentage: number | null; instructions: string; ingredients: IngredientForm[] }>({
  yield_quantity: Number(props.recipe?.yield_quantity ?? 1),
  yield_unit: props.recipe?.yield_unit ?? "u",
  target_food_cost_percentage: props.recipe?.target_food_cost_percentage === null || props.recipe?.target_food_cost_percentage === undefined ? null : Number(props.recipe.target_food_cost_percentage),
  instructions: props.recipe?.instructions ?? "",
  ingredients: props.recipe?.ingredients.map((ingredient) => row({ material_id: ingredient.material_id, net_quantity: Number(ingredient.net_quantity) }))
    ?? props.product.compositions?.map((composition) => row({ material_id: composition.material_id, net_quantity: Number(composition.quantity_required) }))
    ?? [row()],
});

function addIngredient(): void { state.ingredients.push(row()); }
function removeIngredient(index: number): void { if (state.ingredients.length > 1) state.ingredients.splice(index, 1); }

function materialUnit(materialId: number | null): string | null {
  return materialItems.value.find((material) => material.id === materialId)?.unit ?? null;
}

function ingredientQuantityLabel(materialId: number | null): string {
  const unit = materialUnit(materialId);

  return unit ? `${t("recipes.net_quantity")} (${unit})` : t("recipes.net_quantity");
}

async function submit(): Promise<void> {
  if (saving.value || state.ingredients.some((item) => item.material_id === null)) return;
  saving.value = true;
  try {
    const payload: RecipePayload = {
      yield_quantity: state.yield_quantity,
      yield_unit: state.yield_unit,
      target_food_cost_percentage: state.target_food_cost_percentage,
      instructions: state.instructions || null,
      ingredients: state.ingredients.map(({ material_id, net_quantity }) => ({ material_id, net_quantity })),
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
      <UFormField :label="$t('recipes.recipe_yield')" required><UInput v-model.number="state.yield_quantity" type="number" min="1" step="1" /></UFormField>
      <UFormField :label="$t('recipes.yield_unit')" required><USelect v-model="state.yield_unit" :items="recipeUnitItems" value-key="value" class="w-full" /></UFormField>
      <UFormField :label="$t('recipes.target_food_cost')"><UInput v-model.number="state.target_food_cost_percentage" type="number" min="1" max="100" step="1" /></UFormField>
    </div>

    <div class="flex items-center justify-between gap-3"><h2 class="font-semibold">{{ $t("recipes.ingredients") }}</h2><UButton type="button" icon="i-lucide-plus" variant="soft" @click="addIngredient">{{ $t("recipes.add_ingredient") }}</UButton></div>
    <div v-for="(item, index) in state.ingredients" :key="item.key" class="grid items-end gap-3 rounded-lg border border-default bg-elevated/30 p-4 md:grid-cols-[minmax(13rem,2fr)_minmax(8rem,1fr)_auto]">
      <UFormField :label="$t('recipes.material')" required><USelect v-model="item.material_id" :items="materialItems" value-key="id" label-key="name" class="w-full" /></UFormField>
      <UFormField :label="ingredientQuantityLabel(item.material_id)" required><UInput v-model.number="item.net_quantity" type="number" min="0.001" step="0.001" /></UFormField>
      <UButton type="button" icon="i-lucide-trash-2" color="error" variant="ghost" :disabled="state.ingredients.length === 1" @click="removeIngredient(index)" />
    </div>
    <UFormField :label="$t('recipes.instructions')"><UTextarea v-model="state.instructions" :rows="4" class="w-full" /></UFormField>
    <div class="flex justify-end"><UButton type="submit" color="primary" icon="i-lucide-save" :loading="saving">{{ $t("recipes.activate_new_version") }}</UButton></div>
  </form>
</template>
