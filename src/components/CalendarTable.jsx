import { CalendarCell } from "./CalendarCell";

export function CalendarTable({ calendarData, dateRange, onCellClick, formatDayName }) {
    return (
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
                                <CalendarCell
                                    key={idx}
                                    cell={dayCell}
                                    userItem={userRow.userItem}
                                    onClick={onCellClick}
                                />
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
