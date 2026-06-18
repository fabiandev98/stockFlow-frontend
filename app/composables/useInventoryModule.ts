import { useQueryBuilder } from "#imports";
import { InventoryRepository } from "~/repositories/inventory-repository";
import type {
  InventoryAlerts,
  InventoryMaterial,
  InventoryProduct,
  InventoryStockBatch,
  StockMovement,
  StockMovementPayload,
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

  async function fetchInventoryProducts(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<InventoryProduct>> {
    const queryString = buildQueryString(params);
    return await inventoryRepo.productSummary(queryString);
  }

  async function fetchInventoryAlerts(
    expirationWindowDays = 7
  ): Promise<InventoryAlerts> {
    return await inventoryRepo.alerts(expirationWindowDays);
  }

  async function fetchStockBatches(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<InventoryStockBatch>> {
    const queryString = buildQueryString(params);
    return await inventoryRepo.stockBatches(queryString);
  }

  async function fetchStockMovements(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<StockMovement>> {
    const queryString = buildQueryString(params);
    return await inventoryRepo.stockMovements(queryString);
  }

  async function createStockMovement(
    payload: StockMovementPayload
  ): Promise<StockMovement> {
    return await inventoryRepo.storeStockMovement(payload);
  }

  return {
    fetchInventoryMaterials,
    fetchInventoryProducts,
    fetchInventoryAlerts,
    fetchStockBatches,
    fetchStockMovements,
    createStockMovement,
  };
}
