<script setup lang="ts">
import {
  computed,
  createError,
  definePageMeta,
  ref,
  useAsyncData,
  useAccessControl,
  useI18n,
  useLocalePath,
  useRoute,
  useSaleModule,
  useToast,
} from "#imports";
import { FetchError } from "ofetch";
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
const toast = useToast();
const { fetchSaleById, cancelSale } = useSaleModule();
const { userCan } = useAccessControl([PERMISSION.SALES_CANCEL]);

const { data, error, refresh } = await useAsyncData(() =>
  fetchSaleById(Number(route.params.id))
);

const isCancelling = ref(false);
const isCancellationFormVisible = ref(false);
const cancellationReason = ref("");

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

async function handleCancel(): Promise<void> {
  if (!data.value || isCancelling.value || cancellationReason.value.trim().length < 3) return;

  isCancelling.value = true;
  try {
    await cancelSale(data.value.id, cancellationReason.value.trim());
    await refresh();
    isCancellationFormVisible.value = false;
    toast.add({ title: t("sales.cancelled_success"), color: "success" });
  } catch (error: unknown) {
    toast.add({
      title: t("common.generic_error_title"),
      description:
        error instanceof FetchError
          ? error.data?.message ?? error.message
          : t("common.generic_unknown_error"),
      color: "error",
    });
  } finally {
    isCancelling.value = false;
  }
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

      <div class="flex gap-2">
        <UButton
          v-if="data.status === 'completed' && userCan(PERMISSION.SALES_CANCEL)"
          icon="i-lucide-ban"
          color="error"
          variant="soft"
          @click="isCancellationFormVisible = true"
        >
          {{ $t("sales.cancel") }}
        </UButton>
        <UButton icon="i-lucide-arrow-left" color="neutral" :to="lp('/sales')">
          {{ $t("common.back") }}
        </UButton>
      </div>
    </div>

    <div
      v-if="data.status === 'cancelled'"
      class="rounded border border-error-200 bg-error-50 p-4 text-error-800"
    >
      <p class="font-medium">{{ $t("sales.cancelled") }}</p>
      <p class="mt-1 text-sm">{{ data.cancellation_reason }}</p>
      <p v-if="data.cancelled_at" class="mt-2 text-xs">
        {{ $t("sales.cancelled_at", { date: formatDisplayDate(data.cancelled_at) }) }}
      </p>
    </div>

    <UCard v-if="isCancellationFormVisible" class="border border-error-200">
      <template #header>
        <h2 class="font-semibold">{{ $t("sales.cancel_sale") }}</h2>
      </template>
      <UFormField :label="$t('sales.cancellation_reason')" required>
        <UTextarea v-model="cancellationReason" class="w-full" :rows="3" />
      </UFormField>
      <p class="mt-2 text-xs text-muted">{{ $t("sales.cancellation_hint") }}</p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="isCancellationFormVisible = false">
            {{ $t("common.cancel") }}
          </UButton>
          <UButton color="error" :loading="isCancelling" @click="handleCancel">
            {{ $t("sales.confirm_cancellation") }}
          </UButton>
        </div>
      </template>
    </UCard>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          {{ $t("sales.covers") }}
        </p>
        <p class="font-medium">
          {{ data.covers ?? "-" }}
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

    <div class="border border-neutral-200 rounded p-4 space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-neutral-500">{{ $t("sales.subtotal_amount") }}</span>
        <span>{{ formatPeso(data.subtotal_amount) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-neutral-500">{{ $t("sales.discount_amount") }}</span>
        <span>-{{ formatPeso(data.discount_amount) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-neutral-500">
          {{ $t("sales.tax_amount_with_rate", { rate: data.tax_rate }) }}
        </span>
        <span>{{ formatPeso(data.tax_amount) }}</span>
      </div>
      <div class="flex items-center justify-between border-t pt-2">
        <span class="font-medium">{{ $t("sales.total_amount") }}</span>
        <span class="text-lg font-semibold">{{ formatPeso(data.total_amount) }}</span>
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
