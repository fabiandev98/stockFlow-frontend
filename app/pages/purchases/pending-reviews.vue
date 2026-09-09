<script setup lang="ts">
import { definePageMeta, useI18n, useLocalePath, usePurchaseModule } from "#imports";
import type { TableColumn } from "@nuxt/ui";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import { PERMISSION } from "~/constants/permissions";
import type { Purchase } from "~/types/purchase";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PURCHASES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const { fetchPendingPurchaseReviews } = usePurchaseModule();

const columns: TableColumn<Purchase>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { accessorKey: "supplier.name", header: t("purchases.supplier"), enableSorting: false },
  { accessorKey: "purchase_date", header: t("purchases.purchase_date"), enableSorting: false },
  { accessorKey: "pending_review_items_count", header: t("purchases.items_pending_review"), enableSorting: false },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">{{ $t("purchases.pending_reviews") }}</h1>
      <p class="mt-1 text-sm text-muted">{{ $t("purchases.pending_reviews_description") }}</p>
    </div>

    <SharedLazyLoadedDatatable
      :columns="columns"
      :fetch-function="fetchPendingPurchaseReviews"
      data-key="purchases"
      :empty-message="t('purchases.no_pending_reviews')"
    >
      <template #purchase_date-cell="{ row }">
        {{ formatDisplayDate(row.original.purchase_date) }}
      </template>

      <template #action-cell="{ row }">
        <UTooltip :text="$t('purchases.review_purchase')">
          <UButton
            :to="lp('/purchases/show-' + row.original.id)"
            icon="i-lucide-clipboard-check"
            color="primary"
            variant="soft"
            square
            :aria-label="$t('purchases.review_purchase')"
          />
        </UTooltip>
      </template>
    </SharedLazyLoadedDatatable>
  </div>
</template>
