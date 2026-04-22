import { useState } from "react";

export function usePagination(defaultPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    queryParams: { page, pageSize },
  };
}
