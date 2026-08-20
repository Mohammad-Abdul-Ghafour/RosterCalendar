# RosterCalendar - Final Configuration Guide

## ✅ Widget Uses Object Type Properties

The widget now uses `type="object"` properties that allow you to **select associations directly** in Studio Pro.

## How to Configure in Mendix Studio Pro

### 1. Users Data Source (Required)

```
Users Data Source: TenantUser (or DriverInfo)
User Name Attribute: FullName
```

### 2. Roster Patterns Data Source

```
Roster Patterns Data Source: RosterPattern
Pattern Start Date: StartDate
Pattern End Date: EndDate

Pattern User Association:
  → Click the field
  → Navigate through associations
  → Select: DriverInfo → TenantUser
  → Studio Pro shows the path automatically
```

**Visual:**
```
RosterPattern (current object)
  └─ DriverInfo (association)
      └─ TenantUser (final selection) ✅
```

### 3. Pattern Days Data Source

```
Pattern Days Data Source: PatternDay
Day of Week: DayOfWeek (Enum)

Pattern Association:
  → Click the field
  → Select: RosterPattern
  
Available / Status: Available (Boolean or Enum)
```

### 4. Roster Days Data Source

```
Roster Days Data Source: RosterDay
Roster Day Date: Date

Roster Day User Association:
  → Click the field
  → Navigate: DriverInfo → TenantUser
  → Select: TenantUser
  
Hours Worked: Hours
Day Type: DayType (Enum)
```

## What Happens Behind the Scenes

### Object Type Property

In widget XML:
```xml
<property key="patternUserRef" type="object" 
          dataSource="rosterPatternsDataSource">
    <caption>Pattern User Association</caption>
</property>
```

### In Studio Pro

When you configure this property:
1. Click the field
2. Studio Pro shows association navigator
3. Navigate: `RosterPattern` → `DriverInfo` → `TenantUser`
4. Select the final entity
5. Studio Pro stores the association path

### Widget Processing

```javascript
// Widget receives the associated object
const userObj = patternUserRef?.get(item).value;
// Object: { id: "17169973579427036", FullName: "Driver 1", ... }

const userId = userObj?.id;
// Extracted ID: "17169973579427036"
```

## Configuration Examples

### Example 1: TenantUser as Users

**Your Domain Model:**
```
TenantUser ←─1:1─→ DriverInfo ←─M:1─→ RosterPattern
TenantUser ←─1:1─→ DriverInfo ←─M:1─→ RosterDay
PatternDay ─M:1─→ RosterPattern
```

**Widget Configuration:**
```
Users Data Source: TenantUser
User Name: FullName

Pattern User Association: DriverInfo/TenantUser
Pattern Association: RosterPattern
Roster Day User Association: DriverInfo/TenantUser
```

---

### Example 2: DriverInfo as Users (Simpler!)

**Your Domain Model:**
```
DriverInfo ←─M:1─→ RosterPattern
DriverInfo ←─M:1─→ RosterDay
DriverInfo ─1:1─→ TenantUser
PatternDay ─M:1─→ RosterPattern
```

**Widget Configuration:**
```
Users Data Source: DriverInfo
User Name: TenantUser/FullName

Pattern User Association: DriverInfo
Pattern Association: RosterPattern
Roster Day User Association: DriverInfo
```

**Benefits:**
- Simpler - no path needed
- Direct associations
- Cleaner configuration

---

## Step-by-Step: Configuring Pattern User Association

1. **Open widget properties** in Studio Pro
2. **Find "Pattern User Association"** property
3. **Click the field** - Association navigator appears
4. **Navigate the path:**
   - Current entity: `RosterPattern`
   - Click: `DriverInfo` (follows association)
   - Click: `TenantUser` (follows association)
5. **Select** `TenantUser`
6. **Studio Pro shows:** `DriverInfo/TenantUser`
7. **Done!** Widget will extract TenantUser ID automatically

## Expected Data

After correct configuration, the widget will receive:

```javascript
{
  "users": [
    { "id": "17169973579427036", "name": "Driver 1" }
  ],
  "rosterPatterns": [
    {
      "id": "22517998136852707",
      "userId": "17169973579427036",  // ✅ Matches user.id!
      "startDate": "2026-07-31T14:00:00.000Z",
      "endDate": "2026-09-29T14:00:00.000Z"
    }
  ],
  "patternDays": [
    {
      "id": "22799473113563344",
      "patternId": "22517998136852707",  // ✅ Matches pattern.id!
      "dayOfWeek": 1,
      "available": true
    }
  ],
  "rosterDays": [
    {
      "id": "21673573206733586",
      "userId": "17169973579427036",  // ✅ Matches user.id!
      "date": "2026-08-19T14:00:00.000Z",
      "hours": "5",
      "type": "Worked"
    }
  ]
}
```

## Troubleshooting

### Issue: Can't see associations in navigator

**Solution:** Verify the association exists in your domain model between the source entity and target entity.

### Issue: userId is null in console

**Possible causes:**
1. Association is not set (empty reference)
2. Wrong association path selected
3. No related object in database

**Debug steps:**
1. Check domain model associations exist
2. Verify data exists in database
3. Test association in a text widget first: `$RosterPattern/DriverInfo/TenantUser/FullName`

### Issue: IDs still don't match

**Problem:** Different entities selected

**Example:**
```
Users: TenantUser (id: "17169973579427036")
Pattern User Association: DriverInfo (id: "99999999")  ❌ Mismatch!
```

**Fix:** Ensure association points to same entity as Users data source
```
Users: TenantUser
Pattern User Association: DriverInfo/TenantUser  ✅ Correct!
```

## Recommended Approach

### Use DriverInfo as your User entity

**Why?**
- Simpler configuration
- Direct associations (no paths)
- Central entity in your model

**Configuration:**
```
Users Data Source: DriverInfo
Pattern User Association: DriverInfo (direct)
Roster Day User Association: DriverInfo (direct)
```

**Benefits:**
- One-click association selection
- No multi-level navigation
- Clearer, simpler setup

## Quick Reference

| Property | What to Select | Example |
|----------|---------------|---------|
| Users Data Source | The entity representing users | TenantUser or DriverInfo |
| Pattern User Association | Navigate to same entity as Users | DriverInfo/TenantUser |
| Pattern Association | Direct to RosterPattern | RosterPattern |
| Roster Day User Association | Navigate to same entity as Users | DriverInfo/TenantUser |

## Final Checklist

- [ ] Widget MPK imported into Mendix project
- [ ] Users data source configured
- [ ] Pattern User Association points to correct entity
- [ ] Pattern Association points to RosterPattern
- [ ] Roster Day User Association points to correct entity
- [ ] All data sources have data in database
- [ ] Tested in browser with console open
- [ ] IDs match in console output
- [ ] Green/gray placeholders visible in calendar

## Success!

When configured correctly, you'll see:

```
Mon     Tue     Wed     Thu     Fri     Sat     Sun
┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐
│   │   │   │   │   │   │ 5h│   │SICK│  │   │   │   │
└───┘   └───┘   └───┘   └───┘   └───┘   └───┘   └───┘
GREEN   GREEN   GREEN   GREEN   RED     GRAY    GRAY
Available Available Available Worked  Sick    Off     Off
```

The widget is ready to use! 🎉
