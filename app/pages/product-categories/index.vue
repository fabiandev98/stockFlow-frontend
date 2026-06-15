<script setup lang="ts">
import {
  definePageMeta,
  ref,
  useAccessControl,
  useI18n,
  useLocalePath,
  useProductCategoryModule,
  useToast,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import { FetchError } from "ofetch";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import useConfirmDialog from "~/composables/useConfirmDialog";
import { PERMISSION } from "~/constants/permissions";
import type { ProductCategory } from "~/types/product";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.PRODUCT_CATEGORIES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const { fetchProductCategories, deleteProductCategory } =
  useProductCategoryModule();
const { userCan } = useAccessControl([
  PERMISSION.PRODUCT_CATEGORIES_DELETE,
  PERMISSION.PRODUCT_CATEGORIES_UPDATE,
]);

const isDeleting = ref<boolean>(false);

const columns: TableColumn<ProductCategory>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { accessorKey: "name", header: t("product_categories.name") },
  {
    accessorKey: "products_count",
    header: t("product_categories.products_count"),
    enableSorting: false,
  },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  category: ProductCategory,
  refreshCallback: () => Promise<unknown>
) {
  if (isDeleting.value) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("common.crud.confirm_delete_description", {
      resource: category.name,
    }),
  });

  const confirmed = await instance.result;
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await deleteProductCategory(category.id);
    await refreshCallback();
    toast.add({
      title: t("common.crud.resource_deleted", { resource: category.name }),
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
    :fetch-function="fetchProductCategories"
    data-key="product-categories"
    :empty-message="t('product_categories.no_categories')"
    global-filter-enabled
  >
    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <ButtonDelete
          v-if="userCan(PERMISSION.PRODUCT_CATEGORIES_DELETE)"
          :loading="isDeleting"
          @click="handleDelete(row.original, refresh)"
        />
        <ButtonUpdate
          v-if="userCan(PERMISSION.PRODUCT_CATEGORIES_UPDATE)"
          :route="lp('/product-categories/edit-' + row.original.id)"
        />
      </div>
    </template>
  </SharedLazyLoadedDatatable>
</template>
