import { useState, useMemo } from "react";
import classNames from "classnames";
import "./ui/RosterCalendar.css";

export function RosterCalendar({
    defaultView,
    showWeekends,
    usersDataSource,
    userNameAttr,
    rosterPatternsDataSource,
    patternStartDateAttr,
    patternEndDateAttr,
    patternUserRef,
    patternDaysDataSource,
    patternDayOfWeekAttr,
    patternDayPatternRef,
    patternDayAvailableAttr,
    rosterDaysDataSource,
    rosterDayDateAttr,
    rosterDayUserRef,
    rosterDayHoursAttr,
    rosterDayTypeAttr,
    onCellClick,
    height
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState(defaultView);

    const dateRange = useMemo(() => {
        return generateDateRange(currentDate, viewMode, showWeekends);
    }, [currentDate, viewMode, showWeekends]);

    const users = useMemo(() => {
        if (!usersDataSource || usersDataSource.status !== "available") return [];
        return usersDataSource.items.map(item => ({
            id: item.id,
            name: userNameAttr?.get(item).value || "Unnamed User"
        }));
    }, [usersDataSource, userNameAttr]);

    const rosterPatterns = useMemo(() => {
        if (!rosterPatternsDataSource || rosterPatternsDataSource.status !== "available") return [];
        return rosterPatternsDataSource.items.map(item => {
            // Get user object from association and extract ID
            const userObj = patternUserRef?.get(item).value;
            const userId = userObj?.id || null;

            return {
                id: item.id,
                userId,
                startDate: patternStartDateAttr?.get(item).value,
                endDate: patternEndDateAttr?.get(item).value
            };
        });
    }, [rosterPatternsDataSource, patternUserRef, patternStartDateAttr, patternEndDateAttr]);

    const patternDays = useMemo(() => {
        if (!patternDaysDataSource || patternDaysDataSource.status !== "available") return [];
        return patternDaysDataSource.items.map(item => {
            // Convert day of week to primitive
            const dayOfWeekValue = patternDayOfWeekAttr?.get(item).value;
            const dayOfWeek = normalizeDayOfWeek(dayOfWeekValue);

            // Convert available to boolean
            const availableValue = patternDayAvailableAttr?.get(item).value;
            const available = normalizeAvailability(availableValue);

            // Get pattern object from association and extract ID
            const patternObj = patternDayPatternRef?.get(item).value;
            const patternId = patternObj?.id || null;

            return {
                id: item.id,
                patternId,
                dayOfWeek,
                available
            };
        });
    }, [patternDaysDataSource, patternDayPatternRef, patternDayOfWeekAttr, patternDayAvailableAttr]);

    const rosterDays = useMemo(() => {
        if (!rosterDaysDataSource || rosterDaysDataSource.status !== "available") return [];
        return rosterDaysDataSource.items.map(item => {
            // Get user object from association and extract ID
            const userObj = rosterDayUserRef?.get(item).value;
            const userId = userObj?.id || null;

            // Convert hours to number (handle BigNumber or other objects)
            const hoursValue = rosterDayHoursAttr?.get(item).value;
            const hours = hoursValue != null ? Number(hoursValue) : null;

            // Convert type to string
            const typeValue = rosterDayTypeAttr?.get(item).value;
            const type = typeValue != null ? String(typeValue) : null;

            return {
                id: item.id,
                userId,
                date: rosterDayDateAttr?.get(item).value,
                hours,
                type
            };
        });
    }, [rosterDaysDataSource, rosterDayUserRef, rosterDayDateAttr, rosterDayHoursAttr, rosterDayTypeAttr]);

    const calendarData = useMemo(() => {
        return buildCalendarData(users, dateRange, rosterPatterns, patternDays, rosterDays);
    }, [users, dateRange, rosterPatterns, patternDays, rosterDays]);

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

    const handleCellClick = (user, date, cellData) => {
        if (onCellClick && onCellClick.canExecute) {
            onCellClick.execute();
        }
    };

    const handleViewToggle = () => {
        setViewMode(viewMode === "week" ? "month" : "week");
    };

    if (!usersDataSource || usersDataSource.status === "loading") {
        return <div className="roster-calendar-loading">Loading...</div>;
    }

    return (
        <div className="roster-calendar-container" style={{ height }}>
            <div className="roster-calendar-header">
                <div className="roster-calendar-nav">
                    <button className="roster-calendar-btn" onClick={handlePrevious} title="Previous">
                        ◀
                    </button>
                    <span className="roster-calendar-title">
                        {formatDateRangeTitle(currentDate, viewMode)}
                    </span>
                    <button className="roster-calendar-btn" onClick={handleNext} title="Next">
                        ▶
                    </button>
                </div>
                <button className="roster-calendar-btn roster-calendar-view-toggle" onClick={handleViewToggle}>
                    {viewMode === "week" ? "Month View" : "Week View"}
                </button>
            </div>

            <div className="roster-calendar-grid-wrapper">
                <table className="roster-calendar-table">
                    <thead>
                        <tr>
                            <th className="roster-calendar-user-header">User</th>
                            {dateRange.map(date => (
                                <th key={date.toISOString()} className="roster-calendar-date-header">
                                    <div className="roster-calendar-date-label">
                                        <div className="roster-calendar-day-name">{formatDayName(date)}</div>
                                        <div className="roster-calendar-day-number">{date.getDate()}</div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {calendarData.map(userRow => (
                            <tr key={userRow.userId}>
                                <td className="roster-calendar-user-cell">
                                    <span className="roster-calendar-user-name">{userRow.userName}</span>
                                </td>
                                {userRow.days.map((dayCell, idx) => (
                                    <td
                                        key={idx}
                                        className={classNames("roster-calendar-day-cell", {
                                            "is-weekend": dayCell.isWeekend,
                                            "is-past": dayCell.isPast,
                                            "is-today": dayCell.isToday,
                                            "has-pattern": dayCell.hasPattern,
                                            "has-actual": dayCell.hasActual
                                        })}
                                        onClick={() => handleCellClick(userRow, dayCell.date, dayCell)}
                                    >
                                        <CellContent cell={dayCell} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CellContent({ cell }) {
    if (cell.hasActual) {
        // Ensure type is a string
        const typeStr = String(cell.actualType || "work").toLowerCase();
        const typeLabel = String(cell.actualType || "Work");

        // Ensure hours is a number
        const hoursNum = Number(cell.hours);

        return (
            <div className="roster-calendar-cell-content">
                <div className={`roster-calendar-cell-type type-${typeStr}`}>
                    {typeLabel}
                </div>
                {!isNaN(hoursNum) && (
                    <div className="roster-calendar-cell-hours">{hoursNum}h</div>
                )}
            </div>
        );
    }

    if (cell.hasPattern) {
        return (
            <div className="roster-calendar-cell-content">
                <div
                    className={`roster-calendar-cell-type type-${
                        cell.patternAvailable ? "scheduled" : "off"
                    }`}
                >
                    {cell.patternAvailable ? "Available" : "Off"}
                </div>
            </div>
        );
    }

    return <div className="roster-calendar-cell-content roster-calendar-cell-empty" />;
}

function generateDateRange(currentDate, viewMode, showWeekends) {
    const dates = [];
    let startDate;

    if (viewMode === "week") {
        startDate = getStartOfWeek(currentDate);
        const daysToShow = showWeekends ? 7 : 5;
        for (let i = 0; i < daysToShow; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            if (showWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) {
                dates.push(date);
            }
        }
    } else {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const date = new Date(d);
            if (showWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) {
                dates.push(date);
            }
        }
    }

    return dates;
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDateRangeTitle(currentDate, viewMode) {
    if (viewMode === "week") {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const startMonth = startOfWeek.toLocaleDateString("en-US", { month: "short" });
        const endMonth = endOfWeek.toLocaleDateString("en-US", { month: "short" });
        const year = currentDate.getFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${year}`;
        } else {
            return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`;
        }
    } else {
        return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
}

function formatDayName(date) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
}

function buildCalendarData(users, dateRange, rosterPatterns, patternDays, rosterDays) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return users.map(user => {
        const userPatterns = rosterPatterns.filter(p => p.userId === user.id);

        const days = dateRange.map(date => {
            const dateKey = formatDateKey(date);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();

            // Priority 1: Check for actual roster day data
            const actualDay = rosterDays.find(
                rd => rd.userId === user.id && formatDateKey(rd.date) === dateKey
            );

            // Priority 2: Check for pattern-based schedule
            let patternDay = null;
            let patternAvailable = false;

            for (const pattern of userPatterns) {
                if (isDateInRange(date, pattern.startDate, pattern.endDate)) {
                    // Find the pattern day for this day of week
                    const matchingPatternDay = patternDays.find(
                        pd => pd.patternId === pattern.id && pd.dayOfWeek === dayOfWeek
                    );

                    if (matchingPatternDay) {
                        patternDay = matchingPatternDay;
                        patternAvailable = matchingPatternDay.available;
                        break;
                    }
                }
            }

            return {
                date,
                dateKey,
                isWeekend,
                isPast,
                isToday,
                hasActual: !!actualDay,
                hasPattern: !!patternDay,
                actualType: actualDay?.type,
                hours: actualDay?.hours,
                patternAvailable,
                patternStatus: patternAvailable ? "available" : "off"
            };
        });

        return {
            userId: user.id,
            userName: user.name,
            days
        };
    });
}

function isDateInRange(date, startDate, endDate) {
    if (!startDate || !endDate) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
}

function formatDateKey(date) {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeDayOfWeek(value) {
    if (typeof value === "number") return value;
    if (!value) return null;

    const valueStr = String(value).toLowerCase();

    const dayMap = {
        sunday: 0,
        sun: 0,
        monday: 1,
        mon: 1,
        tuesday: 2,
        tue: 2,
        wednesday: 3,
        wed: 3,
        thursday: 4,
        thu: 4,
        friday: 5,
        fri: 5,
        saturday: 6,
        sat: 6
    };

    return dayMap[valueStr] !== undefined ? dayMap[valueStr] : null;
}

function normalizeAvailability(value) {
    if (typeof value === "boolean") return value;
    if (value === null || value === undefined) return false;

    const valueStr = String(value).toLowerCase();

    const trueValues = ["true", "available", "yes", "1", "work", "working"];
    const falseValues = ["false", "unavailable", "no", "0", "off", "not available"];

    if (trueValues.includes(valueStr)) return true;
    if (falseValues.includes(valueStr)) return false;

    return false;
}
