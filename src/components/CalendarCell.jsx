import classNames from "classnames";

export function CalendarCell({ cell, onClick }) {
    let cellColorClass = "";
    if (cell.hasActual) {
        const typeStr = String(cell.actualType || "work").toLowerCase();
        if (typeStr === "worked" || typeStr === "work") {
            cellColorClass = "cell-worked";
        } else if (typeStr === "leave") {
            cellColorClass = "cell-leave";
        } else if (typeStr === "sick") {
            cellColorClass = "cell-sick";
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
        const typeLabel = String(cell.actualType || "Work");
        const hoursNum = Number(cell.hours);

        return (
            <div className="roster-calendar-cell-content">
                <div className="roster-calendar-cell-label">{typeLabel}</div>
                {!isNaN(hoursNum) && hoursNum > 0 && (
                    <div className="roster-calendar-cell-hours">{hoursNum}h</div>
                )}
            </div>
        );
    }

    if (cell.hasPattern) {
        return (
            <div className="roster-calendar-cell-content">
                <div className="roster-calendar-cell-label">
                    {cell.patternAvailable ? "Available" : "Off"}
                </div>
            </div>
        );
    }

    return <div className="roster-calendar-cell-content roster-calendar-cell-empty" />;
}
