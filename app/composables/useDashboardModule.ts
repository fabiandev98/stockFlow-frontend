import { DashboardRepository } from "~/repositories/dashboard-repository";
import type {
  DashboardSummary,
  DashboardSummaryParams,
} from "~/types/dashboard";

export function useDashboardModule() {
  const dashboardRepo = new DashboardRepository();

  async function fetchSummary(
    params: DashboardSummaryParams
  ): Promise<DashboardSummary> {
    return await dashboardRepo.summary(params);
  }

  return {
    fetchSummary,
  };
}
