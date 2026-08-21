import { useState, useMemo } from "react";
import { usePagination } from "./hooks/usePagination";
import { useSearch } from "./hooks/useSearch";
import { useRosterData } from "./hooks/useRosterData";
import { generateDateRange, formatDateRangeTitle, formatDayName } from "./utils/dateUtils";
import { buildCalendarData } from "./utils/dataUtils";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarTable } from "./components/CalendarTable";
import { Pagination } from "./components/Pagination";
import "./ui/RosterCalendar.css";

export function RosterCalendar({
    defaultView,
    showWeekends,
    pageSize,
    heightType,
    height,
    usersDataSource,
    userNameAttr,
    patternEntityName,
    patternUserXPath,
    patternUserPath,
    patternStartDateAttr,
    patternEndDateAttr,
    patternDayEntityName,
    patternDayPatternAssociation,
    patternDayOfWeekAttr,
    patternDayAvailableAttr,
    patternDayWorkingHoursAttr,
    patternDayStartTimeAttr,
    patternDayEndTimeAttr,
    rosterDayEntityName,
    rosterDayUserXPath,
    rosterDayUserPath,
    rosterDayDateAttr,
    rosterDayTypeAttr,
    rosterDayOffStartTimeAttr,
    rosterDayOffEndTimeAttr,
    rosterDayOffHoursAttr,
    rosterDayIsPartTimeAttr,
    rosterDayWorkingHoursAttr,
    rosterDayWorkStartTimeAttr,
    rosterDayWorkEndTimeAttr,
    onCellClick
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState(defaultView);

    const itemsPerPage = pageSize || 10;

    // Custom hooks
    const {
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        setCurrentPage,
        handlePageChange
    } = usePagination(usersDataSource, itemsPerPage);

    const { searchText, setSearchText } = useSearch(usersDataSource, userNameAttr, setCurrentPage);

    // Date range
    const dateRange = useMemo(() => {
        return generateDateRange(currentDate, viewMode, showWeekends);
    }, [currentDate, viewMode, showWeekends]);

    // Users from datasource
    const users = useMemo(() => {
        if (!usersDataSource || usersDataSource.status !== "available") return [];

        return usersDataSource.items.map(item => ({
            id: item.id,
            name: userNameAttr?.get(item).value || "Unnamed User"
        }));
    }, [usersDataSource, userNameAttr]);

    const currentPageUserIds = useMemo(() => {
        return users.map(u => u.id);
    }, [users]);

    // Fetch roster data
    const { rosterPatterns, patternDays, rosterDays } = useRosterData(
        currentPageUserIds,
        dateRange,
        patternEntityName,
        patternUserXPath,
        patternUserPath,
        patternStartDateAttr,
        patternEndDateAttr,
        patternDayEntityName,
        patternDayPatternAssociation,
        patternDayOfWeekAttr,
        patternDayAvailableAttr,
        patternDayWorkingHoursAttr,
        patternDayStartTimeAttr,
        patternDayEndTimeAttr,
        rosterDayEntityName,
        rosterDayUserXPath,
        rosterDayUserPath,
        rosterDayDateAttr,
        rosterDayTypeAttr,
        rosterDayOffStartTimeAttr,
        rosterDayOffEndTimeAttr,
        rosterDayOffHoursAttr,
        rosterDayIsPartTimeAttr,
        rosterDayWorkingHoursAttr,
        rosterDayWorkStartTimeAttr,
        rosterDayWorkEndTimeAttr
    );

    // Build calendar data
    const calendarData = useMemo(() => {
        return buildCalendarData(users, dateRange, rosterPatterns, patternDays, rosterDays);
    }, [users, dateRange, rosterPatterns, patternDays, rosterDays]);

    // Event handlers
    const handlePrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleViewToggle = () => {
        setViewMode(viewMode === "week" ? "month" : "week");
    };

    const handleCellClick = () => {
        if (onCellClick && onCellClick.canExecute) {
            onCellClick.execute();
        }
    };

    // Loading state
    if (!usersDataSource || usersDataSource.status === "loading") {
        return <div className="roster-calendar-loading">Loading users...</div>;
    }

    const containerStyle = heightType === "auto" ? {} : { height };

    return (
        <div className="roster-calendar-container" style={containerStyle}>
            <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                searchText={searchText}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onViewToggle={handleViewToggle}
                onSearchChange={setSearchText}
                formatDateRangeTitle={formatDateRangeTitle}
            />

            <CalendarTable
                calendarData={calendarData}
                dateRange={dateRange}
                onCellClick={handleCellClick}
                formatDayName={formatDayName}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
