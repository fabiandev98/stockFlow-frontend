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
  processing_type: "raw" | "processed" | "ready_to_use";
  unit: string;
  minimum_stock: number;
  is_perishable: boolean;
  default_expiration_days: number | null;
  processing_components?: ProcessedMaterialComponentPayload[];
}

export interface ProcessedMaterialComponentPayload {
  raw_material_id: number | null;
  quantity_per_unit: number;
}

export interface ProcessedMaterialComponent extends ProcessedMaterialComponentPayload {
  id: number;
  raw_material?: Material | null;
  unit: string;
  position: number;
}

export interface Material extends MaterialPayload {
  id: number;
  category?: MaterialCategory | null;
  processing_components?: ProcessedMaterialComponent[];
  created_at: string;
  updated_at: string;
}
