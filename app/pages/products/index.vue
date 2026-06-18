<script setup lang="ts">
import {
  definePageMeta,
  ref,
  useAccessControl,
  useI18n,
  useLocalePath,
  useProductModule,
  useToast,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import { FetchError } from "ofetch";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import useConfirmDialog from "~/composables/useConfirmDialog";
import { PERMISSION } from "~/constants/permissions";
import type { Product } from "~/types/product";
import { formatPeso } from "~/utils/currency-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PRODUCTS_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const { fetchProducts, deleteProduct } = useProductModule();
const { userCan } = useAccessControl([
  PERMISSION.PRODUCTS_DELETE,
  PERMISSION.PRODUCTS_UPDATE,
]);

const isDeleting = ref<boolean>(false);

const columns: TableColumn<Product>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { accessorKey: "name", header: t("products.name") },
  {
    accessorKey: "category.name",
    header: t("products.category"),
    enableSorting: false,
  },
  { accessorKey: "sale_price", header: t("products.sale_price") },
  { accessorKey: "is_composed", header: t("products.type") },
  {
    accessorKey: "available_to_sell",
    header: t("products.available_to_sell"),
    enableSorting: false,
  },
  {
    accessorKey: "compositions_count",
    header: t("products.compositions_count"),
    enableSorting: false,
  },
  { accessorKey: "is_active", header: t("products.is_active") },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  product: Product,
  refreshCallback: () => Promise<unknown>
) {
  if (isDeleting.value) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("common.crud.confirm_delete_description", {
      resource: product.name,
    }),
  });

  const confirmed = await instance.result;
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await deleteProduct(product.id);
    await refreshCallback();
    toast.add({
      title: t("common.crud.resource_deleted", { resource: product.name }),
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
    :fetch-function="fetchProducts"
    data-key="products"
    :empty-message="t('products.no_products')"
    global-filter-enabled
  >
    <template #sale_price-cell="{ row }">
      {{ formatPeso(row.original.sale_price) }}
    </template>

    <template #is_composed-cell="{ row }">
      <UBadge :color="row.original.is_composed ? 'primary' : 'neutral'">
        {{
          row.original.is_composed
            ? $t("products.composed")
            : $t("products.simple")
        }}
      </UBadge>
    </template>

    <template #is_active-cell="{ row }">
      <UBadge :color="row.original.is_active ? 'success' : 'neutral'">
        {{ row.original.is_active ? $t("products.active") : $t("products.inactive") }}
      </UBadge>
    </template>

    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <ButtonDelete
          v-if="userCan(PERMISSION.PRODUCTS_DELETE)"
          :loading="isDeleting"
          @click="handleDelete(row.original, refresh)"
        />
        <ButtonUpdate
          v-if="userCan(PERMISSION.PRODUCTS_UPDATE)"
          :route="lp('/products/edit-' + row.original.id)"
        />
      </div>
    </template>
  </SharedLazyLoadedDatatable>
</template>
