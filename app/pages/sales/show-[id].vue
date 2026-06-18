<script setup lang="ts">
import {
  computed,
  createError,
  definePageMeta,
  useAsyncData,
  useI18n,
  useLocalePath,
  useRoute,
  useSaleModule,
} from "#imports";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.SALES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const { fetchSaleById } = useSaleModule();

const { data, error } = await useAsyncData(() =>
  fetchSaleById(Number(route.params.id))
);

if (error.value || data.value === null) {
  throw createError({
    statusCode: HTTP_STATUS.NOT_FOUND,
    statusMessage: t("http_error.404"),
    fatal: true,
  });
}

const title = computed<string>(
  () => `${t("sales.resource_name")} #${data.value?.id}`
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
          {{ formatDisplayDate(data.sale_date) }}
        </p>
      </div>

      <UButton icon="i-lucide-arrow-left" color="neutral" :to="lp('/sales')">
        {{ $t("common.back") }}
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("sales.registered_by") }}
        </p>
        <p class="font-medium">
          {{ data.user?.name ?? "-" }}
        </p>
      </div>

      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("sales.items_count") }}
        </p>
        <p class="font-medium">
          {{ data.items?.length ?? data.items_count ?? 0 }}
        </p>
      </div>

      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("sales.total_amount") }}
        </p>
        <p class="font-medium">
          {{ formatPeso(data.total_amount) }}
        </p>
      </div>
    </div>

    <div v-if="data.notes" class="border border-neutral-200 rounded p-4">
      <p class="text-xs text-neutral-500">
        {{ $t("sales.notes") }}
      </p>
      <p class="mt-1 text-sm">
        {{ data.notes }}
      </p>
    </div>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">
        {{ $t("sales.items") }}
      </h2>

      <div
        v-for="item in data.items ?? []"
        :key="item.id"
        class="border border-neutral-200 rounded p-4 space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("sales.product") }}
            </p>
            <p class="font-medium">
              {{ item.product?.name ?? `#${item.product_id}` }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("sales.quantity") }}
            </p>
            <p class="font-medium">
              {{ item.quantity }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("sales.unit_price") }}
            </p>
            <p class="font-medium">
              {{ formatPeso(item.unit_price) }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("sales.item_total") }}
            </p>
            <p class="font-medium">
              {{ formatPeso(item.total_price) }}
            </p>
          </div>
        </div>

        <div v-if="item.stock_movements?.length" class="space-y-2">
          <h3 class="text-sm font-medium">
            {{ $t("sales.inventory_movements") }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="movement in item.stock_movements"
              :key="movement.id"
              class="border border-neutral-200 rounded p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">
                  {{ movement.material?.name ?? `#${movement.material_id}` }}
                </p>
                <UBadge color="neutral" variant="soft">
                  {{ $t("inventory.batch") }} #{{ movement.stock_batch_id }}
                </UBadge>
              </div>

              <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("sales.quantity") }}
                  </p>
                  <p class="text-sm">
                    {{ quantity(movement.quantity, movement.material?.unit) }}
                  </p>
                </div>

                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("inventory.movement_date") }}
                  </p>
                  <p class="text-sm">
                    {{ formatDisplayDate(movement.movement_date) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="item.product_stock_movements?.length" class="space-y-2">
          <h3 class="text-sm font-medium">
            {{ $t("sales.inventory_movements") }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="movement in item.product_stock_movements"
              :key="movement.id"
              class="border border-neutral-200 rounded p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">
                  {{ movement.product?.name ?? `#${movement.product_id}` }}
                </p>
                <UBadge color="neutral" variant="soft">
                  {{ $t("inventory.batch") }} #{{ movement.product_batch_id }}
                </UBadge>
              </div>

              <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("sales.quantity") }}
                  </p>
                  <p class="text-sm">
                    {{ quantity(movement.quantity, "u") }}
                  </p>
                </div>

                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("inventory.movement_date") }}
                  </p>
                  <p class="text-sm">
                    {{ formatDisplayDate(movement.movement_date) }}
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
