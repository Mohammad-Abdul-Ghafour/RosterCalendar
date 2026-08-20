import { formatDateKey } from "./dateUtils";

export function normalizeDayOfWeek(value) {
    if (value == null) return null;

    // Extract the actual value if it's an object
    let actualValue = typeof value === "object" && value.value != null ? value.value : value;

    // If it's already a number, return it
    if (typeof actualValue === "number") {
        return actualValue;
    }

    // If it's a string, convert day name to number
    if (typeof actualValue === "string") {
        const dayMap = {
            // Full names
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6,
            // Short names
            'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3,
            'thu': 4, 'fri': 5, 'sat': 6
        };

        const normalized = dayMap[actualValue.toLowerCase()];
        if (normalized !== undefined) {
            return normalized;
        }
    }

    // Try to convert to number as fallback
    return Number(actualValue);
}

export function normalizeAvailability(value) {
    if (value == null) return false;

    // Extract the actual value if it's an object
    let actualValue = typeof value === "object" && value.value != null ? value.value : value;

    // If it's already a boolean, return it
    if (typeof actualValue === "boolean") {
        return actualValue;
    }

    // If it's a string enum, check for 'Available' vs 'Unavailable'
    if (typeof actualValue === "string") {
        const lowerValue = actualValue.toLowerCase();
        if (lowerValue === 'available') return true;
        if (lowerValue === 'unavailable') return false;
    }

    // Fallback to boolean conversion
    return Boolean(actualValue);
}

export function buildCalendarData(users, dateRange, rosterPatterns, patternDays, rosterDays) {
    console.log("[buildCalendarData] Starting with:", {
        users: users.length,
        patterns: rosterPatterns.length,
        patternDays: patternDays.length,
        rosterDays: rosterDays.length
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return users.map(user => {
        const userPatterns = rosterPatterns.filter(p => p.userId === user.id);
        console.log(`[buildCalendarData] User ${user.id} has ${userPatterns.length} patterns`);

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
                const patternStart = new Date(pattern.startDate);
                const patternEnd = new Date(pattern.endDate);
                patternStart.setHours(0, 0, 0, 0);
                patternEnd.setHours(0, 0, 0, 0);

                if (date >= patternStart && date <= patternEnd) {
                    const matchingPatternDays = patternDays.filter(pd => pd.patternId === pattern.id);
                    console.log(`[buildCalendarData] Date ${dateKey}, dayOfWeek ${dayOfWeek}:`, {
                        patternId: pattern.id,
                        matchingPatternDays,
                        lookingForDayOfWeek: dayOfWeek
                    });

                    patternDay = patternDays.find(
                        pd => pd.patternId === pattern.id && pd.dayOfWeek === dayOfWeek
                    );

                    if (patternDay) {
                        console.log(`[buildCalendarData] FOUND pattern day:`, patternDay);
                        patternAvailable = patternDay.available;
                        break;
                    } else {
                        console.log(`[buildCalendarData] NO MATCH for dayOfWeek ${dayOfWeek}`);
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
                actualType: actualDay?.type || null,
                hours: actualDay?.hours || null,
                hasPattern: !!patternDay,
                patternAvailable
            };
        });

        return {
            userId: user.id,
            userName: user.name,
            days
        };
    });
}
