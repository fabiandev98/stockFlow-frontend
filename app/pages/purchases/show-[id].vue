<script setup lang="ts">
import {
  computed,
  createError,
  definePageMeta,
  useAsyncData,
  useI18n,
  useLocalePath,
  usePurchaseModule,
  useRoute,
} from "#imports";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PURCHASES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchPurchaseById } = usePurchaseModule();

const { data, error } = await useAsyncData(() =>
  fetchPurchaseById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

const title = computed<string>(
  () => `${t("purchases.resource_name")} #${data.value?.id}`
);

function quantity(
  value: string | number | null | undefined,
  unit?: string | null
): string {
  const amount = Number(value ?? 0).toFixed(2);
  return unit ? `${amount} ${unit}` : amount;
}
</script>

<template>
  <div v-if="data" class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">
          {{ title }}
        </h1>
        <p class="text-sm text-neutral-500">
          {{ formatDisplayDate(data.purchase_date) }}
        </p>
      </div>

      <UButton icon="i-lucide-arrow-left" color="neutral" :to="lp('/purchases')">
        {{ $t("common.back") }}
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("purchases.supplier") }}
        </p>
        <p class="font-medium">
          {{ data.supplier?.name ?? "-" }}
        </p>
      </div>

      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("purchases.registered_by") }}
        </p>
        <p class="font-medium">
          {{ data.user?.name ?? "-" }}
        </p>
      </div>

      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("purchases.items_count") }}
        </p>
        <p class="font-medium">
          {{ data.items?.length ?? data.items_count ?? 0 }}
        </p>
      </div>

      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("purchases.total_cost") }}
        </p>
        <p class="font-medium">
          {{ formatPeso(data.total_cost) }}
        </p>
      </div>
    </div>

    <div v-if="data.notes" class="border border-neutral-200 rounded p-4">
      <p class="text-xs text-neutral-500">
        {{ $t("purchases.notes") }}
      </p>
      <p class="mt-1 text-sm">
        {{ data.notes }}
      </p>
    </div>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">
        {{ $t("purchases.items") }}
      </h2>

      <div
        v-for="item in data.items ?? []"
        :key="item.id"
        class="border border-neutral-200 rounded p-4 space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("purchases.material") }}
            </p>
            <p class="font-medium">
              {{ item.material?.name ?? `#${item.material_id}` }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("purchases.quantity") }}
            </p>
            <p class="font-medium">
              {{ quantity(item.quantity, item.material?.unit) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("purchases.unit_cost") }}
            </p>
            <p class="font-medium">
              {{ formatPeso(item.unit_cost) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("purchases.item_total") }}
            </p>
            <p class="font-medium">
              {{ formatPeso(item.total_cost) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("purchases.expiration_date") }}
            </p>
            <p class="font-medium">
              {{
                item.expiration_date
                  ? formatDisplayDate(item.expiration_date)
                  : $t("purchases.not_perishable")
              }}
            </p>
          </div>
        </div>

        <div v-if="item.stock_batches?.length" class="space-y-2">
          <h3 class="text-sm font-medium">
            {{ $t("purchases.created_batches") }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="batch in item.stock_batches"
              :key="batch.id"
              class="border border-neutral-200 rounded p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">
                  {{ $t("purchases.batch") }} #{{ batch.id }}
                </p>
                <UBadge color="neutral" variant="soft">
                  {{ batch.status }}
                </UBadge>
              </div>

              <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("purchases.initial_quantity") }}
                  </p>
                  <p class="text-sm">
                    {{ quantity(batch.initial_quantity, item.material?.unit) }}
                  </p>
                </div>

                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("purchases.available_quantity") }}
                  </p>
                  <p class="text-sm">
                    {{ quantity(batch.available_quantity, item.material?.unit) }}
                  </p>
                </div>

                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("purchases.expiration_date") }}
                  </p>
                  <p class="text-sm">
                    {{
                      batch.expiration_date
                        ? formatDisplayDate(batch.expiration_date)
                        : $t("purchases.not_perishable")
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
