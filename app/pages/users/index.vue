<script setup lang="ts">
import {
  definePageMeta,
  useI18n,
  useUserModule,
  ref,
  useToast,
  useAccessControl,
  useLocalePath,
} from "#imports";
import SharedLazyLoadedDatatable from "~/components/shared/SharedLazyLoadedDatatable.vue";
import type { TableColumn } from "@nuxt/ui";
import { PERMISSION } from "~/constants/permissions";
import type { User } from "~/types/user";
import useConfirmDialog from "~/composables/useConfirmDialog";
import ButtonDelete from "~/components/button/ButtonDelete.vue";
import ButtonUpdate from "~/components/button/ButtonUpdate.vue";
import { FetchError } from "ofetch";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.USERS_READ],
});

const { t } = useI18n();
const lp = useLocalePath();
const { fetchUsers, deleteUser } = useUserModule();
const { userCan, roleCan } = useAccessControl([
  PERMISSION.USERS_DELETE,
  PERMISSION.USERS_UPDATE,
]);
const toast = useToast();
const confirmDialog = useConfirmDialog();

const isDeleting = ref<boolean>(false);
const columns: TableColumn<User>[] = [
  { accessorKey: "id", header: t("common.id"), enableSorting: false },
  {
    accessorKey: "name",
    header: t("users.name"),
    enableSorting: false,
  },
  {
    accessorKey: "role.name",
    header: t("users.role"),
    enableSorting: false,
  },
  { accessorKey: "email", header: t("users.email"), enableSorting: false },
  { accessorKey: "action", header: t("common.action"), enableSorting: false },
];

async function handleDelete(
  user: User,
  refreshCallback: () => Promise<unknown>
) {
  if (isDeleting.value) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("common.crud.confirm_delete_description", {
      resource: user.name,
    }),
  });

  const confirmed = await instance.result;
  if (!confirmed) return;

  isDeleting.value = true;
  try {
    await deleteUser(user.id);
    await refreshCallback();
    toast.add({
      title: t("common.crud.resource_deleted", { resource: user.name }),
      description: t("common.crud.resource_deleted_description", {
        resource: user.name,
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
    :fetch-function="fetchUsers"
    data-key="users"
    :empty-message="t('users.no_users')"
    :expandable="true"
    :global-filter-enabled="true"
  >
    <!-- Actions column -->
    <template #action-cell="{ row, refresh }">
      <div class="flex gap-2">
        <template v-if="roleCan(row.original.role.hierarchy)">
          <ButtonDelete
            v-if="userCan(PERMISSION.USERS_DELETE)"
            :loading="isDeleting"
            @click="handleDelete(row.original, refresh)"
          />
          <ButtonUpdate
            v-if="userCan(PERMISSION.USERS_UPDATE)"
            :route="lp('/users/edit-' + row.original.id)"
          />
        </template>
      </div>
    </template>

    <!-- Expanded row content -->
    <template #expanded="{ row }">
      <div class="">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="font-medium text-gray-700">{{ t('common.id') }}:</span>
            <span class="ml-2">{{ row.original.id }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">{{ t('users.name') }}:</span>
            <span class="ml-2">{{ row.original.name }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">{{ t('users.email') }}:</span>
            <span class="ml-2">{{ row.original.email }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">{{ t('users.role') }}:</span>
            <span class="ml-2">{{ row.original.role.name }}</span>
          </div>
          <div v-if="row.original.created_at">
            <span class="font-medium text-gray-700">{{ t('common.created_at') }}:</span>
            <span class="ml-2">{{ new Date(row.original.created_at).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </template>
  </SharedLazyLoadedDatatable>
</template>
