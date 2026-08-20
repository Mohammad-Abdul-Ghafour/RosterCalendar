# RosterCalendar - Expression Configuration Guide

## ✅ Widget Now Uses Object Expressions

The widget now uses **expression properties** with object return types. This allows you to write Mendix expressions that return the actual associated object, and the widget automatically extracts the ID.

## How to Configure in Studio Pro

### 1. Users Data Source (Required)

```
┌─────────────────────────────────────────────────────────┐
│ Data Sources > Users                                    │
├─────────────────────────────────────────────────────────┤
│ Users: [Database] → TenantUser                          │
│   (or DriverInfo - whatever you want as "users")        │
│                                                          │
│ User Name: FullName                                     │
└─────────────────────────────────────────────────────────┘
```

### 2. Roster Patterns Data Source

```
┌─────────────────────────────────────────────────────────┐
│ Data Sources > Roster Patterns                          │
├─────────────────────────────────────────────────────────┤
│ Roster Patterns: [Database] → RosterPattern            │
│                                                          │
│ Pattern Start Date: StartDate                           │
│ Pattern End Date: EndDate                               │
│                                                          │
│ Pattern User Expression:                                │
│   $currentObject/DriverInfo/TenantUser                  │
│                                                          │
│   ↑ WRITE AN EXPRESSION that returns the user object   │
└─────────────────────────────────────────────────────────┘
```

**Expression Examples:**

| Your Domain Model | Expression |
|-------------------|------------|
| `RosterPattern → TenantUser` (direct) | `$currentObject/TenantUser` |
| `RosterPattern → DriverInfo → TenantUser` | `$currentObject/DriverInfo/TenantUser` |
| `RosterPattern → User` (different name) | `$currentObject/User` |

### 3. Pattern Days Data Source

```
┌─────────────────────────────────────────────────────────┐
│ Data Sources > Pattern Days                             │
├─────────────────────────────────────────────────────────┤
│ Pattern Days: [Database] → PatternDay                  │
│                                                          │
│ Day of Week: DayOfWeek (Enum: Monday, Tuesday, etc.)   │
│                                                          │
│ Pattern Expression:                                      │
│   $currentObject/RosterPattern                          │
│                                                          │
│   ↑ WRITE AN EXPRESSION that returns the pattern object│
│                                                          │
│ Available / Status: Available (Boolean or Enum)         │
└─────────────────────────────────────────────────────────┘
```

**Expression Example:**
- Direct association: `$currentObject/RosterPattern`

### 4. Roster Days Data Source

```
┌─────────────────────────────────────────────────────────┐
│ Data Sources > Roster Days                              │
├─────────────────────────────────────────────────────────┤
│ Roster Days: [Database] → RosterDay                    │
│                                                          │
│ Roster Day Date: Date                                   │
│                                                          │
│ Roster Day User Expression:                             │
│   $currentObject/DriverInfo/TenantUser                  │
│                                                          │
│   ↑ WRITE AN EXPRESSION that returns the user object   │
│                                                          │
│ Hours Worked: Hours                                      │
│ Day Type: DayType (Enum)                                │
└─────────────────────────────────────────────────────────┘
```

## Complete Configuration Example

### Your Domain Model

```
TenantUser
  ↑ 1:1
DriverInfo
  ↑ M:1 (RosterPattern.DriverInfo)
  ↑ M:1 (RosterDay.DriverInfo)
RosterPattern
  ↑ M:1 (PatternDay.RosterPattern)
PatternDay
```

### Widget Configuration

**Users:**
```
Data Source: TenantUser
User Name: FullName
```

**Roster Patterns:**
```
Data Source: RosterPattern
Pattern Start Date: StartDate
Pattern End Date: EndDate
Pattern User Expression: $currentObject/DriverInfo/TenantUser
```

**Pattern Days:**
```
Data Source: PatternDay
Day of Week: DayOfWeek
Pattern Expression: $currentObject/RosterPattern
Available: Available
```

**Roster Days:**
```
Data Source: RosterDay
Roster Day Date: Date
Roster Day User Expression: $currentObject/DriverInfo/TenantUser
Hours Worked: Hours
Day Type: DayType
```

## How It Works

### Expression Property Type

In the widget XML:
```xml
<property key="patternUserExpr" type="expression">
    <returnType type="Object" isList="false" />
</property>
```

