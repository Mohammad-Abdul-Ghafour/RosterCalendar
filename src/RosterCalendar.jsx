import { useState, useMemo, useEffect } from "react";
import classNames from "classnames";
import "./ui/RosterCalendar.css";

export function RosterCalendar({
    defaultView,
    showWeekends,
    pageSize,
    heightType,
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
    rosterDayEntityName,
    rosterDayUserXPath,
    rosterDayUserPath,
    rosterDayDateAttr,
    rosterDayHoursAttr,
    rosterDayTypeAttr,
    onCellClick,
    height
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState(defaultView);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastKnownPage, setLastKnownPage] = useState(null);
    const [rosterPatterns, setRosterPatterns] = useState([]);
    const [patternDays, setPatternDays] = useState([]);
    const [rosterDays, setRosterDays] = useState([]);
    const [loading, setLoading] = useState(false);

    const dateRange = useMemo(() => {
        return generateDateRange(currentDate, viewMode, showWeekends);
    }, [currentDate, viewMode, showWeekends]);

    const itemsPerPage = pageSize || 10;

    // Set offset and limit for pagination - request one extra to detect if there are more pages
    useMemo(() => {
        if (usersDataSource && usersDataSource.setLimit && usersDataSource.setOffset) {
            usersDataSource.setLimit(itemsPerPage + 1);
            usersDataSource.setOffset((currentPage - 1) * itemsPerPage);
        }
    }, [usersDataSource, currentPage, itemsPerPage]);

    // Check if there are more pages by seeing if we got extra item
    const hasNextPage = usersDataSource?.items?.length > itemsPerPage;
    const hasPrevPage = currentPage > 1;

    // Track the last page (when we find a page with no next page)
    useMemo(() => {
        if (!hasNextPage && usersDataSource?.status === "available") {
            if (lastKnownPage === null || currentPage > lastKnownPage) {
                setLastKnownPage(currentPage);
            }
        }
    }, [hasNextPage, currentPage, usersDataSource, lastKnownPage]);

    // Calculate total pages
    const totalPages = lastKnownPage !== null ? lastKnownPage : (hasNextPage ? null : currentPage);

    const users = useMemo(() => {
        if (!usersDataSource || usersDataSource.status !== "available") return [];

        console.log("📊 [RosterCalendar] Users Data Source Retrieved:");
        console.log(`  → Total items from DB: ${usersDataSource.items.length}`);
        console.log(`  → Page ${currentPage}, Page Size: ${itemsPerPage}`);

        const pageUsers = usersDataSource.items.slice(0, itemsPerPage).map(item => ({
            id: item.id,
            name: userNameAttr?.get(item).value || "Unnamed User"
        }));

        console.log(`  → Displaying ${pageUsers.length} users on this page`);
        console.log(`  → User IDs:`, pageUsers.map(u => u.id));

        return pageUsers;
    }, [usersDataSource, userNameAttr, itemsPerPage, currentPage]);

    const currentPageUserIds = useMemo(() => {
        const ids = users.map(u => u.id);
        console.log(`\n🔍 [RosterCalendar] Current Page User IDs for filtering:`, ids);
        return ids;
    }, [users]);

    // Fetch data using Mendix Client API when users or date range changes
    useEffect(() => {
        if (currentPageUserIds.length === 0) {
            setRosterPatterns([]);
            setPatternDays([]);
            setRosterDays([]);
            return;
        }

        if (!window.mx) {
            console.warn("⚠️ [RosterCalendar] Mendix Client API (mx) not available");
            return;
        }

        setLoading(true);

        const startDate = dateRange[0];
        const endDate = dateRange[dateRange.length - 1];
        const startDateStr = formatDateForXPath(startDate);
        const endDateStr = formatDateForXPath(endDate);

        console.log(`\n🔄 [RosterCalendar] Fetching data via Client API...`);
        console.log(`  → Date range: ${startDateStr} to ${endDateStr}`);

        // Fetch Roster Patterns
        if (patternEntityName && patternUserXPath) {
            fetchRosterPatterns(
                patternEntityName,
                patternUserXPath,
                patternUserPath,
                currentPageUserIds,
                startDateStr,
                endDateStr,
                patternStartDateAttr,
                patternEndDateAttr
            );
        } else {
            console.log(`  → Skipping patterns (not configured)`);
            setRosterPatterns([]);
        }

        // Fetch Roster Days
        if (rosterDayEntityName && rosterDayUserXPath) {
            fetchRosterDays(
                rosterDayEntityName,
                rosterDayUserXPath,
                rosterDayUserPath,
                currentPageUserIds,
                startDateStr,
                endDateStr,
                rosterDayDateAttr
            );
        } else {
            console.log(`  → Skipping roster days (not configured)`);
            setRosterDays([]);
        }

        setLoading(false);
    }, [currentPageUserIds, dateRange, patternEntityName, rosterDayEntityName]);

    // Fetch Pattern Days when patterns change
    useEffect(() => {
        if (rosterPatterns.length === 0) {
            setPatternDays([]);
            return;
        }

        if (!window.mx || !patternDayEntityName || !patternDayPatternAssociation) {
            return;
        }

        fetchPatternDays(
            patternDayEntityName,
            patternDayPatternAssociation,
            rosterPatterns.map(p => p.id)
        );
    }, [rosterPatterns, patternDayEntityName]);

    // Helper function to traverse association path and get final user ID
    // Supports both formats:
    //   Simple: "RosterPattern_DriverInfo/DriverInfo_TenantUser"
    //   Full:   "Roster.RosterPattern_DriverInfo/Tenancy.DriverInfo_TenantUser"
    function traverseAssociationPath(obj, pathString, entityName, callback) {
        if (!pathString) {
            callback(null);
            return;
        }

        // Split path by "/" to get association steps
        const parts = pathString.split('/');
        const defaultModule = entityName.split('.')[0];

        let currentId = null;
        let step = 0;

        function getAssociationName(assocPart) {
            // If already has module prefix (contains "."), use as-is
            // Otherwise, add default module prefix
            if (assocPart.includes('.')) {
                return assocPart;
            } else {
                return `${defaultModule}.${assocPart}`;
            }
        }

        function processStep() {
            if (step === 0) {
                // First step: get from current object
                const fullAssocName = getAssociationName(parts[0]);
                currentId = obj.get(fullAssocName);

                console.log(`    → Step ${step + 1}: obj.get("${fullAssocName}") = ${currentId}`);

                if (!currentId || parts.length === 1) {
                    callback(currentId);
                    return;
                }

                step++;
                processStep();
            } else if (step < parts.length) {
                // Subsequent steps: fetch object and get next association
                window.mx.data.get({
                    guid: currentId,
                    callback: function(intermediateObj) {
                        const fullAssocName = getAssociationName(parts[step]);
                        let nextId = intermediateObj.get(fullAssocName);

                        console.log(`    → Step ${step + 1}: obj.get("${fullAssocName}") = ${nextId}`);

                        currentId = nextId;
                        step++;

                        if (step === parts.length) {
                            callback(currentId);
                        } else {
                            processStep();
                        }
                    },
                    error: function() {
                        console.error(`    → Step ${step + 1}: Failed to fetch object ${currentId}`);
                        callback(null);
                    }
                });
            }
        }

        processStep();
    }

    function fetchRosterPatterns(entityName, userXPathPattern, userPath, userIds, startDate, endDate, startAttr, endAttr) {
        // User provides pattern like: "Roster.RosterPattern_DriverInfo/Tenancy.DriverInfo[Tenancy.DriverInfo_TenantUser"
        // We complete it with: " = guid1 or Tenancy.DriverInfo_TenantUser = guid2]]"

        // Build user ID conditions
        const lastPart = userXPathPattern.substring(userXPathPattern.lastIndexOf('[') + 1); // Gets "Tenancy.DriverInfo_TenantUser"
        const userConditions = userIds.map(id => `${lastPart} = ${id}`).join(' or ');

        // Complete the XPath
        const userConstraint = `[${userXPathPattern} = ${userIds[0]}` +
            (userIds.length > 1 ? ` or ${userIds.slice(1).map(id => `${lastPart} = ${id}`).join(' or ')}` : '') +
            ']]';

        const xpath = `//${entityName}${userConstraint}` +
            (startAttr && endAttr ? `[${startAttr} <= '${endDate}'][${endAttr} >= '${startDate}']` : '');

        console.log(`\n📋 [RosterCalendar] Fetching Roster Patterns:`);
        console.log(`  → XPath: ${xpath}`);

        window.mx.data.get({
            xpath: xpath,
            callback: function(objs) {
                console.log(`  ✅ Retrieved ${objs.length} patterns from server`);
                console.log(`  → Using association path: "${userPath || 'not configured'}"`);

                if (!userPath || objs.length === 0) {
                    setRosterPatterns([]);
                    return;
                }

                let processed = 0;
                const patterns = [];

                objs.forEach(obj => {
                    traverseAssociationPath(obj, userPath, entityName, (userId) => {
                        patterns.push({
                            id: obj.getGuid(),
                            startDate: startAttr ? obj.get(startAttr) : null,
                            endDate: endAttr ? obj.get(endAttr) : null,
                            userId: userId
                        });

                        processed++;
                        if (processed === objs.length) {
                            console.log(`  → Pattern IDs:`, patterns.map(p => p.id));
                            console.log(`  → Pattern User IDs:`, patterns.map(p => p.userId));
                            setRosterPatterns(patterns);
                        }
                    });
                });
            },
            error: function(err) {
                console.error(`  ❌ Error fetching patterns:`, err);
                setRosterPatterns([]);
            }
        });
    }


    function fetchPatternDays(entityName, associationPath, patternIds) {
        if (patternIds.length === 0) {
            setPatternDays([]);
            return;
        }

        // Build OR conditions with module prefix
        const module = entityName.split('.')[0];
        const fullAssocName = associationPath.includes('.') ? associationPath : `${module}.${associationPath}`;
        const patternIdConstraints = patternIds.map(id => `${fullAssocName} = '${id}'`).join(' or ');
        const xpath = `//${entityName}[${patternIdConstraints}]`;

        console.log(`\n📅 [RosterCalendar] Fetching Pattern Days:`);
        console.log(`  → XPath: ${xpath}`);

        window.mx.data.get({
            xpath: xpath,
            callback: function(objs) {
                console.log(`  ✅ Retrieved ${objs.length} pattern days from server`);

                const days = objs.map(obj => {
                    // Get pattern ID from association
                    const patternId = obj.get(fullAssocName);

                    return {
                        id: obj.getGuid(),
                        patternId: patternId,
                        dayOfWeek: normalizeDayOfWeek(obj.get(patternDayOfWeekAttr || 'DayOfWeek')),
                        available: normalizeAvailability(obj.get(patternDayAvailableAttr || 'Available'))
                    };
                });

                console.log(`  → Pattern day count by pattern:`,
                    days.reduce((acc, d) => ({ ...acc, [d.patternId]: (acc[d.patternId] || 0) + 1 }), {}));

                setPatternDays(days);
            },
            error: function(err) {
                console.error(`  ❌ Error fetching pattern days:`, err);
                setPatternDays([]);
            }
        });
    }

    function fetchRosterDays(entityName, userXPathPattern, userPath, userIds, startDate, endDate, dateAttr) {
        // User provides pattern like: "Roster.RosterDay_DriverInfo/Tenancy.DriverInfo[Tenancy.DriverInfo_TenantUser"
        // We complete it with user IDs and date filters

        const lastPart = userXPathPattern.substring(userXPathPattern.lastIndexOf('[') + 1);
        const userConditions = userIds.map(id => `${lastPart} = ${id}`).join(' or ');

        const userConstraint = `[${userXPathPattern} = ${userIds[0]}` +
            (userIds.length > 1 ? ` or ${userIds.slice(1).map(id => `${lastPart} = ${id}`).join(' or ')}` : '') +
            ']]';

        const xpath = `//${entityName}${userConstraint}` +
            (dateAttr ? `[${dateAttr} >= '${startDate}'][${dateAttr} <= '${endDate}']` : '');

        console.log(`\n🗓️  [RosterCalendar] Fetching Roster Days:`);
        console.log(`  → XPath: ${xpath}`);

        window.mx.data.get({
            xpath: xpath,
            callback: function(objs) {
                console.log(`  ✅ Retrieved ${objs.length} roster days from server`);
                console.log(`  → Using association path: "${userPath || 'not configured'}"`);

                if (!userPath || objs.length === 0) {
                    setRosterDays([]);
                    return;
                }

                let processed = 0;
                const days = [];

                objs.forEach(obj => {
                    traverseAssociationPath(obj, userPath, entityName, (userId) => {
                        days.push({
                            id: obj.getGuid(),
                            userId: userId,
                            date: obj.get(rosterDayDateAttr || 'Date'),
                            hours: obj.get(rosterDayHoursAttr || 'Hours') != null ?
                                Number(obj.get(rosterDayHoursAttr || 'Hours')) : null,
                            type: obj.get(rosterDayTypeAttr || 'DayType') != null ?
                                String(obj.get(rosterDayTypeAttr || 'DayType')) : null
                        });

                        processed++;
                        if (processed === objs.length) {
                            console.log(`  → Roster days by user:`,
                                days.reduce((acc, d) => ({ ...acc, [d.userId]: (acc[d.userId] || 0) + 1 }), {}));
                            console.log(`  → Sample data:`, days.slice(0, 3));
                            setRosterDays(days);
                        }
                    });
                });
            },
            error: function(err) {
                console.error(`  ❌ Error fetching roster days:`, err);
                setRosterDays([]);
            }
        });
    }


    const calendarData = useMemo(() => {
        const data = buildCalendarData(users, dateRange, rosterPatterns, patternDays, rosterDays);

        console.log(`\n📊 [RosterCalendar] === SUMMARY ===`);
        console.log(`  Page: ${currentPage} of ${totalPages || '?'}`);
        console.log(`  Users displayed: ${users.length}`);
        console.log(`  Roster patterns (server-filtered): ${rosterPatterns.length}`);
        console.log(`  Pattern days (server-filtered): ${patternDays.length}`);
        console.log(`  Roster days (server-filtered): ${rosterDays.length}`);
        console.log(`  Calendar rows: ${data.length}`);
        console.log(`  Date range: ${dateRange.length} days`);
        console.log(`=============================\n`);

        return data;
    }, [users, dateRange, rosterPatterns, patternDays, rosterDays, currentPage, totalPages]);

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

    const handlePageChange = (newPage) => {
        if (newPage >= 1) {
            setCurrentPage(newPage);
        }
    };

    if (!usersDataSource || usersDataSource.status === "loading") {
        return <div className="roster-calendar-loading">Loading users...</div>;
    }

    if (loading) {
        return <div className="roster-calendar-loading">Loading roster data...</div>;
    }

    const containerStyle = heightType === "auto" ? {} : { height };

    return (
        <div className="roster-calendar-container" style={containerStyle}>
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
                                {userRow.days.map((dayCell, idx) => {
                                    let cellColorClass = "";
                                    if (dayCell.hasActual) {
                                        const typeStr = String(dayCell.actualType || "work").toLowerCase();
                                        if (typeStr === "worked" || typeStr === "work") {
                                            cellColorClass = "cell-worked";
                                        } else if (typeStr === "leave") {
                                            cellColorClass = "cell-leave";
                                        } else if (typeStr === "sick") {
                                            cellColorClass = "cell-sick";
                                        }
                                    } else if (dayCell.hasPattern) {
                                        cellColorClass = dayCell.patternAvailable ? "cell-available" : "cell-off";
                                    }

                                    return (
                                        <td
                                            key={idx}
                                            className={classNames("roster-calendar-day-cell", cellColorClass, {
                                                "is-today": dayCell.isToday
                                            })}
                                            onClick={() => handleCellClick(userRow, dayCell.date, dayCell)}
                                        >
                                            <CellContent cell={dayCell} />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(hasNextPage || hasPrevPage) && (
                <div className="roster-calendar-pagination">
                    <button
                        className="roster-calendar-pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPrevPage}
                        title="Previous page"
                    >
                        ◀
                    </button>

                    <div className="roster-calendar-pagination-info">
                        <span className="roster-calendar-page-number">{currentPage}</span>
                        <span className="roster-calendar-page-total">
                            {totalPages !== null ? `of ${totalPages}` : 'of ?'}
                        </span>
                    </div>

                    <button
                        className="roster-calendar-pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                        title="Next page"
                    >
                        ▶
                    </button>
                </div>
            )}
        </div>
    );
}

function CellContent({ cell }) {
    if (cell.hasActual) {
        const typeStr = String(cell.actualType || "work").toLowerCase();
        const typeLabel = String(cell.actualType || "Work");
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
                        cell.patternAvailable ? "available" : "off"
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

function formatDateForXPath(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
