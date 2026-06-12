import { MaterialCategoryRepository } from "~/repositories/material-category-repository";
import type {
  MaterialCategory,
  MaterialCategoryPayload,
} from "~/types/material";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function useMaterialCategoryModule() {
  const materialCategoryRepo = new MaterialCategoryRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchMaterialCategories(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  } = {}): Promise<LaravelPaginationWrapper<MaterialCategory>> {
    const queryString = buildQueryString(params);
    return await materialCategoryRepo.index(queryString);
  }

  async function createMaterialCategory(
    payload: MaterialCategoryPayload
  ): Promise<MaterialCategory> {
    return await materialCategoryRepo.store(payload);
  }

  async function updateMaterialCategory(
    id: number,
    payload: MaterialCategoryPayload
  ): Promise<MaterialCategory> {
    return await materialCategoryRepo.updateById(id, payload);
  }

  async function deleteMaterialCategory(id: number): Promise<null> {
    return await materialCategoryRepo.deleteById(id);
  }

  async function fetchMaterialCategoryById(
    id: number
  ): Promise<MaterialCategory> {
    return await materialCategoryRepo.findById(id);
  }

  return {
    fetchMaterialCategories,
    createMaterialCategory,
    updateMaterialCategory,
    deleteMaterialCategory,
    fetchMaterialCategoryById,
  };
}
