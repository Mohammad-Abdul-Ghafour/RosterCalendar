import { useState, useMemo, useEffect } from "react";

export function usePagination(datasource, itemsPerPage) {
    const [currentPage, setCurrentPage] = useState(1);

    // Set offset and limit for pagination, and request total count
    useMemo(() => {
        if (datasource && datasource.setLimit && datasource.setOffset) {
            datasource.setLimit(itemsPerPage);
            datasource.setOffset((currentPage - 1) * itemsPerPage);

            if (datasource.requestTotalCount) {
                datasource.requestTotalCount(true);
            }
        }
    }, [datasource, currentPage, itemsPerPage]);

    // Calculate total pages from totalCount
    const totalPages = useMemo(() => {
        if (datasource?.totalCount != null && datasource.totalCount > 0) {
            return Math.ceil(datasource.totalCount / itemsPerPage);
        }
        return null;
    }, [datasource?.totalCount, itemsPerPage]);

    const hasNextPage = totalPages ? currentPage < totalPages : false;
    const hasPrevPage = currentPage > 1;

    const handlePageChange = (newPage) => {
        if (newPage >= 1) {
            setCurrentPage(newPage);
        }
    };

    return {
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        setCurrentPage,
        handlePageChange
    };
}
