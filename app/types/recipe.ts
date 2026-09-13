import type { Material } from "./material";
import type { Product } from "./product";
import type { User } from "./user";

export interface RecipeIngredientPayload {
  material_id: number | null;
  net_quantity: number;
}

export interface RecipePayload {
  yield_quantity: number;
  yield_unit: string;
  target_food_cost_percentage: number | null;
  instructions: string | null;
  ingredients: RecipeIngredientPayload[];
}

export interface RecipeIngredient extends RecipeIngredientPayload {
  id: number;
  material?: Material | null;
  unit: string;
  position: number;
}

export interface Recipe extends RecipePayload {
  id: number;
  product_id: number;
  product?: Product | null;
  version: number;
  status: "active" | "archived";
  activated_at: string | null;
  activated_by?: User | null;
  ingredients: RecipeIngredient[];
  theoretical_cost: number;
  cost_per_unit: number;
  food_cost_percentage: number;
  gross_margin_per_unit: number;
  suggested_sale_price: number | null;
  created_at: string;
  updated_at: string;
}
