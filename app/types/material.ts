export interface MaterialCategoryPayload {
  name: string;
}

export interface MaterialCategory extends MaterialCategoryPayload {
  id: number;
  materials_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialPayload {
  material_category_id: number | null;
  name: string;
  unit: string;
  minimum_stock: number;
  is_perishable: boolean;
  default_expiration_days: number | null;
}

export interface Material extends MaterialPayload {
  id: number;
  category?: MaterialCategory | null;
  created_at: string;
  updated_at: string;
}
