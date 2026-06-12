import { Repository } from "./repository";
import type { Material, MaterialPayload } from "~/types/material";
import type { LaravelPaginationWrapper } from "~/types/pagination";

const BASE_ENDPOINT_URL = "/materials";

export class MaterialRepository extends Repository {
  index(queryString?: string) {
    const endpoint = queryString
      ? `${BASE_ENDPOINT_URL}?${queryString}`
      : BASE_ENDPOINT_URL;
    return this.api<LaravelPaginationWrapper<Material>>(endpoint, {
      method: "GET",
    });
  }

  store(payload: MaterialPayload) {
    return this.api<Material>(BASE_ENDPOINT_URL, {
      method: "POST",
      body: payload,
    });
  }

  updateById(id: number, payload: MaterialPayload) {
    return this.api<Material>(`${BASE_ENDPOINT_URL}/${id}`, {
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
    return this.api<Material>(`${BASE_ENDPOINT_URL}/${id}`, {
      method: "GET",
    });
  }
}
