# RosterCalendar Widget Usage Guide

## Overview

The RosterCalendar widget displays a roster planning calendar with users/drivers as rows and dates as columns. It supports week and month views with navigation controls.

## Features

- **Week/Month View Toggle** - Switch between weekly and monthly calendar views
- **Date Navigation** - Previous/Next buttons to navigate through time periods
- **Multi-Layer Data Model** - Combines pattern-based schedules with actual roster data
- **Responsive Grid** - Sticky headers for users and dates with scrollable content
- **Day Type Indicators** - Visual color coding for work, leave, sick days, etc.
- **Hours Tracking** - Display total hours worked per day
- **Dark Mode Support** - Automatic dark mode styling

## Data Model

### Required Data Sources

#### 1. Users (Required)
List of users or drivers to display as rows.

**Properties to configure:**
- **Users Data Source** - List of user entities
- **User Name Attribute** - String attribute to display (e.g., `FullName`, `DisplayName`)

### Optional Data Sources

#### 2. Roster Patterns (Optional)
Scheduled roster patterns with start and end dates. Defines the "baseline" schedule.

**Properties to configure:**
- **Roster Patterns Data Source** - List of RosterPattern entities
- **Pattern Start Date** - DateTime attribute for pattern start
- **Pattern End Date** - DateTime attribute for pattern end
- **Pattern User Reference** - String/Reference to the User entity

#### 3. Pattern Days (Optional)
Weekly pattern definition (7 records per RosterPattern: Monday-Sunday) that defines the normal working schedule. Each record represents a day of the week with availability status.

**Properties to configure:**
- **Pattern Days Data Source** - List of PatternDay entities (7 per pattern)
- **Day of Week** - String/Enum for day of week (e.g., "Monday", "Tuesday", etc.)
- **Pattern Reference** - String/Reference to the RosterPattern entity
- **Available / Status** - Boolean or String/Enum indicating availability
  - Boolean: `true` = available, `false` = off
  - String: "available", "work", "yes" = available | "off", "unavailable", "no" = off

#### 4. Roster Days (Optional)
Actual roster data including leaves and worked hours. Overrides pattern data for past days.

**Properties to configure:**
- **Roster Days Data Source** - List of RosterDay entities
- **Roster Day Date** - DateTime attribute for the day
- **Roster Day User Reference** - String/Reference to the User entity
- **Hours Worked** - Decimal/Integer for hours worked
- **Day Type** - String/Enum for actual day type (e.g., "worked", "leave", "sick")

## Data Hierarchy Logic

The widget follows this priority order when rendering calendar cells:

1. **Actual Roster Data (RosterDay)** - If present, displays actual hours and type
   - Used for past days with recorded work or leave
   - Shows hours worked badge
   
2. **Pattern Data (PatternDay)** - If no actual data, displays scheduled pattern
   - Only shown if date falls within RosterPattern start/end range
   - Shows scheduled day type
   
3. **Empty** - No data available for this user/date combination

### Example Data Flow

```
User: John Doe
Date: 2024-08-15 (Friday)

Check 1: Is there a RosterDay for John on 2024-08-15?
  → Yes → Display "Leave" with 0 hours

Check 2: Is there a RosterPattern active for John containing 2024-08-15?
  → Not checked (RosterDay takes priority)

---

User: Jane Smith  
Date: 2024-08-20 (Tuesday)

Check 1: Is there a RosterDay for Jane on 2024-08-20?
  → No → Continue to check 2

Check 2: Is there a RosterPattern active for Jane containing 2024-08-20?
  → Yes → Pattern ID: 123, active from 2024-08-01 to 2024-08-31
  → Date falls on Tuesday (day 2)
  → Check PatternDay for Pattern 123 where DayOfWeek = "Tuesday"
    → Found → Available = true
    → Display "Available"

---

User: Mike Johnson
Date: 2024-08-25 (Sunday)

Check 1: Is there a RosterDay for Mike on 2024-08-25?
  → No

Check 2: Is there a RosterPattern active for Mike containing 2024-08-25?
  → Yes → Pattern ID: 456
  → Date falls on Sunday (day 0)
  → Check PatternDay for Pattern 456 where DayOfWeek = "Sunday"
    → Found → Available = false
    → Display "Off"

---

User: Sarah Lee
Date: 2024-09-01

Check 1: Is there a RosterDay for Sarah on 2024-09-01?
  → No

Check 2: Is there a RosterPattern active for Sarah containing 2024-09-01?
  → No active patterns

Result: Empty cell
```

## Configuration Options

### General Settings
- **Default View** - `week` or `month` (initial view mode)
- **Show Weekends** - Boolean to include/exclude Saturday and Sunday

### Appearance
- **Calendar Height** - CSS height value (default: `600px`)
  - Examples: `600px`, `80vh`, `calc(100vh - 200px)`

### Actions
- **On Cell Click** - Action to execute when user clicks a calendar cell
  - The action will receive context from the widget

## Styling and Day Types

The widget automatically applies CSS classes based on day type:

