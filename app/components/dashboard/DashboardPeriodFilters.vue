<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "#imports";
import type { DashboardPeriodPreset } from "~/composables/useDashboardPeriod";

const props = withDefaults(
  defineProps<{
    period: DashboardPeriodPreset;
    startDate: string;
    endDate: string;
    expirationWindowDays?: number;
    showExpirationWindow?: boolean;
  }>(),
  {
    expirationWindowDays: 7,
    showExpirationWindow: false,
  }
);

const emit = defineEmits<{
  "update:period": [value: DashboardPeriodPreset];
  "update:startDate": [value: string];
  "update:endDate": [value: string];
  "update:expirationWindowDays": [value: number];
}>();

const { t } = useI18n();

const periodOptions = computed(() => [
  { label: t("dashboard.periods.today"), value: "today" },
  { label: t("dashboard.periods.last_7_days"), value: "last_7_days" },
  { label: t("dashboard.periods.month"), value: "month" },
  { label: t("dashboard.periods.last_30_days"), value: "last_30_days" },
  { label: t("dashboard.periods.custom"), value: "custom" },
]);

const selectedPeriod = computed({
  get: () => props.period,
  set: (value: DashboardPeriodPreset) => emit("update:period", value),
});
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:flex lg:items-end">
    <UFormField :label="$t('dashboard.period')" class="lg:w-56">
      <USelect
        v-model="selectedPeriod"
        :items="periodOptions"
        class="w-full"
      />
    </UFormField>

    <UFormField
      v-if="period === 'custom'"
      :label="$t('dashboard.start_date')"
      class="lg:w-44"
    >
      <UInput
        :model-value="startDate"
        type="date"
        class="w-full"
        @update:model-value="emit('update:startDate', String($event))"
      />
    </UFormField>

    <UFormField
      v-if="period === 'custom'"
      :label="$t('dashboard.end_date')"
      class="lg:w-44"
    >
      <UInput
        :model-value="endDate"
        type="date"
        class="w-full"
        @update:model-value="emit('update:endDate', String($event))"
      />
    </UFormField>

    <UFormField
      v-if="showExpirationWindow"
      :label="$t('dashboard.expiration_window_days')"
      class="lg:w-56"
    >
      <UInputNumber
        :model-value="expirationWindowDays"
        :min="1"
        class="w-full"
        @update:model-value="
          emit('update:expirationWindowDays', Number($event ?? 1))
        "
      />
    </UFormField>
  </div>
</template>
