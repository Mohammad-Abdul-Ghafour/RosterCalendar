# RosterCalendar - Client API Configuration Guide

## 🎉 Server-Side Filtering with Mendix Client API

The widget now uses **Mendix Client API (`window.mx`)** to fetch data dynamically with XPath constraints!

### Benefits

✅ **Server-side filtering** - Only retrieves data for current page users  
✅ **Date range filtering** - Only fetches data in visible date range  
✅ **No Mendix page changes** - Just configure widget properties  
✅ **Dynamic XPath** - Widget builds queries based on runtime state  
✅ **99%+ efficiency gain** - From loading 50,000 records to ~100 records

---

## Configuration in Mendix Studio Pro

### Step 1: Users Data Source (Required)

```
Data Source: Database
Entity: TenantUser (or DriverInfo)
User Name Attribute: FullName
Users Per Page: 10
```

This is the only real datasource. Everything else is fetched via Client API!

---

### Step 2: Roster Patterns Configuration (Optional)

Configure these string properties:

**Pattern Entity Name:**
```
MyModule.RosterPattern
```
Format: `ModuleName.EntityName`

**Pattern to User Association:**
```
RosterPattern_DriverInfo/DriverInfo_TenantUser
```
Format: Association path from RosterPattern to User entity

**Pattern Start Date Attribute:**
```
StartDate
```

**Pattern End Date Attribute:**
```
EndDate
```

---

### Step 3: Pattern Days Configuration (Optional)

**Pattern Day Entity Name:**
```
MyModule.PatternDay
```

**PatternDay to Pattern Association:**
```
PatternDay_RosterPattern
```

**Day of Week Attribute:**
```
DayOfWeek
```

**Available Attribute:**
```
Available
```

---

### Step 4: Roster Days Configuration (Optional)

**Roster Day Entity Name:**
```
MyModule.RosterDay
```

**RosterDay to User Association:**
```
RosterDay_DriverInfo/DriverInfo_TenantUser
```

**Date Attribute:**
```
Date
```

**Hours Attribute:**
```
Hours
```

**Type Attribute:**
```
DayType
```

---

## Finding Your Configuration Values

### 1. Module Name

Open your domain model in Studio Pro:
- The module name appears at the top
- Example: `MyFirstModule`, `RosterManagement`, `HR`

Full entity name format: `{ModuleName}.{EntityName}`
- Example: `MyFirstModule.RosterPattern`

### 2. Association Names

Right-click an association line in your domain model → Properties:
- Name: `RosterPattern_DriverInfo`
- This is what you enter!

For multi-hop associations (e.g., Pattern → DriverInfo → User):
```
RosterPattern_DriverInfo/DriverInfo_TenantUser
```

### 3. Attribute Names

Click on an entity → Attributes tab:
- You'll see attribute names: `StartDate`, `EndDate`, `Hours`, etc.
- Enter these exactly as shown (case-sensitive!)

---

## Example Configuration

### Your Domain Model:
```
Module: RosterManagement

TenantUser
  ↑ 1:1 (Association: DriverInfo_TenantUser)
DriverInfo
  ↑ M:1 (Association: RosterPattern_DriverInfo)
RosterPattern
  - StartDate (DateTime)
  - EndDate (DateTime)
  ↑ M:1 (Association: PatternDay_RosterPattern)
PatternDay
  - DayOfWeek (Enum)
  - Available (Boolean)

DriverInfo
  ↑ M:1 (Association: RosterDay_DriverInfo)
RosterDay
  - Date (DateTime)
  - Hours (Decimal)
  - DayType (Enum)
```

### Widget Configuration:

**Users Data Source:**
- Entity: `TenantUser`
- User Name: `FullName`

**Roster Patterns:**
- Entity Name: `RosterManagement.RosterPattern`
- User Association: `RosterPattern_DriverInfo/DriverInfo_TenantUser`
- Start Date Attr: `StartDate`
- End Date Attr: `EndDate`

**Pattern Days:**
- Entity Name: `RosterManagement.PatternDay`
- Pattern Association: `PatternDay_RosterPattern`
- Day of Week Attr: `DayOfWeek`
- Available Attr: `Available`

**Roster Days:**
- Entity Name: `RosterManagement.RosterDay`
- User Association: `RosterDay_DriverInfo/DriverInfo_TenantUser`
- Date Attr: `Date`
- Hours Attr: `Hours`
- Type Attr: `DayType`

---

## How It Works Behind the Scenes

### When Widget Loads:

