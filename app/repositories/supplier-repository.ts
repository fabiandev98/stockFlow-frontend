import { Repository } from "./repository";
import type { Supplier, SupplierNote, SupplierNotePayload, SupplierPayload, SupplierQualityMetrics } from "~/types/supplier";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/suppliers";

export class SupplierRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<Supplier>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: SupplierPayload) {
    return this.api<Supplier>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  updateById(id: number, payload: SupplierPayload) {
    return this.api<Supplier>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "PATCH",
      body: payload,
    });
  }

  deleteById(id: number) {
    return this.api<null>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "DELETE",
    });
  }

  findById(id: number) {
    return this.api<Supplier>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }

  quality(id: number) {
    return this.api<SupplierQualityMetrics>(`${BASE_ENDPOINT_URL}/${id}/quality`, { method: "GET" });
  }

  notes(id: number) {
    return this.api<SupplierNote[]>(`${BASE_ENDPOINT_URL}/${id}/notes`, { method: "GET" });
  }

  storeNote(id: number, payload: SupplierNotePayload) {
    return this.api<SupplierNote>(`${BASE_ENDPOINT_URL}/${id}/notes`, { method: "POST", body: payload });
  }

  deleteNote(supplierId: number, noteId: number) {
    return this.api<null>(`${BASE_ENDPOINT_URL}/${supplierId}/notes/${noteId}`, { method: "DELETE" });
  }
}
