<script setup lang="ts">
import { getPermissionsGroups } from "#imports";
import { computed } from "vue";
import type { Permission } from "~/constants/permissions";
import useAuthStore from "~/stores/auth-store";
import type { RolePermissionGroup } from "~/types/role";

const { name } = defineProps<{
  name: string;
}>();

const permissions = defineModel<Permission[]>({ required: true });

const { user } = useAuthStore();
const userPermissions: RolePermissionGroup[] = getPermissionsGroups(
  user?.role.permissions ?? []
);

const slices = computed<RolePermissionGroup[][]>(() => {
  const mid = Math.ceil(userPermissions.length / 2);
  return [userPermissions.slice(0, mid), userPermissions.slice(mid)];
});

function togglePermission(id: Permission, checked: boolean) {
  permissions.value = checked
    ? [...new Set([...permissions.value, id])]
    : permissions.value.filter((x) => x !== id);
}
</script>
<template>
  <UFormField :name="name" :label="$t('roles.select_permissions')" required>
    <div class="max-h-[700px] overflow-y-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div v-for="(column, index) in slices" :key="index">
          <div
            v-for="permissionModule in column"
            :key="permissionModule.module"
            class="p-2 mb-2 rounded-md border border-neutral-300"
          >
            <p class="text-center m-0 uppercase font-medium">
              {{ permissionModule.module }}
            </p>
            <UCheckbox
              v-for="permission in permissionModule.permissions"
              :key="permission"
              :model-value="permissions.includes(permission)"
              :label="permission"
              :value="permission"
              :ui="{
                label: 'font-normal',
              }"
              @update:model-value="(val) => togglePermission(permission, !!val)"
            />
          </div>
        </div>
      </div>
    </div>
  </UFormField>
</template>