This tells Mendix:
- You can write an **expression**
- It must return an **Object** (not a string, number, etc.)
- The widget receives the actual object reference

### Widget Processing

```javascript
// Widget code extracts the ID automatically
const userObj = patternUserExpr?.get(item).value;
const userId = userObj?.id;

// Result:
// userObj = { id: "17169973579427036", ...other TenantUser properties }
// userId = "17169973579427036"
```

### Data Flow

```
1. You configure: $currentObject/DriverInfo/TenantUser
2. Mendix evaluates: Returns the TenantUser object
3. Widget receives: { id: "17169973579427036", FullName: "Driver 1", ... }
4. Widget extracts: userId = "17169973579427036"
5. Matching works: user.id === userId ✅
```

## Expression Writing Tips

### Valid Expressions

✅ `$currentObject/User`
✅ `$currentObject/DriverInfo/TenantUser`
✅ `$currentObject/Employee/Account`

### Invalid Expressions

❌ `toString($currentObject/User)` - Returns string, not object
❌ `$currentObject/User/Name` - Returns string, not object
❌ `$currentObject/User/id` - Returns string, not object

### Rule of Thumb

The expression should **end at the entity**, not continue to an attribute.

**Correct:** Navigate to the final entity
```
$currentObject → Association → Association → ENTITY ✅
```

**Wrong:** Navigate to an attribute
```
$currentObject → Association → Attribute ❌
```

## Benefits

✅ **No toString() needed** - Direct object reference
✅ **Flexible** - Works with any association path
✅ **Type-safe** - Mendix validates the expression
✅ **Clean** - Clear configuration in Studio Pro
✅ **Automatic ID extraction** - Widget handles it

## Troubleshooting

### Expression Error: "Expected object"

**Problem:** Your expression returns a string or primitive value

**Fix:** Remove attribute access, end at the entity
```
Wrong: $currentObject/User/Name
Right: $currentObject/User
```

### userId is null in console

**Problem:** Expression returns null or undefined

**Possible causes:**
1. Association is empty (no related object)
2. Expression path is incorrect
3. Association doesn't exist in domain model

**Debug:**
1. Check domain model associations
2. Verify data exists in database
3. Test expression in a text widget first

### IDs still don't match

**Problem:** User entity in "Users" data source is different from expression result

**Example:**
- Users data source: `TenantUser`
- Pattern User Expression: `$currentObject/DriverInfo` ❌

**Fix:** Ensure expressions return the same entity type as Users data source
```
Users data source: TenantUser
Pattern User Expression: $currentObject/DriverInfo/TenantUser ✅
```

## Alternative: Use DriverInfo as Users

If you want simpler expressions:

**Configuration:**
```
Users Data Source: DriverInfo
User Name: TenantUser/FullName

Pattern User Expression: $currentObject/DriverInfo
Roster Day User Expression: $currentObject/DriverInfo
```

**Benefits:**
- Shorter expressions
- Direct associations
- Simpler configuration

## Expected Console Output

After correct configuration:

```javascript
{
  "users": [
    { "id": "17169973579427036", "name": "Driver 1" }
  ],
  "rosterPatterns": [
    {
      "id": "22517998136852707",
      "userId": "17169973579427036",  // ✅ Matches!
      "startDate": "2026-07-31T14:00:00.000Z",
      "endDate": "2026-09-29T14:00:00.000Z"
    }
  ],
  "patternDays": [
    {
      "id": "22799473113563344",
      "patternId": "22517998136852707",  // ✅ Matches!
      "dayOfWeek": 1,
      "available": true
    }
  ]
}
```

## Quick Reference Card

| Property | Expression Example | Returns |
|----------|-------------------|---------|
| Pattern User Expression | `$currentObject/DriverInfo/TenantUser` | User object |
| Pattern Expression | `$currentObject/RosterPattern` | Pattern object |
| Roster Day User Expression | `$currentObject/DriverInfo/TenantUser` | User object |

**Remember:** Expression must return the **object itself**, not an attribute!

## Ready to Test

1. **Import** the updated widget MPK
2. **Add** widget to your page
3. **Configure** data sources
4. **Write expressions** that return objects
5. **Test** - Check console for matching IDs
6. **Verify** - See green/gray placeholders!

The widget will now correctly match IDs regardless of your domain model structure! 🎯
