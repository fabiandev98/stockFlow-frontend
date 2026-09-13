import { Repository } from "./repository";
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

export class InventoryRepository extends Repository {
  materialSummary(queryString?: string) {
    const endpoint = queryString
      ? `/inventory/materials?${queryString}`
      : "/inventory/materials";

    return this.api<LaravelPaginationWrapper<InventoryMaterial>>(endpoint, {
      method: "GET",
    });
  }

  alerts(expirationWindowDays = 7) {
    return this.api<InventoryAlerts>(
      `/inventory/alerts?expiration_window_days=${expirationWindowDays}`,
      {
        method: "GET",
      }
    );
  }

  stockBatches(queryString?: string) {
    const endpoint = queryString
      ? `/stock-batches?${queryString}`
      : "/stock-batches";

    return this.api<LaravelPaginationWrapper<InventoryStockBatch>>(endpoint, {
      method: "GET",
    });
  }

  stockMovements(queryString?: string) {
    const endpoint = queryString
      ? `/stock-movements?${queryString}`
      : "/stock-movements";

    return this.api<LaravelPaginationWrapper<StockMovement>>(endpoint, {
      method: "GET",
    });
  }

  productBatches(queryString?: string) {
    const endpoint = queryString ? `/product-batches?${queryString}` : "/product-batches";

    return this.api<LaravelPaginationWrapper<ProductBatch>>(endpoint, { method: "GET" });
  }

  productStockMovements(queryString?: string) {
    const endpoint = queryString
      ? `/product-stock-movements?${queryString}`
      : "/product-stock-movements";

    return this.api<LaravelPaginationWrapper<ProductStockMovement>>(endpoint, {
      method: "GET",
    });
  }

  productWasteMovements(queryString?: string) {
    const endpoint = queryString
      ? `/product-stock-movements/waste?${queryString}`
      : "/product-stock-movements/waste";

    return this.api<LaravelPaginationWrapper<ProductStockMovement>>(endpoint, {
      method: "GET",
    });
  }

  storeStockMovement(payload: StockMovementPayload) {
    return this.api<StockMovement>("/stock-movements", {
      method: "POST",
      body: payload,
    });
  }

  storeMaterialProcessing(payload: MaterialProcessingPayload) {
    return this.api<MaterialProcessing>("/material-processings", {
      method: "POST",
      body: payload,
    });
  }

  storeProductStockMovement(payload: ProductStockMovementPayload) {
    return this.api<ProductStockMovement>("/product-stock-movements", {
      method: "POST",
      body: payload,
    });
  }
}
