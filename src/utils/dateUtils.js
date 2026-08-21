export function generateDateRange(currentDate, viewMode, showWeekends) {
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

export function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function formatDateRangeTitle(currentDate, viewMode) {
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

export function formatDayName(date) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDateForXPath(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatDateKey(date) {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
}

export function extractTime(datetime) {
    if (!datetime) return "";

    // Handle Mendix wrapped values
    let actualValue = datetime;
    if (typeof datetime === "object" && datetime !== null) {
        if (datetime.value !== undefined) {
            actualValue = datetime.value;
        } else if (datetime.toString && typeof datetime.toString === 'function') {
            // Try to convert to string first for Mendix Big objects
            actualValue = datetime.toString();
        }
    }

    if (!actualValue) return "";

    const d = actualValue instanceof Date ? actualValue : new Date(actualValue);
    if (isNaN(d.getTime())) return "";

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}
