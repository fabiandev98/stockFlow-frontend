<script setup lang="ts">
import * as z from "zod";
import { computed, reactive, ref, useTemplateRef } from "vue";
import { useAuth, useI18n, useUserModule } from "#imports";
import type { FormSubmitEvent } from "@nuxt/ui";
import { FetchError } from "ofetch";
import { HTTP_STATUS } from "~/constants/http-statuses";
import type { User } from "~/types/user";
import type { Role } from "~/types/role";
import type {
  UserFormMode,
  UserFormData,
  CreateUserPayload,
  UpdateUserPayload,
} from "~/types/user-form";

const props = defineProps<{
  mode: UserFormMode;
  user?: User;
  showRoleField: boolean;
  availableRoles?: Role[];
  submitButtonText?: string;
}>();

const emit = defineEmits<{
  "submit-success": [data: User];
  "submit-error": [error: unknown];
}>();

const { t } = useI18n();

const schema = computed(() => {
  const baseSchema = {
    name: z.string().min(1, t("users.name_required")),
    email: z.email(t("auth.invalid_email")),
  };

  if (props.mode === "register" || props.mode === "create") {
    return z.object({
      ...baseSchema,
      password: z.string().min(8, t("auth.password_min_len")),
      password_confirmation: z.string().min(8, t("users.password_min_8")),
      ...(props.showRoleField && {
        role_id: z.number(t("users.role_required")).min(1),
      }),
    });
  }

  return z.object({
    ...baseSchema,
    ...(props.showRoleField && {
      role_id: z.number(t("users.role_required")).min(1),
    }),
  });
});

const state = reactive<Partial<UserFormData>>({
  name: props.user?.name,
  email: props.user?.email,
  role_id: props.user?.role?.id,
  password: undefined,
  password_confirmation: undefined,
});

const form = useTemplateRef("userForm");
const isSubmitting = ref<boolean>(false);

const buttonText = computed(() => {
  if (props.submitButtonText) return props.submitButtonText;

  switch (props.mode) {
    case "register":
      return t("auth.submit");
    case "create":
      return t("users.create_user");
    case "edit":
      return t("common.save_changes");
    default:
      return t("common.submit");
  }
});

async function handleSubmit(
  event: FormSubmitEvent<z.infer<typeof schema.value>>
) {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    const { createUser, updateUser } = useUserModule();

    let result: User;

    if (props.mode === "register") {
      const { register } = useAuth();
      result = await register(event.data as CreateUserPayload);
    } else if (props.mode === "create") {
      result = await createUser(event.data as CreateUserPayload);
    } else {
      if (!props.user?.id) {
        throw new Error("User ID is required for update");
      }
      result = await updateUser(props.user.id, event.data as UpdateUserPayload);
    }

    emit("submit-success", result);
  } catch (error: unknown) {
    emit("submit-error", error);

    if (!(error instanceof FetchError)) {
      form.value?.setErrors([
        { name: "email", message: t("common.generic_unknown_error") },
      ]);
      return;
    }

    if (error.statusCode === HTTP_STATUS.UNPROCESSABLE_CONTENT) {
      const backendErrors = error.data?.errors || {};

      const formErrors = Object.entries(backendErrors).map(
        ([field, messages]) => ({
          name: field,
          message: Array.isArray(messages) ? messages[0] : messages,
        })
      );

      if (formErrors.length > 0) {
        form.value?.setErrors(formErrors);
      }
    } else {
      form.value?.setErrors([
        { name: "email", message: t("common.generic_unknown_error") },
      ]);
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UForm
    ref="userForm"
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="handleSubmit"
  >
    <UFormField name="name" :label="$t('users.name')">
      <UInput
        v-model="state.name"
        :placeholder="$t('users.name_placeholder')"
        class="w-full"
      />
    </UFormField>

    <UFormField name="email" :label="$t('auth.email')">
      <UInput
        v-model="state.email"
        type="email"
        :placeholder="$t('auth.email_placeholder')"
        class="w-full"
      />
    </UFormField>

    <template v-if="mode === 'register' || mode === 'create'">
      <UFormField name="password" :label="$t('auth.password')">
        <UInput
          v-model="state.password"
          type="password"
          :placeholder="$t('auth.password_placeholder')"
          class="w-full"
        />
      </UFormField>

      <UFormField
        name="password_confirmation"
        :label="$t('auth.password_confirmation')"
      >
        <UInput
          v-model="state.password_confirmation"
          type="password"
          class="w-full"
        />
      </UFormField>
    </template>

    <UFormField
      v-if="showRoleField && availableRoles"
      name="role_id"
      :label="$t('users.role')"
    >
      <USelect
        v-model="state.role_id"
        :items="availableRoles"
        value-key="id"
        label-key="name"
        :placeholder="$t('users.select_role')"
        class="w-full"
      />
    </UFormField>

    <UButton
      :loading="isSubmitting"
      type="submit"
      color="brand"
      block
      class="mt-2"
    >
      {{ buttonText }}
    </UButton>
  </UForm>
</template>
