export function preview({ defaultView, showWeekends, height }) {
    const mockDates = ["Mon 1", "Tue 2", "Wed 3", "Thu 4", "Fri 5"];
    if (showWeekends) {
        mockDates.push("Sat 6", "Sun 7");
    }

    return (
        <div className="roster-calendar-container" style={{ height: height || "400px" }}>
            <div className="roster-calendar-header">
                <div className="roster-calendar-nav">
                    <button className="roster-calendar-btn">◀</button>
                    <span className="roster-calendar-title">
                        {defaultView === "week" ? "Week View Preview" : "Month View Preview"}
                    </span>
                    <button className="roster-calendar-btn">▶</button>
                </div>
                <button className="roster-calendar-btn roster-calendar-view-toggle">
                    {defaultView === "week" ? "Month View" : "Week View"}
                </button>
            </div>
            <div className="roster-calendar-grid-wrapper">
                <table className="roster-calendar-table">
                    <thead>
                        <tr>
                            <th className="roster-calendar-user-header">User</th>
                            {mockDates.map((date, idx) => (
                                <th key={idx} className="roster-calendar-date-header">
                                    <div className="roster-calendar-date-label">
                                        <div className="roster-calendar-day-name">{date.split(" ")[0]}</div>
                                        <div className="roster-calendar-day-number">{date.split(" ")[1]}</div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {["User 1", "User 2"].map((user, userIdx) => (
                            <tr key={userIdx}>
                                <td className="roster-calendar-user-cell">
                                    <span className="roster-calendar-user-name">{user}</span>
                                </td>
                                {mockDates.map((_, dateIdx) => (
                                    <td key={dateIdx} className="roster-calendar-day-cell">
                                        <div className="roster-calendar-cell-content">
                                            {dateIdx % 3 === 0 && (
                                                <>
                                                    <div className="roster-calendar-cell-type type-work">Work</div>
                                                    <div className="roster-calendar-cell-hours">8h</div>
                                                </>
                                            )}
                                        </div>
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

export function getPreviewCss() {
    return require("./ui/RosterCalendar.css");
}
