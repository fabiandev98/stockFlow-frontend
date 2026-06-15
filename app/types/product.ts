import type { Material } from "./material";

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
  is_active: boolean;
  compositions: ProductCompositionPayload[];
}

export interface Product extends ProductPayload {
  id: number;
  category?: ProductCategory | null;
  compositions_count?: number;
  compositions?: ProductComposition[];
  created_at: string;
  updated_at: string;
}
