import type { Material, MaterialCategory } from "~/types/material";
import type { StockBatch } from "~/types/purchase";
import type { User } from "~/types/user";

export interface InventoryMaterial extends Material {
  category?: MaterialCategory | null;
  available_stock: string;
  is_low_stock: boolean;
  next_expiration_date: string | null;
}

export type InventoryStockBatch = StockBatch;

export interface InventoryAlerts {
  low_stock_materials: InventoryMaterial[];
  expired_batches: InventoryStockBatch[];
  expiring_batches: InventoryStockBatch[];
}

export type StockMovementType =
  | "manual_in"
  | "manual_out"
  | "adjustment_in"
  | "adjustment_out"
  | "waste"
  | "expired"
  | "sale";

export interface StockMovementPayload {
  stock_batch_id: number | null;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  movement_date: string | null;
}

export interface StockMovement {
  id: number;
  material_id: number;
  material?: Material;
  stock_batch_id: number;
  stock_batch?: StockBatch;
  sale_item_id: number | null;
  user_id: number | null;
  user?: User | null;
  type: StockMovementType;
  quantity: string;
  reason: string | null;
  movement_date: string;
  created_at: string;
  updated_at: string;
}