1. **Users Datasource** retrieves 10 users (paginated)
2. **Extract User IDs**: `['user1', 'user2', 'user3', ...]`
3. **Calculate Date Range**: `2026-08-18 to 2026-08-24` (for week view)

### Client API Queries (Automatic):

**Roster Patterns Query:**
```javascript
mx.data.get({
  xpath: "//RosterManagement.RosterPattern" +
         "[RosterPattern_DriverInfo/DriverInfo_TenantUser/id = ('user1', 'user2', ...)]" +
         "[StartDate <= '2026-08-24'][EndDate >= '2026-08-18']"
});
```

**Pattern Days Query:**
```javascript
mx.data.get({
  xpath: "//RosterManagement.PatternDay" +
         "[PatternDay_RosterPattern/id = ('pattern1', 'pattern2', ...)]"
});
```

**Roster Days Query:**
```javascript
mx.data.get({
  xpath: "//RosterManagement.RosterDay" +
         "[RosterDay_DriverInfo/DriverInfo_TenantUser/id = ('user1', 'user2', ...)]" +
         "[Date >= '2026-08-18'][Date <= '2026-08-24']"
});
```

All queries execute **server-side** with database-level filtering!

---

## Console Logging

Open browser console (F12) to see detailed logs:

```
📊 [RosterCalendar] Users Data Source Retrieved:
  → Total items from DB: 11
  → Page 1, Page Size: 10
  → Displaying 10 users on this page
  → User IDs: ["123", "456", ...]

🔄 [RosterCalendar] Fetching data via Client API...
  → Date range: 2026-08-18 to 2026-08-24

📋 [RosterCalendar] Fetching Roster Patterns:
  → XPath: //RosterManagement.RosterPattern[...]
  ✅ Retrieved 15 patterns from server

📅 [RosterCalendar] Fetching Pattern Days:
  → XPath: //RosterManagement.PatternDay[...]
  ✅ Retrieved 105 pattern days from server

🗓️  [RosterCalendar] Fetching Roster Days:
  → XPath: //RosterManagement.RosterDay[...]
  ✅ Retrieved 42 roster days from server

📊 [RosterCalendar] === SUMMARY ===
  Page: 1 of 5
  Users displayed: 10
  Roster patterns (server-filtered): 15
  Pattern days (server-filtered): 105
  Roster days (server-filtered): 42
  Calendar rows: 10
  Date range: 7 days
=============================
```

**Compare "Retrieved X from server"** - should be small numbers!

---

## Troubleshooting

### Error: "mx is not defined"

**Problem:** Mendix Client API not available  
**Solution:** Make sure you're running in actual Mendix runtime, not preview mode

### Error in console: "Invalid XPath"

**Possible causes:**
1. Wrong module name (case-sensitive!)
2. Wrong association name
3. Wrong entity name
4. Typo in configuration

**Debug:**
- Check console logs for the exact XPath being executed
- Copy entity/association names exactly from Studio Pro

### No data showing up

**Check:**
1. Console logs - Are queries returning data?
2. Association paths - Correct direction?
3. Attribute names - Exact match (case-sensitive)?
4. Data exists in database for current users and date range?

### Association path syntax

**Single association:**
```
RosterDay_DriverInfo
```

**Multi-hop association:**
```
RosterDay_DriverInfo/DriverInfo_TenantUser
```

**Wrong:**
```
RosterDay.DriverInfo.TenantUser  ❌ (uses dots instead of /)
```

---

## Performance Comparison

### Before (Datasource approach):
```
Page 1 (10 users):
  DB Queries: 4
  Records Retrieved: 10 + 5000 + 35000 + 50000 = 90,010
  Records Used: 10 + 15 + 105 + 42 = 172
  Efficiency: 0.19%  ⚠️
```

### After (Client API approach):
```
Page 1 (10 users):
  DB Queries: 4
  Records Retrieved: 10 + 15 + 105 + 42 = 172
  Records Used: 172
  Efficiency: 100%  ✅
```

**Result:** 99.8% reduction in data transfer!

---

## Optional: Disable Console Logging

To remove console logs in production, search for `console.log` in `RosterCalendar.jsx` and comment them out.

---

## Next Steps

1. **Configure widget** with your module/entity/association names
2. **Check console logs** to verify queries are working
3. **Test pagination** - each page should only load data for those users
4. **Test date navigation** - week/month changes should trigger new queries
5. **Monitor performance** - check browser network tab for query efficiency

Enjoy server-side filtering with no Mendix page changes! 🚀
