<script setup lang="ts">
import { computed, ref } from "vue";
import type { DashboardDailyMetric } from "~/types/dashboard";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

const props = withDefaults(
  defineProps<{
    data: DashboardDailyMetric[];
    color?: "primary" | "warning";
  }>(),
  {
    color: "primary",
  }
);

const maxValue = computed(() =>
  Math.max(...props.data.map((item) => Number(item.total)), 1)
);

const chartWidth = computed(() => ({
  minWidth: `${Math.max(props.data.length * 48, 560)}px`,
}));

const barClass = computed(() =>
  props.color === "warning" ? "bg-warning" : "bg-primary"
);

const axisValues = computed(() => [
  maxValue.value,
  maxValue.value * 0.75,
  maxValue.value * 0.5,
  maxValue.value * 0.25,
  0,
]);

const activeItem = ref<DashboardDailyMetric | null>(null);

function barHeight(total: string): string {
  const value = Number(total);
  return `${value > 0 ? Math.max(2, (value / maxValue.value) * 100) : 0}%`;
}

function compactDate(value: string): string {
  const [datePart] = value.split("T");
  const [, month, day] = datePart?.split("-") ?? [];

  return day && month ? `${day}/${month}` : value;
}
</script>

<template>
  <div class="flex min-w-0">
    <div
      class="mb-8 flex h-64 w-20 shrink-0 flex-col justify-between pr-3 text-right text-xs text-muted"
    >
      <span
        v-for="value in axisValues"
        :key="value"
      >
        {{ formatPeso(value) }}
      </span>
    </div>

    <div class="relative min-w-0 flex-1">
      <div class="overflow-x-auto pb-2">
        <div :style="chartWidth">
          <div class="relative h-64 border-b border-default">
            <div
              v-for="line in 5"
              :key="line"
              class="absolute inset-x-0 border-t border-dashed border-default"
              :style="{ top: `${(line - 1) * 25}%` }"
            />

            <div
              class="absolute inset-0 grid items-end gap-2 px-2"
              :style="{
                gridTemplateColumns: `repeat(${data.length}, minmax(2rem, 1fr))`,
              }"
            >
              <div
                v-for="item in data"
                :key="item.date"
                class="relative flex h-full min-w-0 items-end justify-center"
                :style="{ '--bar-height': barHeight(item.total) }"
                @mouseenter="activeItem = item"
                @mouseleave="activeItem = null"
              >
                <div
                  class="w-full max-w-8 transition-opacity hover:opacity-80 focus:opacity-80"
                  :class="barClass"
                  style="height: var(--bar-height)"
                  tabindex="0"
                  :aria-label="
                    `${formatDisplayDate(item.date)}: ${formatPeso(item.total)}`
                  "
                  @focus="activeItem = item"
                  @blur="activeItem = null"
                />
              </div>
            </div>
          </div>

          <div
            class="grid gap-2 px-2 pt-2"
            :style="{
              gridTemplateColumns: `repeat(${data.length}, minmax(2rem, 1fr))`,
            }"
          >
            <span
              v-for="item in data"
              :key="item.date"
              class="truncate text-center text-xs text-muted"
              :title="formatDisplayDate(item.date)"
            >
              {{ compactDate(item.date) }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="activeItem"
        class="pointer-events-none absolute left-3 top-3 z-20 w-48 max-w-[calc(100%-1.5rem)] border border-default bg-default p-3 text-left shadow-lg"
      >
        <p class="text-xs font-semibold text-highlighted">
          {{ formatDisplayDate(activeItem.date) }}
        </p>
        <dl class="mt-2 space-y-1 text-xs text-muted">
          <div class="flex justify-between gap-3">
            <dt>{{ $t("dashboard.table.total") }}</dt>
            <dd class="font-medium text-highlighted">
              {{ formatPeso(activeItem.total) }}
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt>{{ $t("dashboard.table.operations") }}</dt>
            <dd class="font-medium text-highlighted">{{ activeItem.count }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt>{{ $t("dashboard.table.items") }}</dt>
            <dd class="font-medium text-highlighted">
              {{ Number(activeItem.items).toFixed(2) }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
