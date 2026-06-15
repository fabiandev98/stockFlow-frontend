import { SaleRepository } from "~/repositories/sale-repository";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import type { Sale, SalePayload } from "~/types/sale";
import { useQueryBuilder } from "#imports";

export function useSaleModule() {
  const saleRepo = new SaleRepository();
  const { buildQueryString } = useQueryBuilder();

  async function fetchSales(params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }): Promise<LaravelPaginationWrapper<Sale>> {
    const queryString = buildQueryString(params);
    return await saleRepo.index(queryString);
  }

  async function createSale(payload: SalePayload): Promise<Sale> {
    return await saleRepo.store(payload);
  }

  async function fetchSaleById(id: number): Promise<Sale> {
    return await saleRepo.findById(id);
  }

  return {
    fetchSales,
    createSale,
    fetchSaleById,
  };
}
