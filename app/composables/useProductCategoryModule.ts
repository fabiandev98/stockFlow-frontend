import { ProductCategoryRepository } from "~/repositories/product-category-repository";
import type {
  ProductCategory,
  ProductCategoryPayload,
} from "~/types/product";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function useProductCategoryModule() {
  const productCategoryRepo = new ProductCategoryRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchProductCategories(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<ProductCategory>> {
    const queryString = buildQueryString(params);
    return await productCategoryRepo.index(queryString);
  }

  async function createProductCategory(
    payload: ProductCategoryPayload
  ): Promise<ProductCategory> {
    return await productCategoryRepo.store(payload);
  }

  async function updateProductCategory(
    id: number,
    payload: ProductCategoryPayload
  ): Promise<ProductCategory> {
    return await productCategoryRepo.updateById(id, payload);
  }

  async function deleteProductCategory(id: number): Promise<null> {
    return await productCategoryRepo.deleteById(id);
  }

  async function fetchProductCategoryById(
    id: number
  ): Promise<ProductCategory> {
    return await productCategoryRepo.findById(id);
  }

  return {
    fetchProductCategories,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,
    fetchProductCategoryById,
  };
}
