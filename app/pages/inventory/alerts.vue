<script setup lang="ts">
import {
  definePageMeta,
  useAsyncData,
  useInventoryModule,
} from "#imports";
import { PERMISSION } from "~/constants/permissions";
import type { InventoryMaterial, InventoryStockBatch } from "~/types/inventory";
import { formatDisplayDate } from "~/utils/date-format";

definePageMeta({
  middleware: ["auth-guard"],
  permissions: [PERMISSION.INVENTORY_READ],
});

const { fetchInventoryAlerts } = useInventoryModule();

const { data } = await useAsyncData("inventory-alerts", () =>
  fetchInventoryAlerts()
);

function quantity(value: string | number | null | undefined, unit?: string): string {
  const amount = Number(value ?? 0).toFixed(2);
  return unit ? `${amount} ${unit}` : amount;
}

function batchMaterial(batch: InventoryStockBatch): string {
  return batch.material?.name ?? `#${batch.material_id}`;
}

function materialStock(material: InventoryMaterial): string {
  return quantity(material.available_stock, material.unit);
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">
        {{ $t("inventory.alerts") }}
      </h1>
      <p class="text-sm text-neutral-500">
        {{ $t("inventory.alerts_description") }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("inventory.low_stock") }}
        </p>
        <p class="text-2xl font-semibold">
          {{ data?.low_stock_materials.length ?? 0 }}
        </p>
      </div>

      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("inventory.expired_batches") }}
        </p>
        <p class="text-2xl font-semibold">
          {{ data?.expired_batches.length ?? 0 }}
        </p>
      </div>

      <div class="border border-neutral-200 rounded p-4">
        <p class="text-xs text-neutral-500">
          {{ $t("inventory.expiring_batches") }}
        </p>
        <p class="text-2xl font-semibold">
          {{ data?.expiring_batches.length ?? 0 }}
        </p>
      </div>
    </div>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">
        {{ $t("inventory.low_stock_materials") }}
      </h2>

      <div class="border border-neutral-200 rounded divide-y divide-neutral-200">
        <div
          v-for="material in data?.low_stock_materials ?? []"
          :key="material.id"
          class="grid grid-cols-1 md:grid-cols-4 gap-3 p-3"
        >
          <p class="font-medium">
            {{ material.name }}
          </p>
          <p class="text-sm text-neutral-600">
            {{ material.category?.name ?? "-" }}
          </p>
          <p class="text-sm">
            {{ $t("inventory.available_stock") }}: {{ materialStock(material) }}
          </p>
          <p class="text-sm">
            {{ $t("materials.minimum_stock") }}:
            {{ quantity(material.minimum_stock, material.unit) }}
          </p>
        </div>

        <p
          v-if="!data?.low_stock_materials.length"
          class="p-3 text-sm text-neutral-500"
        >
          {{ $t("inventory.no_low_stock_alerts") }}
        </p>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">
        {{ $t("inventory.expired_batches") }}
      </h2>

      <div class="border border-neutral-200 rounded divide-y divide-neutral-200">
        <div
          v-for="batch in data?.expired_batches ?? []"
          :key="batch.id"
          class="grid grid-cols-1 md:grid-cols-4 gap-3 p-3"
        >
          <p class="font-medium">
            #{{ batch.id }} - {{ batchMaterial(batch) }}
          </p>
          <p class="text-sm">
            {{ quantity(batch.available_quantity, batch.material?.unit) }}
          </p>
          <p class="text-sm text-red-600">
            {{ formatDisplayDate(batch.expiration_date) }}
          </p>
          <p class="text-sm text-neutral-600">
            {{ batch.purchase_item?.purchase?.supplier?.name ?? "-" }}
          </p>
        </div>

        <p
          v-if="!data?.expired_batches.length"
          class="p-3 text-sm text-neutral-500"
        >
          {{ $t("inventory.no_expired_alerts") }}
        </p>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-medium">
        {{ $t("inventory.expiring_batches") }}
      </h2>

      <div class="border border-neutral-200 rounded divide-y divide-neutral-200">
        <div
          v-for="batch in data?.expiring_batches ?? []"
          :key="batch.id"
          class="grid grid-cols-1 md:grid-cols-4 gap-3 p-3"
        >
          <p class="font-medium">
            #{{ batch.id }} - {{ batchMaterial(batch) }}
          </p>
          <p class="text-sm">
            {{ quantity(batch.available_quantity, batch.material?.unit) }}
          </p>
          <p class="text-sm">
            {{ formatDisplayDate(batch.expiration_date) }}
          </p>
          <p class="text-sm text-neutral-600">
            {{ batch.purchase_item?.purchase?.supplier?.name ?? "-" }}
          </p>
        </div>

        <p
          v-if="!data?.expiring_batches.length"
          class="p-3 text-sm text-neutral-500"
        >
          {{ $t("inventory.no_expiring_alerts") }}
        </p>
      </div>
    </section>
  </div>
</template>
