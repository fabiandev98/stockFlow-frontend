import { RecipeRepository } from "~/repositories/recipe-repository";
import type { Recipe, RecipePayload } from "~/types/recipe";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function useRecipeModule() {
  const recipeRepo = new RecipeRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchRecipes(params: { page?: number; filters?: Record<string, string | number | boolean>; sort?: string }): Promise<LaravelPaginationWrapper<Recipe>> {
    return await recipeRepo.index(buildQueryString(params));
  }

  async function fetchRecipeByProductId(productId: number): Promise<Recipe> {
    return await recipeRepo.findByProductId(productId);
  }

  async function saveRecipe(productId: number, payload: RecipePayload): Promise<Recipe> {
    return await recipeRepo.store(productId, payload);
  }

  return { fetchRecipes, fetchRecipeByProductId, saveRecipe };
}
