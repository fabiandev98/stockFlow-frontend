import type { Material } from "./material";
import type { StockBatch } from "./purchase";

export interface ProductCategoryPayload {
  name: string;
}

export interface ProductCategory extends ProductCategoryPayload {
  id: number;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCompositionPayload {
  material_id: number | null;
  quantity_required: number;
  unit: string;
}

export interface ProductComposition extends ProductCompositionPayload {
  id: number;
  product_id: number;
  material?: Material | null;
  created_at: string;
  updated_at: string;
}

export interface ProductPayload {
  product_category_id: number | null;
  name: string;
  sale_price: number;
  is_composed: boolean;
  production_mode: "on_sale" | "batch";
  shelf_life_days: number | null;
  is_active: boolean;
  compositions: ProductCompositionPayload[];
}

export interface Product extends ProductPayload {
  id: number;
  category?: ProductCategory | null;
  available_to_sell?: string;
  compositions_count?: number;
  compositions?: ProductComposition[];
  created_at: string;
  updated_at: string;
}

export interface ProductProductionUsagePayload {
  stock_batch_id: number | null;
  quantity: number;
}

export interface ProductProductionPayload {
  planned_quantity: number | null;
  produced_quantity: number;
  production_date: string;
  expiration_date: string | null;
  expiration_override_reason: string | null;
  notes: string | null;
  usages: ProductProductionUsagePayload[];
}

export interface ProductProduction {
  id: number;
  product_id: number;
  planned_quantity: string | null;
  produced_quantity: string;
  production_date: string;
  suggested_expiration_date: string | null;
  expiration_date: string | null;
  expiration_override_reason: string | null;
  notes: string | null;
  usages?: Array<ProductProductionUsagePayload & { material?: Material; stock_batch?: StockBatch; unit_cost: string }>;
}
