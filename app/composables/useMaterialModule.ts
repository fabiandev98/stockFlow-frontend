import { MaterialRepository } from "~/repositories/material-repository";
import type { Material, MaterialPayload } from "~/types/material";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function useMaterialModule() {
  const materialRepo = new MaterialRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchMaterials(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<Material>> {
    const queryString = buildQueryString(params);
    return await materialRepo.index(queryString);
  }

  async function createMaterial(payload: MaterialPayload): Promise<Material> {
    return await materialRepo.store(payload);
  }

  async function updateMaterial(
    id: number,
    payload: MaterialPayload
  ): Promise<Material> {
    return await materialRepo.updateById(id, payload);
  }

  async function deleteMaterial(id: number): Promise<null> {
    return await materialRepo.deleteById(id);
  }

  async function fetchMaterialById(id: number): Promise<Material> {
    return await materialRepo.findById(id);
  }

  return {
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    fetchMaterialById,
  };
}
