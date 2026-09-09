import { Repository } from "./repository";
import type { Recipe, RecipePayload } from "~/types/recipe";
import type { LaravelPaginationWrapper } from "~/types/pagination";

export class RecipeRepository extends Repository {
  index(queryString?: string) {
    return this.api<LaravelPaginationWrapper<Recipe>>(queryString ? `/recipes?${queryString}` : "/recipes", { method: "GET" });
  }

  findByProductId(productId: number) {
    return this.api<Recipe>(`/products/${productId}/recipe`, { method: "GET" });
  }

  store(productId: number, payload: RecipePayload) {
    return this.api<Recipe>(`/products/${productId}/recipe`, { method: "POST", body: payload });
  }
}
