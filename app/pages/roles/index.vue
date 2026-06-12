<script setup lang="ts">
import {
  definePageMeta,
  useI18n,
  ref,
  useToast,
  useAccessControl,
  useLocalePath,
  useRoleModule,
} from "#imports";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import type { TableColumn } from "@nuxt/ui";
import { PERMISSION } from "~/constants/permissions";
import useConfirmDialog from "~/composables/useConfirmDialog";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import { FetchError } from "ofetch";
import type { Role } from "~/types/role";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.ROLES_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const { fetchRoles, deleteRole } = useRoleModule();
const { userCan, roleCan } = useAccessControl([
  PERMISSION.ROLES_DELETE,
  PERMISSION.ROLES_UPDATE,
]);
const toast = useToast();
const confirmDialog = useConfirmDialog();

const isDeleting = ref<boolean>(false);
const columns: TableColumn<Role>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  {
    accessorKey: "name",
    header: t("roles.name"),
    enableSorting: false,
  },
  {
    accessorKey: "description",
    header: t("roles.description"),
    enableSorting: false,
  },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  role: Role,
  refreshCallback: () => Promise<unknown>
) {
  if (isDeleting.value) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("common.crud.confirm_delete_description", {
      resource: role.name,
    }),
  });

  const confirmed = await instance.result;
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await deleteRole(role.id);
    await refreshCallback();
    toast.add({
      title: t("common.crud.resource_deleted", { resource: role.name }),
      description: t("common.crud.resource_deleted_description", {
        resource: role.name,
      }),
      color: "success",
    });
  } catch (error: unknown) {
    if (!(error instanceof FetchError)) {
      toast.add({
        title: t("common.generic_error_title"),
        description: t("common.generic_unknown_error"),
        color: "error",
      });
    } else {
      toast.add({
        title: t("common.generic_error_title"),
        description: t("common.generic_error", {
          context: `${error.statusCode} - ${
            error.data?.message ?? error.message
          }`,
        }),
        color: "error",
      });
    }
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <SharedLazyLoadedDatatable
    :columns="columns"
    :fetch-function="fetchRoles"
    data-key="roles"
    :empty-message="t('roles.no_roles')"
  >
    <!-- Actions column -->
    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <template v-if="roleCan(row.original.hierarchy)">
          <ButtonDelete
            v-if="userCan(PERMISSION.ROLES_DELETE)"
            :loading="isDeleting"
            @click="handleDelete(row.original, refresh)"
          />
          <ButtonUpdate
            v-if="userCan(PERMISSION.ROLES_UPDATE)"
            :route="lp('/roles/edit-' + row.original.id)"
          />
        </template>
      </div>
    </template>
  </SharedLazyLoadedDatatable>
</template>
