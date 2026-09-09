<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { FetchError } from "ofetch";
import { definePageMeta, useAsyncData, useI18n, useRoute, useSupplierModule, useToast } from "#imports";
import { PERMISSION } from "~/constants/permissions";
import type { SupplierNotePayload } from "~/types/supplier";
import { formatPeso } from "~/utils/currency-format";
import { formatDisplayDate } from "~/utils/date-format";
import useConfirmDialog from "~/composables/useConfirmDialog";

definePageMeta({ middleware: ["auth-guard"], permissions: [PERMISSION.SUPPLIERS_READ] });

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const supplierId = computed(() => Number(route.params.id));
const { fetchSupplierById, fetchSupplierNotes, fetchSupplierQuality, createSupplierNote, deleteSupplierNote } = useSupplierModule();
const isSavingNote = ref(false);
const deletingNoteId = ref<number | null>(null);
const supplierNote = reactive<SupplierNotePayload>({ rating: "good", issue_type: null, note: null });
const { data, refresh } = await useAsyncData(`supplier-quality-${supplierId.value}`, async () => {
  const [supplier, metrics, notes] = await Promise.all([
    fetchSupplierById(supplierId.value),
    fetchSupplierQuality(supplierId.value),
    fetchSupplierNotes(supplierId.value),
  ]);
  return { supplier, metrics, notes };
});

async function saveSupplierNote(): Promise<void> {
  if (!data.value || isSavingNote.value) return;
  isSavingNote.value = true;
  try {
    const created = await createSupplierNote(data.value.supplier.id, supplierNote);
    data.value.notes = [created, ...data.value.notes];
    supplierNote.rating = "good";
    supplierNote.issue_type = null;
    supplierNote.note = null;
    toast.add({ title: t("suppliers.note_saved"), color: "success" });
  } catch (error: unknown) {
    toast.add({
      title: t("common.generic_error_title"),
      description: error instanceof FetchError
        ? t("common.generic_error", { context: `${error.statusCode} - ${error.data?.message ?? error.message}` })
        : t("common.generic_unknown_error"),
      color: "error",
    });
  } finally {
    isSavingNote.value = false;
  }
}

