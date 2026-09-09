import { DashboardRepository } from "~/repositories/dashboard-repository";
import type {
  DashboardExecutiveSummary,
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

  async function fetchExecutiveSummary(params: DashboardSummaryParams): Promise<DashboardExecutiveSummary> {
    return await dashboardRepo.executiveSummary(params);
  }

  return {
    fetchSummary,
    fetchExecutiveSummary,
  };
}
