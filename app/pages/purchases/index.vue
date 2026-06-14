<script setup lang="ts">
import {
  definePageMeta,
  ref,
  useAccessControl,
  useI18n,
  useLocalePath,
  usePurchaseModule,
  useToast,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import { FetchError } from "ofetch";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import useConfirmDialog from "~/composables/useConfirmDialog";
import { PERMISSION } from "~/constants/permissions";
import type { Purchase } from "~/types/purchase";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PURCHASES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const { fetchPurchases, deletePurchase } = usePurchaseModule();
const { userCan } = useAccessControl([
  PERMISSION.PURCHASES_READ,
  PERMISSION.PURCHASES_DELETE,
  PERMISSION.PURCHASES_UPDATE,
]);

const isDeleting = ref<boolean>(false);

const columns: TableColumn<Purchase>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  {
    accessorKey: "supplier.name",
    header: t("purchases.supplier"),
    enableSorting: false,
  },
  { accessorKey: "purchase_date", header: t("purchases.purchase_date") },
  { accessorKey: "items_count", header: t("purchases.items_count") },
  { accessorKey: "total_cost", header: t("purchases.total_cost") },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  purchase: Purchase,
  refreshCallback: () => Promise<unknown>
) {
  if (isDeleting.value) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("common.crud.confirm_delete_description", {
      resource: `${t("purchases.resource_name")} #${purchase.id}`,
    }),
  });

  const confirmed = await instance.result;
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await deletePurchase(purchase.id);
    await refreshCallback();
    toast.add({
      title: t("common.crud.resource_deleted", {
        resource: `${t("purchases.resource_name")} #${purchase.id}`,
      }),
      color: "success",
    });
  } catch (error: unknown) {
    toast.add({
      title: t("common.generic_error_title"),
      description:
        error instanceof FetchError
          ? t("common.generic_error", {
              context: `${error.statusCode} - ${
                error.data?.message ?? error.message
              }`,
            })
          : t("common.generic_unknown_error"),
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <SharedLazyLoadedDatatable
    :columns="columns"
    :fetch-function="fetchPurchases"
    data-key="purchases"
    :empty-message="t('purchases.no_purchases')"
    global-filter-enabled
  >
    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <UButton
          v-if="userCan(PERMISSION.PURCHASES_READ)"
          icon="i-lucide-eye"
          color="neutral"
          size="sm"
          :to="lp('/purchases/show-' + row.original.id)"
        />
        <ButtonDelete
          v-if="userCan(PERMISSION.PURCHASES_DELETE)"
          :loading="isDeleting"
          @click="handleDelete(row.original, refresh)"
        />
        <ButtonUpdate
          v-if="userCan(PERMISSION.PURCHASES_UPDATE)"
          :route="lp('/purchases/edit-' + row.original.id)"
        />
      </div>
    </template>

    <template #purchase_date-cell="{ row }">
      {{ formatDisplayDate(row.original.purchase_date) }}
    </template>

    <template #total_cost-cell="{ row }">
      {{ formatPeso(row.original.total_cost) }}
    </template>
  </SharedLazyLoadedDatatable>
</template>
