import { SupplierRepository } from "~/repositories/supplier-repository";
import type { Supplier, SupplierNote, SupplierNotePayload, SupplierPayload, SupplierQualityMetrics } from "~/types/supplier";
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

  async function fetchSupplierQuality(id: number): Promise<SupplierQualityMetrics> {
    return await supplierRepo.quality(id);
  }

  async function fetchSupplierNotes(id: number): Promise<SupplierNote[]> {
    return await supplierRepo.notes(id);
  }

  async function createSupplierNote(id: number, payload: SupplierNotePayload): Promise<SupplierNote> {
    return await supplierRepo.storeNote(id, payload);
  }

  async function deleteSupplierNote(supplierId: number, noteId: number): Promise<null> {
    return await supplierRepo.deleteNote(supplierId, noteId);
  }

  return {
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    fetchSupplierById,
    fetchSupplierQuality,
    fetchSupplierNotes,
    createSupplierNote,
    deleteSupplierNote,
  };
}
