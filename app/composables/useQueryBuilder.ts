interface QueryBuilderParams {
  page?: number;
  filters?: Record<string, string | number | boolean>;
  sort?: string;
}

export default function useQueryBuilder() {
  function buildQueryString(params: QueryBuilderParams): string {
    const searchParams = new URLSearchParams();

    // Pagination
    if (params.page && params.page > 1) {
      searchParams.append("page", params.page.toString());
    }

    // Filters: filter[field]=value
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          searchParams.append(`filter[${key}]`, String(value));
        }
      });
    }

    // Sort: sort=field o sort=-field (desc)
    if (params.sort) {
      searchParams.append("sort", params.sort);
    }

    return searchParams.toString();
  }

  function parseQueryString(
    queryString: string | Record<string, unknown>
  ): QueryBuilderParams {
    const params: QueryBuilderParams = {};

    const searchParams =
      typeof queryString === "string"
        ? new URLSearchParams(queryString)
        : new URLSearchParams(
            Object.entries(queryString)
              .map(([key, value]) => `${key}=${value}`)
              .join("&")
          );

    // Parse pagination
    const pageNumber = searchParams.get("page");
    if (pageNumber) {
      params.page = parseInt(pageNumber, 10);
    }

    // Parse filters
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      const filterMatch = key.match(/^filter\[(.+)\]$/);
      if (filterMatch && filterMatch[1]) {
        filters[filterMatch[1]] = value;
      }
    });
    if (Object.keys(filters).length > 0) {
      params.filters = filters;
    }

    // Parse sort
    const sort = searchParams.get("sort");
    if (sort) {
      params.sort = sort;
    }

    return params;
  }

  return {
    buildQueryString,
    parseQueryString,
  };
}
