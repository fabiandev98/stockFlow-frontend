<script setup lang="ts">
import {
  definePageMeta,
  ref,
  useAccessControl,
  useI18n,
  useLocalePath,
  useMaterialCategoryModule,
  useToast,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import { FetchError } from "ofetch";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import useConfirmDialog from "~/composables/useConfirmDialog";
import { PERMISSION } from "~/constants/permissions";
import type { MaterialCategory } from "~/types/material";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.MATERIAL_CATEGORIES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const { fetchMaterialCategories, deleteMaterialCategory } =
  useMaterialCategoryModule();
const { userCan } = useAccessControl([
  PERMISSION.MATERIAL_CATEGORIES_DELETE,
  PERMISSION.MATERIAL_CATEGORIES_UPDATE,
]);

const isDeleting = ref<boolean>(false);

const columns: TableColumn<MaterialCategory>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { accessorKey: "name", header: t("material_categories.name") },
  {
    accessorKey: "materials_count",
    header: t("material_categories.materials_count"),
    enableSorting: false,
  },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  category: MaterialCategory,
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
    await deleteMaterialCategory(category.id);
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
    :fetch-function="fetchMaterialCategories"
    data-key="material-categories"
    :empty-message="t('material_categories.no_categories')"
    global-filter-enabled
  >
    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <ButtonDelete
          v-if="userCan(PERMISSION.MATERIAL_CATEGORIES_DELETE)"
          :loading="isDeleting"
          @click="handleDelete(row.original, refresh)"
        />
        <ButtonUpdate
          v-if="userCan(PERMISSION.MATERIAL_CATEGORIES_UPDATE)"
          :route="lp('/material-categories/edit-' + row.original.id)"
        />
      </div>
    </template>
  </SharedLazyLoadedDatatable>
</template>
