import { PurchaseRepository } from "~/repositories/purchase-repository";
import type { Purchase, PurchasePayload } from "~/types/purchase";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function usePurchaseModule() {
  const purchaseRepo = new PurchaseRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchPurchases(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<Purchase>> {
    const queryString = buildQueryString(params);
    return await purchaseRepo.index(queryString);
  }

  async function createPurchase(payload: PurchasePayload): Promise<Purchase> {
    return await purchaseRepo.store(payload);
  }

  async function updatePurchase(
    id: number,
    payload: PurchasePayload
  ): Promise<Purchase> {
    return await purchaseRepo.updateById(id, payload);
  }

  async function deletePurchase(id: number): Promise<null> {
    return await purchaseRepo.deleteById(id);
  }

  async function fetchPurchaseById(id: number): Promise<Purchase> {
    return await purchaseRepo.findById(id);
  }

  return {
    fetchPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase,
    fetchPurchaseById,
  };
}
