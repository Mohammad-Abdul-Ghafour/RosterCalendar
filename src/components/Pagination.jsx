export function Pagination({
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    onPageChange
}) {
    if (!totalPages || totalPages <= 1) {
        return null;
    }

    return (
        <div className="roster-calendar-pagination">
            <button
                className="roster-calendar-pagination-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                title="Previous page"
            >
                ◀
            </button>

            <div className="roster-calendar-pagination-info">
                <span className="roster-calendar-page-number">{currentPage}</span>
                <span className="roster-calendar-page-total">
                    {totalPages ? `of ${totalPages}` : 'of ?'}
                </span>
            </div>

            <button
                className="roster-calendar-pagination-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
                title="Next page"
            >
                ▶
            </button>
        </div>
    );
}
