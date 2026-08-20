# RosterCalendar Pattern Structure Explained

## Understanding PatternDay

**PatternDay** does NOT contain specific dates. Instead, it defines a **weekly recurring pattern** that applies to the entire RosterPattern period.

## Visual Example

### RosterPattern
```
User: John Doe
Start Date: August 1, 2024
End Date: August 31, 2024
```

### PatternDay Records (7 records for this pattern)
```
┌─────────────┬───────────┐
│ Day of Week │ Available │
├─────────────┼───────────┤
│ Monday      │ ✓ true    │
│ Tuesday     │ ✓ true    │
│ Wednesday   │ ✓ true    │
│ Thursday    │ ✓ true    │
│ Friday      │ ✓ true    │
│ Saturday    │ ✗ false   │
│ Sunday      │ ✗ false   │
└─────────────┴───────────┘
```

### How It Works on the Calendar

When the calendar displays August 2024, it applies the pattern like this:

```
        August 2024
Mon Tue Wed Thu Fri Sat Sun
                1   2   3   4
  5   6   7   8   9  10  11
 12  13  14  15  16  17  18
 19  20  21  22  23  24  25
 26  27  28  29  30  31

For EACH date in the calendar:
1. Check if date falls within pattern period (Aug 1-31) ✓
2. Determine day of week for that date
3. Look up PatternDay for that day of week
4. Display availability status

Examples:
- Aug 5 (Monday)    → Look up "Monday" → Available = true  → Show "Available"
- Aug 6 (Tuesday)   → Look up "Tuesday" → Available = true  → Show "Available"
- Aug 10 (Saturday) → Look up "Saturday" → Available = false → Show "Off"
- Aug 15 (Thursday) → Look up "Thursday" → Available = true  → Show "Available"
```

## Data Flow

```
┌─────────────────┐
│  RosterPattern  │
│  Aug 1 - Aug 31 │
└────────┬────────┘
         │ has 7 PatternDay records
         │
         ├─── Monday:    Available
         ├─── Tuesday:   Available
         ├─── Wednesday: Available
         ├─── Thursday:  Available
         ├─── Friday:    Available
         ├─── Saturday:  Unavailable
         └─── Sunday:    Unavailable

When displaying Aug 15, 2024 (Thursday):
  1. Is there a RosterDay for Aug 15? → No
  2. Is there an active RosterPattern? → Yes (Aug 1-31)
  3. What day of week is Aug 15? → Thursday
  4. What's the PatternDay for Thursday? → Available
  5. Display: "Available"
```

## Overriding with RosterDay

The pattern is the **baseline schedule**. Actual events override it:

```
Pattern says: Thursday = Available

But if there's a RosterDay entry:
  Date: August 15, 2024
  Type: Leave
  Hours: 0

The calendar will show: "Leave" (RosterDay takes priority)
```

## Complete Example

### Setup
```
Entity: User
  - ID: 123
  - Name: "Jane Smith"

Entity: RosterPattern
  - ID: 456
  - User: 123
  - StartDate: 2024-08-01
  - EndDate: 2024-08-31

Entity: PatternDay (7 records)
  1. Pattern: 456, DayOfWeek: Monday,    Available: true
  2. Pattern: 456, DayOfWeek: Tuesday,   Available: true
  3. Pattern: 456, DayOfWeek: Wednesday, Available: true
  4. Pattern: 456, DayOfWeek: Thursday,  Available: true
  5. Pattern: 456, DayOfWeek: Friday,    Available: true
  6. Pattern: 456, DayOfWeek: Saturday,  Available: false
  7. Pattern: 456, DayOfWeek: Sunday,    Available: false

Entity: RosterDay (actual data)
  - Date: 2024-08-15
  - User: 123
  - Type: "Leave"
  - Hours: 0
```

### Calendar Display for Week of Aug 12-18, 2024

```
User: Jane Smith

Mon 12  | Tue 13  | Wed 14  | Thu 15 | Fri 16  | Sat 17 | Sun 18
Available Available Available Leave    Available  Off      Off
         ↑                     ↑
    Pattern says          RosterDay
     "Available"          overrides!
```

## Enumeration Mapping

The widget supports flexible enum values for day of week:

### Supported Day of Week Values
- Full names: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
- Short names: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
- Numbers: 0 (Sunday), 1 (Monday), 2 (Tuesday), 3 (Wednesday), 4 (Thursday), 5 (Friday), 6 (Saturday)

### Supported Availability Values

**Boolean:**
- `true` → Available
- `false` → Off

**String/Enum:**
- Available: "true", "available", "yes", "1", "work", "working"
- Unavailable: "false", "unavailable", "no", "0", "off", "not available"

## Key Takeaways

1. **PatternDay = Weekly Template**, not specific dates
2. **7 records per RosterPattern** (one for each day of the week)
3. **Pattern repeats** throughout the entire RosterPattern period
4. **RosterDay overrides** the pattern for specific dates
5. **Use RosterDay** for exceptions, leaves, and actual worked hours
