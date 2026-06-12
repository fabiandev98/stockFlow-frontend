<script setup lang="ts">
import { z } from "zod";
import { FetchError } from "ofetch";
import type { FormSubmitEvent } from "#ui/types";
import type { Role, NewRole } from "~/types/role";
import { useRoleModule } from "~/composables/useRoleModule";
import { computed, reactive, ref, useI18n, useToast } from "#imports";
import { PERMISSION, type Permission } from "~/constants/permissions";
import RoleFormHierarchy from "./RoleFormHierarchy.vue";
import RoleFormPermissions from "./RoleFormPermissions.vue";

interface Props {
  role?: Role;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [role: Role];
}>();

const { createRole, updateRole } = useRoleModule();
const toast = useToast();
const { t } = useI18n();

const isUpdating = computed<boolean>(() => !!props.role);

const schema = z.object({
  name: z.string().min(3),
  description: z.string().nullable(),
  permissions: z
    .array(z.enum(Object.values(PERMISSION) as [Permission, ...Permission[]]))
    .min(1, t("roles.select_permissions_min_len")),
  hierarchy: z.number().min(1),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: props.role?.name ?? "",
  description: props.role?.description ?? null,
  permissions: props.role?.permissions ?? [],
  hierarchy: props.role?.hierarchy ?? -1,
});

const isSubmitting = ref<boolean>(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;

  try {
    const payload: NewRole = {
      name: event.data.name,
      description: event.data.description ?? "",
      permissions: event.data.permissions,
      hierarchy: event.data.hierarchy,
    };

    const result = isUpdating.value
      ? await updateRole(props.role!.id, payload)
      : await createRole(payload);

    toast.add({
      title: t(
        isUpdating.value
          ? "common.crud.resource_updated"
          : "common.crud.resource_created",
        { resource: result.name }
      ),
      color: "success",
    });

    emit("success", result);

    if (!isUpdating.value) {
      Object.assign(state, {
        name: "",
        description: null,
        permissions: [],
        hierarchy: -1,
      });
    }
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      toast.add({
        title: t("common.generic_error_title"),
        description: t("forms.generic_error", {
          context: error.statusCode,
        }),
        color: "error",
      });
    } else {
      toast.add({
        title: t("common.generic_error_title"),
        description: t("forms.generic_unknown_error"),
        color: "error",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit">
    <UFormField :label="$t('roles.name')" name="name" class="mb-4" required>
      <UInput v-model="state.name" class="w-full" />
    </UFormField>

    <UFormField
      :label="$t('roles.description')"
      name="description"
      class="mb-4"
    >
      <UTextarea v-model="state.description" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6">
      <div class="md:col-span-8">
        <RoleFormPermissions v-model="state.permissions" name="permissions" />
      </div>

      <div class="md:col-span-4">
        <UFormField
          :label="$t('roles.select_hierarchy')"
          name="hierarchy"
          required
        >
          <RoleFormHierarchy v-model="state.hierarchy" :updating="isUpdating" />
        </UFormField>
      </div>
    </div>

    <UButton type="submit" :loading="isSubmitting" class="mt-6">
      {{ $t("common.submit") }}
    </UButton>
  </UForm>
</template>
