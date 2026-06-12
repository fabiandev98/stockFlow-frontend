<script setup lang="ts">
import {
  definePageMeta,
  ref,
  useAccessControl,
  useI18n,
  useLocalePath,
  useMaterialModule,
  useToast,
} from "#imports";
import type { TableColumn } from "@nuxt/ui";
import { FetchError } from "ofetch";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import useConfirmDialog from "~/composables/useConfirmDialog";
import { PERMISSION } from "~/constants/permissions";
import type { Material } from "~/types/material";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.MATERIALS_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const { fetchMaterials, deleteMaterial } = useMaterialModule();
const { userCan } = useAccessControl([
  PERMISSION.MATERIALS_DELETE,
  PERMISSION.MATERIALS_UPDATE,
]);

const isDeleting = ref<boolean>(false);

const columns: TableColumn<Material>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  { accessorKey: "name", header: t("materials.name") },
  { accessorKey: "unit", header: t("materials.unit") },
  { accessorKey: "minimum_stock", header: t("materials.minimum_stock") },
  {
    accessorKey: "category.name",
    header: t("materials.category"),
    enableSorting: false,
  },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  material: Material,
  refreshCallback: () => Promise<unknown>
) {
  if (isDeleting.value) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("common.crud.confirm_delete_description", {
      resource: material.name,
    }),
  });

  const confirmed = await instance.result;
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await deleteMaterial(material.id);
    await refreshCallback();
    toast.add({
      title: t("common.crud.resource_deleted", { resource: material.name }),
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
    :fetch-function="fetchMaterials"
    data-key="materials"
    :empty-message="t('materials.no_materials')"
    global-filter-enabled
  >
    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <ButtonDelete
          v-if="userCan(PERMISSION.MATERIALS_DELETE)"
          :loading="isDeleting"
          @click="handleDelete(row.original, refresh)"
        />
        <ButtonUpdate
          v-if="userCan(PERMISSION.MATERIALS_UPDATE)"
          :route="lp('/materials/edit-' + row.original.id)"
        />
      </div>
    </template>
  </SharedLazyLoadedDatatable>
</template>
