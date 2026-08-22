import classNames from "classnames";
import { extractTime } from "../utils/dateUtils";

// Helper to extract numeric value from Mendix Big objects
function extractNumber(value) {
    if (value == null) return null;
    if (typeof value === "number") return value;
    if (typeof value === "object" && value.value !== undefined) return Number(value.value);
    return Number(value);
}

export function CalendarCell({ cell, onClick }) {
    let cellColorClass = "";

    if (cell.hasActual) {
        const typeStr = String(cell.actualType || "").toLowerCase();

        // Check if it's an "Available" roster type
        if (typeStr === "available") {
            cellColorClass = "cell-available";
        } else if (cell.isPartTime) {
            // Part-time sick or leave: show as available (green)
            cellColorClass = "cell-available";
        } else {
            // Full-time sick or leave: show as off (grey)
            if (typeStr === "sick" || typeStr === "leave") {
                cellColorClass = "cell-off";
            }
        }
    } else if (cell.hasPattern) {
        cellColorClass = cell.patternAvailable ? "cell-available" : "cell-off";
    }

    return (
        <td
            className={classNames("roster-calendar-day-cell", cellColorClass, {
                "is-today": cell.isToday
            })}
            onClick={onClick}
        >
            <CellContent cell={cell} />
        </td>
    );
}

function CellContent({ cell }) {
    if (cell.hasActual) {
        const typeStr = String(cell.actualType || "").toLowerCase();

        // Handle "Available" roster type - display like pattern available
        if (typeStr === "available") {
            const workingHours = extractNumber(cell.workingHours);
            const startTime = extractTime(cell.workStartTime);
            const endTime = extractTime(cell.workEndTime);

            return (
                <div className="roster-calendar-cell-content">
                    <div className="roster-calendar-cell-label">Available</div>
                    {workingHours != null && !isNaN(workingHours) && (
                        <div className="roster-calendar-cell-hours">{workingHours}h</div>
                    )}
                    {startTime && endTime && (
                        <div className="roster-calendar-cell-time">
                            {startTime} - {endTime}
                        </div>
                    )}
                </div>
            );
        }

        if (cell.isPartTime) {
            // Part-time: show available with working hours and badge
            const workingHours = extractNumber(cell.workingHours);
            const startTime = extractTime(cell.workStartTime);
            const endTime = extractTime(cell.workEndTime);

            return (
                <div className="roster-calendar-cell-content">
                    <div className="roster-calendar-cell-label">Available</div>
                    {workingHours != null && !isNaN(workingHours) && (
                        <div className="roster-calendar-cell-hours">{workingHours}h</div>
                    )}
                    {startTime && endTime && (
                        <div className="roster-calendar-cell-time">
                            {startTime} - {endTime}
                        </div>
                    )}
                    {typeStr && (
                        <div className={classNames("roster-calendar-cell-badge", {
                            "badge-sick": typeStr === "sick",
                            "badge-leave": typeStr === "leave"
                        })}>
                            {typeStr === "sick" ? "Sick" : "Leave"}
                        </div>
                    )}
                </div>
            );
        } else {
            // Full-time sick or leave: show "Off" label and badge
            return (
                <div className="roster-calendar-cell-content">
                    <div className="roster-calendar-cell-label">Off</div>
                    {typeStr && (
                        <div className={classNames("roster-calendar-cell-badge", {
                            "badge-sick": typeStr === "sick",
                            "badge-leave": typeStr === "leave"
                        })}>
                            {typeStr === "sick" ? "Sick" : "Leave"}
                        </div>
                    )}
                </div>
            );
        }
    }

    if (cell.hasPattern) {
        const patternHours = extractNumber(cell.patternWorkingHours);
        const startTime = extractTime(cell.patternStartTime);
        const endTime = extractTime(cell.patternEndTime);

        return (
            <div className="roster-calendar-cell-content">
                <div className="roster-calendar-cell-label">
                    {cell.patternAvailable ? "Available" : "Off"}
                </div>
                {cell.patternAvailable && patternHours != null && !isNaN(patternHours) && (
                    <div className="roster-calendar-cell-hours">{patternHours}h</div>
                )}
                {cell.patternAvailable && startTime && endTime && (
                    <div className="roster-calendar-cell-time">
                        {startTime} - {endTime}
                    </div>
                )}
            </div>
        );
    }

    return <div className="roster-calendar-cell-content roster-calendar-cell-empty" />;
}