### Predefined Day Type Styles

| Day Type | CSS Class | Color | Use Case |
|----------|-----------|-------|----------|
| `work` / `worked` | `type-work` | Green | Normal working day |
| `leave` | `type-leave` | Red | Approved leave/vacation |
| `sick` | `type-sick` | Orange | Sick leave |
| `scheduled` | `type-scheduled` | Cyan | Pattern-based scheduled day |
| `off` | `type-off` | Gray | Day off |

### Custom Day Types

To add custom day types, edit `src/ui/RosterCalendar.css` and add new type classes:

```css
.roster-calendar-cell-type.type-training {
    background-color: #d0ebff;
    color: #1971c2;
}

.roster-calendar-cell-type.type-overtime {
    background-color: #ffe066;
    color: #f76707;
}
```

## Example Mendix Setup

### Domain Model

```
Entity: User
- FullName (String)
- EmployeeNumber (String)

Entity: RosterPattern
- StartDate (DateTime)
- EndDate (DateTime)
- User (Reference to User)

Entity: PatternDay (7 records per RosterPattern)
- DayOfWeek (Enumeration: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
- Available (Boolean)  // true = working day, false = day off
- RosterPattern (Reference to RosterPattern)

// Alternative PatternDay with status enum:
Entity: PatternDay
- DayOfWeek (Enumeration: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
- Status (Enumeration: Available, Unavailable, Training, Other)
- RosterPattern (Reference to RosterPattern)

Entity: RosterDay
- Date (DateTime)
- Hours (Decimal)
- DayType (Enumeration: Worked, Leave, Sick, Overtime)
- User (Reference to User)
```

**Example PatternDay Setup for a User:**

For a user working Monday-Friday with weekends off:
```
PatternDay 1: DayOfWeek = Monday,    Available = true
PatternDay 2: DayOfWeek = Tuesday,   Available = true
PatternDay 3: DayOfWeek = Wednesday, Available = true
PatternDay 4: DayOfWeek = Thursday,  Available = true
PatternDay 5: DayOfWeek = Friday,    Available = true
PatternDay 6: DayOfWeek = Saturday,  Available = false
PatternDay 7: DayOfWeek = Sunday,    Available = false
```

### Widget Configuration in Mendix Studio Pro

1. **Add widget to page**
2. **Configure Data Sources:**
   - Users: Database source retrieving `User` entities
   - User Name: `FullName` attribute
   - Roster Patterns: Database source retrieving `RosterPattern` entities
   - Pattern Start Date: `StartDate`
   - Pattern End Date: `EndDate`
   - Pattern User Reference: Convert `User` reference to string using `toString()`
   - Pattern Days: Database source retrieving `PatternDay` entities
   - Pattern Day Date: `Date`
   - Pattern Reference: Convert `RosterPattern` reference to string
   - Day Type: `DayType` enumeration
   - Roster Days: Database source retrieving `RosterDay` entities
   - Roster Day Date: `Date`
   - Roster Day User Reference: Convert `User` reference to string
   - Hours Worked: `Hours`
   - Day Type: `DayType` enumeration

3. **Configure Actions:**
   - On Cell Click: Create a microflow to handle cell selection

### Microflow for Cell Click

When a cell is clicked, you might want to:
- Open a dialog to add/edit roster entries
- Display detailed information about the selected day
- Create new RosterDay entries

## Development

### Building the Widget
```bash
npm run build
```

### Development Mode (Hot Reload)
```bash
npm start
```

### Installing in Mendix Project
1. Build the widget (`npm run build`)
2. Copy `widgets/roboyo.RosterCalendar.mpk` to your Mendix project's `widgets/` folder
3. Press F4 in Studio Pro to synchronize

## Tips and Best Practices

1. **Performance** - Limit the number of users displayed (10-20 for optimal performance)
2. **Data Filtering** - Use XPath or database queries to filter users and dates
3. **Reference Handling** - Convert Mendix object references to strings using `toString()` or unique identifiers
4. **Date Matching** - Ensure dates are normalized (start of day) for accurate matching
5. **Weekend Display** - Disable weekends for standard work week calendars

## Troubleshooting

### Widget shows "Loading..." indefinitely
- Ensure Users data source is properly configured and returns data
- Check browser console for errors

### Pattern days not appearing
- Verify PatternDay dates fall within RosterPattern start/end range
- Ensure Pattern Reference correctly links to RosterPattern entity
- Check that date formats are consistent (DateTime attributes)

### Actual hours not showing
- Confirm RosterDay data exists for past dates
- Verify User Reference matches correctly
- Check that Hours attribute is numeric (Decimal/Integer)

### Cell click action not firing
- Ensure action is configured in widget properties
- Verify the action has proper permissions

## Future Enhancements

Potential improvements for future versions:
- Cell editing (inline hour entry)
- Drag-and-drop roster assignment
- Multi-user selection
- Export to PDF/Excel
- Total hours summary per user
- Filtering and search capabilities
- Custom color schemes
