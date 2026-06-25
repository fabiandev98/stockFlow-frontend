import { computed, ref } from "vue";
import type { DashboardSummaryParams } from "~/types/dashboard";

export type DashboardPeriodPreset =
  | "today"
  | "last_7_days"
  | "month"
  | "last_30_days"
  | "custom";

export function useDashboardPeriod(includeExpirationWindow = false) {
  const selectedPeriod = ref<DashboardPeriodPreset>("month");
  const customStartDate = ref(formatDateInput(startOfMonth(new Date())));
  const customEndDate = ref(formatDateInput(new Date()));
  const expirationWindowDays = ref(7);

  const params = computed<DashboardSummaryParams>(() => {
    const today = new Date();
    let range: Pick<DashboardSummaryParams, "start_date" | "end_date">;

    if (selectedPeriod.value === "custom") {
      range = {
        start_date: customStartDate.value,
        end_date: customEndDate.value,
      };
    } else if (selectedPeriod.value === "today") {
      const date = formatDateInput(today);
      range = { start_date: date, end_date: date };
    } else if (selectedPeriod.value === "last_7_days") {
      range = {
        start_date: formatDateInput(addDays(today, -6)),
        end_date: formatDateInput(today),
      };
    } else if (selectedPeriod.value === "last_30_days") {
      range = {
        start_date: formatDateInput(addDays(today, -29)),
        end_date: formatDateInput(today),
      };
    } else {
      range = {
        start_date: formatDateInput(startOfMonth(today)),
        end_date: formatDateInput(today),
      };
    }

    return includeExpirationWindow
      ? { ...range, expiration_window_days: expirationWindowDays.value }
      : range;
  });

  return {
    selectedPeriod,
    customStartDate,
    customEndDate,
    expirationWindowDays,
    params,
  };
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
