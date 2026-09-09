<script setup lang="ts">
import {
  computed,
  createError,
  definePageMeta,
  reactive,
  ref,
  useAsyncData,
  useI18n,
  useLocalePath,
  usePurchaseModule,
  useRoute,
  useToast,
} from "#imports";
import { FetchError } from "ofetch";
import { HTTP_STATUS } from "~/constants/http-statuses";
import { PERMISSION } from "~/constants/permissions";
import type { Purchase, PurchaseItem, PurchaseItemYieldPayload } from "~/types/purchase";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PURCHASES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const route = useRoute();
const toast = useToast();
const { fetchPurchaseById, savePurchaseItemYield } = usePurchaseModule();
const savingYieldItemId = ref<number | null>(null);
const itemYieldForms = reactive<Record<number, PurchaseItemYieldPayload>>({});
const editingYieldItems = reactive<Record<number, boolean>>({});

const { data, error, refresh: refreshPurchase } = await useAsyncData(() =>
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

function synchronizeYieldForms(purchase: Purchase): void {
  for (const item of purchase.items ?? []) {
    itemYieldForms[item.id] = {
      usable_quantity: item.usable_quantity === null ? Number(item.accepted_quantity) : Number(item.usable_quantity),
      processing_waste_reason: item.processing_waste_reason,
    };
    editingYieldItems[item.id] = false;
  }
}

synchronizeYieldForms(data.value);

function itemUnit(item: PurchaseItem): string | null | undefined {
  return item.product ? "u" : item.material?.unit;
}

function yieldPercentage(item: PurchaseItem): string {
  const usableQuantity = itemYieldForms[item.id]?.usable_quantity ?? 0;
  const acceptedQuantity = Number(item.accepted_quantity);

  return acceptedQuantity > 0 ? `${((usableQuantity / acceptedQuantity) * 100).toFixed(2)}%` : "0.00%";
}

function processingWaste(item: PurchaseItem): string {
  const usableQuantity = itemYieldForms[item.id]?.usable_quantity ?? 0;

  return quantity(Number(item.accepted_quantity) - usableQuantity, itemUnit(item));
}

function isYieldLocked(item: PurchaseItem): boolean {
  return item.yield_recorded_at !== null && !editingYieldItems[item.id];
}

function editItemYield(item: PurchaseItem): void {
  editingYieldItems[item.id] = true;
}

async function saveItemYield(item: PurchaseItem): Promise<void> {
  if (!data.value || savingYieldItemId.value !== null) return;
  savingYieldItemId.value = item.id;
  try {
    await savePurchaseItemYield(data.value.id, item.id, itemYieldForms[item.id]);
    await refreshPurchase();
    if (data.value) synchronizeYieldForms(data.value);
    toast.add({ title: t("purchases.yield_saved"), color: "success" });
  } catch (error: unknown) {
    toast.add({
      title: t("common.generic_error_title"),
      description: error instanceof FetchError ? error.data?.message ?? error.message : t("common.generic_unknown_error"),
      color: "error",
    });
  } finally {
    savingYieldItemId.value = null;
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
              {{ item.product ? $t("purchases.product") : $t("purchases.material") }}
            </p>
            <p class="font-medium">
              {{
                item.product?.name ??
                item.material?.name ??
                `#${item.product_id ?? item.material_id}`
              }}
            </p>
          </div>

          <div>
            <p class="text-xs text-neutral-500">
              {{ $t("purchases.quantity") }}
            </p>
            <p class="font-medium">
              {{ quantity(item.quantity, item.product ? "u" : item.material?.unit) }}
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

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-medium">{{ $t("purchases.processing_result") }}</h3>
              <UButton v-if="isYieldLocked(item)" color="neutral" variant="soft" icon="i-lucide-pencil" size="sm" @click="editItemYield(item)">{{ $t("purchases.edit_yield") }}</UButton>
            </div>
          </template>

          <div v-if="isYieldLocked(item)" class="rounded-lg border border-default bg-muted/40 p-4">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <div><p class="text-sm text-muted">{{ $t("purchases.accepted_quantity") }}</p><p class="mt-1 font-medium">{{ quantity(item.accepted_quantity, itemUnit(item)) }}</p></div>
              <div><p class="text-sm text-muted">{{ $t("purchases.usable_quantity") }}</p><p class="mt-1 font-medium">{{ quantity(item.usable_quantity, itemUnit(item)) }}</p></div>
              <div><p class="text-sm text-muted">{{ $t("purchases.yield_percentage") }}</p><p class="mt-1 font-medium">{{ yieldPercentage(item) }}</p></div>
              <div><p class="text-sm text-muted">{{ $t("purchases.processing_waste") }}</p><p class="mt-1 font-medium">{{ processingWaste(item) }}</p></div>
              <div><p class="text-sm text-muted">{{ $t("purchases.reviewed_on") }}</p><p class="mt-1 font-medium">{{ formatDisplayDate(item.yield_recorded_at) }}</p></div>
              <div><p class="text-sm text-muted">{{ $t("purchases.reviewed_by") }}</p><p class="mt-1 font-medium">{{ item.yield_reviewer?.name ?? "-" }}</p></div>
            </div>
            <div v-if="item.processing_waste_reason" class="mt-4 border-t border-default pt-3"><p class="text-sm text-muted">{{ $t("purchases.processing_waste_reason") }}</p><p class="mt-1 text-sm">{{ item.processing_waste_reason }}</p></div>
          </div>

          <form v-else class="space-y-4" @submit.prevent="saveItemYield(item)">
            <p class="text-sm text-muted">{{ $t("purchases.yield_help") }}</p>
            <div class="grid gap-4 md:grid-cols-4">
              <div>
                <p class="text-sm text-muted">{{ $t("purchases.accepted_quantity") }}</p>
                <p class="mt-1 font-medium">{{ quantity(item.accepted_quantity, itemUnit(item)) }}</p>
              </div>
              <UFormField :label="$t('purchases.usable_quantity')">
                <UInput v-model.number="itemYieldForms[item.id].usable_quantity" type="number" min="0" :max="Number(item.accepted_quantity)" step="0.01" />
              </UFormField>
              <div>
                <p class="text-sm text-muted">{{ $t("purchases.yield_percentage") }}</p>
                <p class="mt-1 font-medium">{{ yieldPercentage(item) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted">{{ $t("purchases.processing_waste") }}</p>
                <p class="mt-1 font-medium">{{ processingWaste(item) }}</p>
              </div>
            </div>
            <div class="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <UFormField :label="$t('purchases.processing_waste_reason')">
                <UTextarea v-model="itemYieldForms[item.id].processing_waste_reason" :rows="2" class="w-full" />
              </UFormField>
              <UButton type="submit" :loading="savingYieldItemId === item.id" icon="i-lucide-scale">{{ item.yield_recorded_at ? $t("purchases.update_yield") : $t("purchases.save_yield") }}</UButton>
            </div>
          </form>
        </UCard>

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

        <div v-if="item.product_batches?.length" class="space-y-2">
          <h3 class="text-sm font-medium">
            {{ $t("purchases.created_batches") }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="batch in item.product_batches"
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
                    {{ quantity(batch.initial_quantity, "u") }}
                  </p>
                </div>

                <div>
                  <p class="text-xs text-neutral-500">
                    {{ $t("purchases.available_quantity") }}
                  </p>
                  <p class="text-sm">
                    {{ quantity(batch.available_quantity, "u") }}
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
