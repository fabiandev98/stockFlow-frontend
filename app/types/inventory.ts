import type { Material, MaterialCategory } from "~/types/material";
import type { StockBatch } from "~/types/purchase";

export interface InventoryMaterial extends Material {
  category?: MaterialCategory | null;
  available_stock: string;
  is_low_stock: boolean;
  next_expiration_date: string | null;
}

export type InventoryStockBatch = StockBatch;
