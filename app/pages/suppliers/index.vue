<script setup lang="ts">
import {
  definePageMeta,
  ref,
  useAccessControl,
  useI18n,
  useLocalePath,
  useSupplierModule,
  useToast,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import { FetchError } from "ofetch";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import useConfirmDialog from "~/composables/useConfirmDialog";
import { PERMISSION } from "~/constants/permissions";
import type { Supplier } from "~/types/supplier";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.SUPPLIERS_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const { fetchSuppliers, deleteSupplier } = useSupplierModule();
const { userCan } = useAccessControl([
  PERMISSION.SUPPLIERS_DELETE,
  PERMISSION.SUPPLIERS_UPDATE,
]);

const isDeleting = ref<boolean>(false);

const columns: TableColumn<Supplier>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { accessorKey: "name", header: t("suppliers.name") },
  { accessorKey: "contact_name", header: t("suppliers.contact_name") },
  { accessorKey: "phone", header: t("suppliers.phone") },
  { accessorKey: "email", header: t("suppliers.email") },
  {
    accessorKey: "purchases_count",
    header: t("suppliers.purchases_count"),
    enableSorting: false,
  },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  supplier: Supplier,
  refreshCallback: () => Promise<unknown>
) {
  if (isDeleting.value) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("common.crud.confirm_delete_description", {
      resource: supplier.name,
    }),
  });

  const confirmed = await instance.result;
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await deleteSupplier(supplier.id);
    await refreshCallback();
    toast.add({
      title: t("common.crud.resource_deleted", { resource: supplier.name }),
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
    :fetch-function="fetchSuppliers"
    data-key="suppliers"
    :empty-message="t('suppliers.no_suppliers')"
    global-filter-enabled
  >
    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <ButtonDelete
          v-if="userCan(PERMISSION.SUPPLIERS_DELETE)"
          :loading="isDeleting"
          @click="handleDelete(row.original, refresh)"
        />
        <ButtonUpdate
          v-if="userCan(PERMISSION.SUPPLIERS_UPDATE)"
          :route="lp('/suppliers/edit-' + row.original.id)"
        />
      </div>
    </template>
  </SharedLazyLoadedDatatable>
</template>
