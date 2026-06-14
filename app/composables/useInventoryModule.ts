import { useQueryBuilder } from "#imports";
import { InventoryRepository } from "~/repositories/inventory-repository";
import type {
  InventoryMaterial,
  InventoryStockBatch,
} from "~/types/inventory";
import type { LaravelPaginationWrapper } from "~/types/pagination";

export function useInventoryModule() {
  const inventoryRepo = new InventoryRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchInventoryMaterials(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<InventoryMaterial>> {
    const queryString = buildQueryString(params);
    return await inventoryRepo.materialSummary(queryString);
  }

  async function fetchStockBatches(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<InventoryStockBatch>> {
    const queryString = buildQueryString(params);
    return await inventoryRepo.stockBatches(queryString);
  }

  return {
    fetchInventoryMaterials,
    fetchStockBatches,
  };
}
