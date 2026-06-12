<script setup lang="ts">
import { ref } from "vue";
import { createError, useAsyncData, useI18n, useUserModule } from "#imports";
import type { Role } from "~/types/role";
import useAuthStore from "~/stores/auth-store";
import { HTTP_STATUS } from "~/constants/http-statuses";

interface Props {
  modelValue: number;
  updating: boolean;
}

type RoleHierarchy = {
  id: number;
  name: string;
  hierarchy: number;
};

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [payload: number];
}>();

const { t } = useI18n();
const { user } = useAuthStore();
const { fetchCurrentUserRolesBelow } = useUserModule();

const userRole = user!.role;
const userHierarchy = ref<number>(userRole.hierarchy);

const selected = ref<number>(-1);
const dragging = ref<boolean>(false);
const iDragging = ref<number>(0);
const iEnter = ref<number>(0);

const { data, error } = await useAsyncData(() => fetchCurrentUserRolesBelow());
const availableRoles = ref<RoleHierarchy[]>(processRoles(data.value ?? []));

if (error.value) {
  throw createError({
    statusCode: HTTP_STATUS.FORBIDDEN,
    statusMessage: t("common.generic_unknown_error"),
    fatal: true,
  });
}

function processRoles(data: Role[]): RoleHierarchy[] {
  const roles: RoleHierarchy[] = data.map((role): RoleHierarchy => {
    return {
      id: role.id,
      name: role.name,
      hierarchy: role.hierarchy,
    };
  });
  if (!props.updating) {
    let maxHierarchy = roles.reduce((max: number, obj: RoleHierarchy) => {
      return obj.hierarchy > max ? obj.hierarchy : max;
    }, -Infinity);
    maxHierarchy = maxHierarchy > 0 ? maxHierarchy + 1 : 1;
    roles.push({
      id: -1,
      name: t("roles.new_role_hierarchy_position"),
      hierarchy: maxHierarchy,
    });
    selected.value = -1;
    emit("update:modelValue", maxHierarchy);
  } else {
    const found = roles.find(
      (role: RoleHierarchy) => role.hierarchy === props.modelValue
    );
    if (found) {
      selected.value = found.id;
    }
  }
  return roles;
}

function dragStart(liId: number): void {
  dragging.value = true;
  iDragging.value = liId;
}

function drop(droppedPosition: number): void {
  if (iDragging.value === droppedPosition) {
    return;
  }
  if (
    availableRoles.value[droppedPosition] &&
    availableRoles.value[droppedPosition].hierarchy <= userHierarchy.value
  ) {
    return;
  }
  const roleToInsert = availableRoles.value[iDragging.value];
  if (roleToInsert === undefined) return;

  availableRoles.value.splice(iDragging.value, 1);
  availableRoles.value.splice(droppedPosition, 0, roleToInsert);
  emit("update:modelValue", droppedPosition);
}
</script>
<template>
  <ul class="slist p-1 border rounded border-neutral-300">
    <li
      v-for="(role, index) in availableRoles"
      :key="role.id"
      class="py-2 m-1 text-center rounded"
      :draggable="role.id === selected"
      :class="[
        {
          'bg-neutral-100': !dragging,
          'bg-sky-600 text-white': role.id === selected,
          'border border-dashed border-green-900':
            dragging && role.id !== selected && role.hierarchy > userHierarchy,
          'bg-green-100':
            dragging && iDragging !== index && role.hierarchy > userHierarchy,
          'bg-green-300':
            dragging && iEnter === role.id && role.hierarchy > userHierarchy,
        },
      ]"
      @dragstart="dragStart(index)"
      @dragend="dragging = false"
      @dragenter="iEnter = role.id"
      @dragover.prevent
      @drop.prevent="drop(index)"
    >
      {{ role.id === selected ? role.name + "*" : role.name }}
    </li>
  </ul>
</template>
