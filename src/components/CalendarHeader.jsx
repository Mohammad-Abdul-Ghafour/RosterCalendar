export function CalendarHeader({
    currentDate,
    viewMode,
    searchText,
    onPrevious,
    onNext,
    onViewToggle,
    onSearchChange,
    formatDateRangeTitle
}) {
    return (
        <div className="roster-calendar-header">
            <div className="roster-calendar-nav">
                <button className="roster-calendar-btn" onClick={onPrevious} title="Previous">
                    ◀
                </button>
                <span className="roster-calendar-title">
                    {formatDateRangeTitle(currentDate, viewMode)}
                </span>
                <button className="roster-calendar-btn" onClick={onNext} title="Next">
                    ▶
                </button>
            </div>
            <div className="roster-calendar-header-actions">
                <input
                    type="text"
                    className="roster-calendar-search"
                    placeholder="Search users..."
                    value={searchText}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                <button className="roster-calendar-btn roster-calendar-view-toggle" onClick={onViewToggle}>
                    {viewMode === "week" ? "Month View" : "Week View"}
                </button>
            </div>
        </div>
    );
}
