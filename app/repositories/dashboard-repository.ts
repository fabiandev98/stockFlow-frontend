import { Repository } from "./repository";
import type {
  DashboardSummary,
  DashboardSummaryParams,
} from "~/types/dashboard";

export class DashboardRepository extends Repository {
  summary(params: DashboardSummaryParams) {
    const query = new URLSearchParams();

    if (params.start_date) query.set("start_date", params.start_date);
    if (params.end_date) query.set("end_date", params.end_date);
    if (params.expiration_window_days) {
      query.set("expiration_window_days", String(params.expiration_window_days));
    }

    const queryString = query.toString();
    const endpoint = queryString
      ? `/dashboard/summary?${queryString}`
      : "/dashboard/summary";

    return this.api<DashboardSummary>(endpoint, {
      method: "GET",
    });
  }
}