async function removeSupplierNote(noteId: number): Promise<void> {
  if (!data.value || deletingNoteId.value !== null) return;

  const instance = confirmDialog.open({
    title: t("common.crud.confirm_delete_title"),
    message: t("suppliers.confirm_delete_note"),
  });
  if (!await instance.result) return;

  deletingNoteId.value = noteId;
  try {
    await deleteSupplierNote(data.value.supplier.id, noteId);
    await refresh();
    toast.add({ title: t("suppliers.note_deleted"), color: "success" });
  } catch (error: unknown) {
    toast.add({
      title: t("common.generic_error_title"),
      description: error instanceof FetchError
        ? t("common.generic_error", { context: `${error.statusCode} - ${error.data?.message ?? error.message}` })
        : t("common.generic_unknown_error"),
      color: "error",
    });
  } finally {
    deletingNoteId.value = null;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ $t("suppliers.quality_metrics") }}: {{ data?.supplier.name }}
      </h1>
      <p class="mt-1 text-sm text-muted">{{ $t("suppliers.quality_description") }}</p>
    </div>
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardMetricCard :label="$t('suppliers.positive_feedback')" :value="`${Number(data?.metrics.positive_feedback_percentage ?? 0).toFixed(2)}%`" icon="i-lucide-badge-check" />
      <DashboardMetricCard :label="$t('suppliers.average_rating')" :value="`${Number(data?.metrics.average_rating ?? 0).toFixed(0)}/100`" icon="i-lucide-star" />
      <DashboardMetricCard :label="$t('suppliers.rated_deliveries')" :value="String(data?.metrics.rated_deliveries ?? 0)" icon="i-lucide-clipboard-check" />
      <DashboardMetricCard :label="$t('suppliers.incidents')" :value="String(data?.metrics.feedback_incidents ?? 0)" icon="i-lucide-triangle-alert" />
    </section>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ $t("suppliers.processing_yield") }}</h2>
      </template>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="text-sm text-muted">{{ $t("suppliers.average_yield") }}</p>
          <p class="text-xl font-semibold">{{ Number(data?.metrics.average_yield_percentage ?? 0).toFixed(2) }}%</p>
        </div>
        <div>
          <p class="text-sm text-muted">{{ $t("suppliers.processing_waste_value") }}</p>
          <p class="text-xl font-semibold">{{ formatPeso(data?.metrics.processing_waste_value ?? 0) }}</p>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ $t("suppliers.quantity_quality_detail") }}</h2>
      </template>

      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <p class="text-sm text-muted">{{ $t("suppliers.acceptance_percentage") }}</p>
          <p class="text-xl font-semibold">{{ Number(data?.metrics.acceptance_percentage ?? 0).toFixed(2) }}%</p>
        </div>
        <div>
          <p class="text-sm text-muted">{{ $t("suppliers.rejected_value") }}</p>
          <p class="text-xl font-semibold">{{ formatPeso(data?.metrics.rejected_value ?? 0) }}</p>
        </div>
        <div>
          <p class="text-sm text-muted">{{ $t("suppliers.rejected_quantity") }}</p>
          <p class="text-xl font-semibold">{{ Number(data?.metrics.rejected_quantity ?? 0).toFixed(2) }}</p>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">{{ $t("suppliers.notes") }}</h2>
      </template>

      <form class="rounded-lg border border-default bg-elevated/40 p-4" @submit.prevent="saveSupplierNote">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(11rem,.75fr)_minmax(13rem,.9fr)_minmax(20rem,2fr)]">
          <UFormField :label="$t('suppliers.rating')">
            <USelect v-model="supplierNote.rating" :items="[{ label: $t('suppliers.ratings.good'), value: 'good' }, { label: $t('suppliers.ratings.regular'), value: 'regular' }, { label: $t('suppliers.ratings.bad'), value: 'bad' }]" />
          </UFormField>
          <UFormField :label="$t('suppliers.issue_type')">
            <USelect v-model="supplierNote.issue_type" :items="[{ label: $t('suppliers.no_issue'), value: null }, { label: $t('suppliers.issue_types.quality'), value: 'quality' }, { label: $t('suppliers.issue_types.shortage'), value: 'shortage' }, { label: $t('suppliers.issue_types.packaging'), value: 'packaging' }, { label: $t('suppliers.issue_types.expiration'), value: 'expiration' }, { label: $t('suppliers.issue_types.other'), value: 'other' }]" />
          </UFormField>
          <UFormField class="md:col-span-2 xl:col-span-1" :label="$t('suppliers.note')">
            <UTextarea v-model="supplierNote.note" :rows="2" autoresize :placeholder="$t('suppliers.note_placeholder')" />
          </UFormField>
        </div>
        <div class="mt-4 flex justify-end border-t border-default pt-4">
          <UButton type="submit" :loading="isSavingNote" icon="i-lucide-message-square-plus">{{ $t("suppliers.save_note") }}</UButton>
        </div>
      </form>

      <div class="mt-6">
        <h3 class="mb-3 text-sm font-semibold text-highlighted">{{ $t("suppliers.notes_history") }}</h3>
        <div class="overflow-x-auto">
        <table v-if="(data?.notes?.length ?? 0) > 0" class="w-full min-w-[680px] text-sm">
          <thead class="border-y border-default text-left text-muted">
            <tr>
              <th class="px-3 py-3 font-medium">{{ $t("suppliers.rating") }}</th>
              <th class="px-3 py-3 font-medium">{{ $t("suppliers.issue_type") }}</th>
              <th class="px-3 py-3 font-medium">{{ $t("suppliers.note") }}</th>
              <th class="px-3 py-3 text-right font-medium">{{ $t("purchases.purchase_date") }}</th>
              <th class="w-12 px-3 py-3"><span class="sr-only">{{ $t("common.action") }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="note in data.notes" :key="note.id" class="border-b border-default last:border-0">
              <td class="px-3 py-3"><UBadge :color="note.rating === 'good' ? 'success' : note.rating === 'regular' ? 'warning' : 'error'">{{ $t(`suppliers.ratings.${note.rating}`) }}</UBadge></td>
              <td class="px-3 py-3 font-medium">{{ note.issue_type ? $t(`suppliers.issue_types.${note.issue_type}`) : $t("suppliers.no_issue") }}</td>
              <td class="max-w-xl px-3 py-3 text-muted">{{ note.note || "—" }}</td>
              <td class="whitespace-nowrap px-3 py-3 text-right text-muted">{{ formatDisplayDate(note.created_at) }}</td>
              <td class="px-3 py-3 text-right"><UTooltip :text="$t('common.delete')"><UButton color="error" variant="link" icon="i-lucide-trash-2" size="sm" square :loading="deletingNoteId === note.id" :aria-label="$t('common.delete')" @click="removeSupplierNote(note.id)" /></UTooltip></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="flex flex-col items-center justify-center rounded-lg border border-dashed border-default px-6 py-8 text-center">
          <UIcon name="i-lucide-notebook-pen" class="size-6 text-muted" />
          <p class="mt-2 text-sm text-muted">{{ $t("suppliers.no_notes") }}</p>
        </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
