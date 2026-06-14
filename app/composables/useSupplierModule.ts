import { SupplierRepository } from "~/repositories/supplier-repository";
import type { Supplier, SupplierPayload } from "~/types/supplier";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function useSupplierModule() {
  const supplierRepo = new SupplierRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchSuppliers(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<Supplier>> {
    const queryString = buildQueryString(params);
    return await supplierRepo.index(queryString);
  }

  async function createSupplier(payload: SupplierPayload): Promise<Supplier> {
    return await supplierRepo.store(payload);
  }

  async function updateSupplier(
    id: number,
    payload: SupplierPayload
  ): Promise<Supplier> {
    return await supplierRepo.updateById(id, payload);
  }

  async function deleteSupplier(id: number): Promise<null> {
    return await supplierRepo.deleteById(id);
  }

  async function fetchSupplierById(id: number): Promise<Supplier> {
    return await supplierRepo.findById(id);
  }

  return {
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    fetchSupplierById,
  };
}
