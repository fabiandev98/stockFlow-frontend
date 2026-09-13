import { useQueryBuilder } from "#imports";
import { InventoryRepository } from "~/repositories/inventory-repository";
import type {
  InventoryAlerts,
  InventoryMaterial,
  MaterialProcessing,
  MaterialProcessingPayload,
  InventoryStockBatch,
  ProductStockMovement,
  ProductStockMovementPayload,
  StockMovement,
  StockMovementPayload,
} from "~/types/inventory";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import type { ProductBatch } from "~/types/purchase";

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

  async function fetchInventoryAlerts(
    expirationWindowDays = 7
  ): Promise<InventoryAlerts> {
    return await inventoryRepo.alerts(expirationWindowDays);
  }

  async function fetchStockBatches(params: {
    page?: number;
    perPage?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<InventoryStockBatch>> {
    const queryString = buildQueryString(params);
    const perPage = params.perPage ? `per_page=${params.perPage}` : "";
    return await inventoryRepo.stockBatches([queryString, perPage].filter(Boolean).join("&"));
  }

  async function fetchStockMovements(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<StockMovement>> {
    const queryString = buildQueryString(params);
    return await inventoryRepo.stockMovements(queryString);
  }

  async function fetchProductBatches(params: {
    page?: number;
    perPage?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<ProductBatch>> {
    const queryString = buildQueryString(params);
    const perPage = params.perPage ? `per_page=${params.perPage}` : "";
    return await inventoryRepo.productBatches([queryString, perPage].filter(Boolean).join("&"));
  }

  async function fetchProductStockMovements(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<ProductStockMovement>> {
    return await inventoryRepo.productStockMovements(buildQueryString(params));
  }

  async function fetchProductWasteMovements(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<ProductStockMovement>> {
    return await inventoryRepo.productWasteMovements(buildQueryString(params));
  }

  async function createStockMovement(
    payload: StockMovementPayload
  ): Promise<StockMovement> {
    return await inventoryRepo.storeStockMovement(payload);
  }

  async function createMaterialProcessing(
    payload: MaterialProcessingPayload
  ): Promise<MaterialProcessing> {
    return await inventoryRepo.storeMaterialProcessing(payload);
  }

  async function createProductStockMovement(
    payload: ProductStockMovementPayload
  ): Promise<ProductStockMovement> {
    return await inventoryRepo.storeProductStockMovement(payload);
  }

  return {
    fetchInventoryMaterials,
    fetchInventoryAlerts,
    fetchStockBatches,
    fetchStockMovements,
    fetchProductBatches,
    fetchProductStockMovements,
    fetchProductWasteMovements,
    createStockMovement,
    createMaterialProcessing,
    createProductStockMovement,
  };
}
