import { ProductRepository } from "~/repositories/product-repository";
import type { Product, ProductPayload } from "~/types/product";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { useQueryBuilder } from "#imports";

export function useProductModule() {
  const productRepo = new ProductRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchProducts(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<Product>> {
    const queryString = buildQueryString(params);
    return await productRepo.index(queryString);
  }

  async function createProduct(payload: ProductPayload): Promise<Product> {
    return await productRepo.store(payload);
  }

  async function updateProduct(
    id: number,
    payload: ProductPayload
  ): Promise<Product> {
    return await productRepo.updateById(id, payload);
  }

  async function deleteProduct(id: number): Promise<null> {
    return await productRepo.deleteById(id);
  }

  async function fetchProductById(id: number): Promise<Product> {
    return await productRepo.findById(id);
  }

  return {
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProductById,
  };
}
