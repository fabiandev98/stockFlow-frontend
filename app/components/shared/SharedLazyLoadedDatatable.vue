<script setup lang="ts" generic="T extends object">
import {
  computed,
  createError,
  useAsyncData,
  useI18n,
  useQueryBuilder,
  useRoute,
  useRouter,
} from "#imports";
import type { TableColumn, TableRow } from "@nuxt/ui";
import { HTTP_STATUS } from "~/constants/http-statuses";
import type { LaravelPaginationWrapper } from "~/types/pagination";
import { h, ref, watch } from "vue";
import { UButton } from "#components";

interface Props {
  columns: TableColumn<T>[];
  fetchFunction: (params: {
    page?: number;
    filters?: Record<string, string | number | boolean>;
    sort?: string;
  }) => Promise<LaravelPaginationWrapper<T>>;
  dataKey: string;
  emptyMessage: string;
  expandable?: boolean;
  isExpandableRow?: (row: T) => boolean;
  globalFilterEnabled?: boolean;
}

const props = defineProps<Props>();

type SortDirection = false | "asc" | "desc";

interface SortableColumnApi {
  getIsSorted: () => SortDirection;
  toggleSorting: (desc: boolean) => void;
}

function isSortableColumnApi(value: unknown): value is SortableColumnApi {
  return (
    typeof value === "object" &&
    value !== null &&
    "getIsSorted" in value &&
    typeof value.getIsSorted === "function" &&
    "toggleSorting" in value &&
    typeof value.toggleSorting === "function"
  );
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { parseQueryString } = useQueryBuilder();
const expanded = ref({});

/**
 * Global filter
 */
const globalFilter = ref<string>(
  (route.query["filter[global]"] as string) || ""
);

function updateGlobalFilter(value: string): void {
  globalFilter.value = value;

  const query = { ...route.query };

  if (value) {
    query["filter[global]"] = value;
  } else {
    delete query["filter[global]"];
  }

  // Reset to page 1 when filtering
  delete query.page;

  router.push({ query });
}

/**
 * Sorting
 */
const initialSortParam = route.query.sort as string | undefined;
const sorting = ref<Array<{ id: string; desc: boolean }>>(
  initialSortParam
    ? [
        {
          id: initialSortParam.startsWith("-")
            ? initialSortParam.slice(1)
            : initialSortParam,
          desc: initialSortParam.startsWith("-"),
        },
      ]
    : []
);

watch(
  sorting,
  (value) => {
    const query = { ...route.query };

    if (!value.length) {
      delete query.sort;
    } else {
      const sortItem = value[0];
      if (sortItem) {
        const { id, desc } = sortItem;
        query.sort = `${desc ? "-" : ""}${id}`;
      }
    }

    delete query.page;
    router.push({ query });
  },
  { deep: true }
);

function sortableHeader(column: unknown, label: string) {
  if (!isSortableColumnApi(column)) return label;

  const sorted = column.getIsSorted();

  return h(UButton, {
    variant: "ghost",
    label,
    class: "-mx-2",
    icon: sorted
      ? sorted === "asc"
        ? "i-lucide-arrow-up"
        : "i-lucide-arrow-down"
      : "i-lucide-arrow-up-down",
    onClick: () => column.toggleSorting(sorted !== "desc"),
  });
}

/**
 * Query params
 */
const queryParams = computed<{
  page?: number;
  filters?: Record<string, string | number | boolean>;
  sort?: string;
}>(() => {
  const params = parseQueryString(route.query);

  // Add global filter to filters if it exists
  if (globalFilter.value) {
    params.filters = {
      ...params.filters,
      global: globalFilter.value,
    };
  }

  return params;
});

/**
 * Data fetching
 */
const { data, pending, error, refresh } = await useAsyncData<
  LaravelPaginationWrapper<T>
>(props.dataKey, () => props.fetchFunction(queryParams.value), {
  watch: [queryParams],
});

if (error.value || data.value === null) {
  throw createError({
    statusCode: error.value?.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR,
    statusMessage: error.value?.statusMessage ?? "Internal Server Error",
    message: t("common.generic_error", {
      context: error.value?.message ?? "",
    }),
  });
}

/**
 * Pagination
 */
const currentPage = computed<number>(() => data.value?.meta.current_page ?? 1);
const totalPages = computed<number>(() => data.value?.meta.last_page ?? 1);

function goToPage(page: number): void {
  router.push({
    query: {
      ...route.query,
      page: page > 1 ? page.toString() : undefined,
    },
  });
}

/**
 * Column normalization - add sorting capabilities if enabled
 */
const computedColumns = computed(() => {
  const cols = props.columns.map((col) => {
    if (col.enableSorting !== true) return col;
    if (!("accessorKey" in col) || !col.accessorKey) return col;

    return {
      ...col,
      header:
        typeof col.header === "function"
          ? col.header
          : ({ column }: { column: unknown }) =>
              sortableHeader(column, String(col.header ?? col.accessorKey)),
    };
  });

  if (props.expandable) {
    cols.unshift({
      id: "expand",
      cell: ({ row }: { row: TableRow<T> }) => {
        const isExpandable =
          !props.isExpandableRow || props.isExpandableRow(row.original);

        if (!isExpandable) return null;

        return h(UButton, {
          color: "neutral",
          variant: "ghost",
          icon: "i-lucide-chevron-down",
          square: true,
          onClick: () => row.toggleExpanded(),
          ui: {
            leadingIcon: [
              "transition-transform",
              row.getIsExpanded() ? "duration-200 rotate-180" : "",
            ],
          },
        } as never);
      },
    } as never);
  }

  return cols;
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <div class="w-auto">
        <slot name="header" />
      </div>
      <UInput
        v-if="globalFilterEnabled"
        :model-value="globalFilter"
        class="w-full md:w-100"
        :placeholder="t('common.filter')"
        @update:model-value="updateGlobalFilter"
      />
    </div>
    <UTable
      :key="currentPage"
      v-model:expanded="expanded"
      v-model:sorting="sorting"
      :columns="computedColumns"
      :data="data?.data ?? []"
      :loading="pending"
    >
      <!-- Empty state -->
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-12">
          <span class="text-sm text-gray-500">{{ emptyMessage }}</span>
        </div>
      </template>

      <!-- Expandable row content -->
      <template v-if="expandable" #expanded="{ row }">
        <slot name="expanded" :row="row" :refresh="refresh" />
      </template>

      <!-- Pass all slots dynamicly -->
      <template v-for="(_, name) in $slots" #[name]="slotData" :key="name">
        <slot :name="name" v-bind="{ ...slotData, refresh }" />
      </template>
    </UTable>

    <div
      v-if="data && totalPages > 1"
      class="flex justify-between items-center"
    >
      <div class="text-sm text-gray-500">
        {{
          $t("common.pagination_results", {
            from: data.meta.from ?? 0,
            to: data.meta.to ?? 0,
            total: data.meta.total ?? 0,
          })
        }}
      </div>
      <UPagination
        :page="currentPage"
        :items-per-page="data.meta.per_page"
        :total="data.meta.total"
        @update:page="goToPage"
      />
    </div>
  </div>
</template>
