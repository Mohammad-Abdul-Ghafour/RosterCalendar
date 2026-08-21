# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mendix pluggable widget called **RosterCalendar** - a customizable roster calendar that displays users or drivers as rows and dates as columns. It supports daily availability and status management for efficient workforce scheduling.

The widget is built using the Mendix Pluggable Widgets Tools framework and targets web platforms. It's distributed as an MPK (Mendix Package) file that can be imported into Mendix projects.

## Development Commands

### Building and Development
- `npm start` - Start development mode with hot reload. Watches for changes and automatically:
  - Bundles the widget
  - Outputs to `dist/` folder
  - Copies bundle to `deployment/` and `widgets/` folders for testing
- `npm run dev` - Alternative development mode for web platform (same as start but explicitly for web)
- `npm run build` - Build the widget for production (outputs to `dist/` and creates MPK in `widgets/`)

### Code Quality
- `npm run lint` - Run ESLint to check code style and quality
- `npm run lint:fix` - Automatically fix linting issues where possible

### Release
- `npm run prerelease` - Runs linting before release (automatically triggered)
- `npm run release` - Create a production release of the widget

## Widget Architecture

### Core Files Structure
- **src/RosterCalendar.jsx** - Main widget component implementation with calendar logic
- **src/RosterCalendar.xml** - Widget definition file that defines properties, capabilities, and metadata
- **src/RosterCalendar.editorConfig.js** - Studio Pro editor configuration (property visibility, validation)
- **src/RosterCalendar.editorPreview.jsx** - Preview component shown in Mendix Studio Pro
- **src/package.xml** - Package manifest defining the widget module structure
- **src/ui/RosterCalendar.css** - Widget styles with dark mode support

### Data Model Structure

The widget uses a hierarchical data model with three optional layers:

1. **Users (Required)** - Displayed as calendar rows
   - User name attribute for display

2. **RosterPattern + PatternDay (Optional)** - Weekly schedule pattern
   - RosterPattern: Defines time period (start/end dates) for a user
   - PatternDay: 7 records per pattern (Mon-Sun) with:
     - Day of week (0-6, Sunday-Saturday)
     - Availability status (Available/Unavailable)
     - Working hours (decimal)
     - Start time (datetime - only time portion displayed)
     - End time (datetime - only time portion displayed)
   - Pattern repeats weekly throughout the pattern period
   - Display: Shows "Available" with working hours and time range for available days

3. **RosterDay (Optional)** - Actual roster data for sick/leave days
   - Specific date entries that override pattern data
   - Day type: "Sick" or "Leave"
   - IsPartTime: Boolean flag indicating if this is a part-time absence
   
   **Full-time absence (IsPartTime = false):**
   - OffStartTime, OffEndTime, OffHours attributes (for tracking)
   - Display: Grey background with yellow "Sick" badge or red "Leave" badge
   
   **Part-time absence (IsPartTime = true):**
   - WorkingHours: Hours available to work
   - WorkStartTime, WorkEndTime: When the person is available
   - OffStartTime, OffEndTime, OffHours: When they're absent
   - Display: Green "Available" background with working hours, time range, and yellow "Sick" or red "Leave" badge

### Widget Configuration
The widget is defined in `RosterCalendar.xml`:
- Widget ID: `roboyo.rostercalendar.RosterCalendar`
- Requires entity context: `needsEntityContext="true"`
- Offline capable: `offlineCapable="true"`
- Platform: Web only

Properties are defined in the XML file's `<properties>` section and automatically passed to the React component.

### Editor Configuration
The `editorConfig.js` provides functions to:
- `getProperties()` - Dynamically control property visibility in Studio/Studio Pro based on other property values
- `check()` - Validate property configurations and show errors/warnings in the IDE
- `getPreview()` - Customize widget appearance in Studio Pro
- `getCustomCaption()` - Set custom widget caption in the IDE

### Build Output
- **dist/** - Compiled widget files
- **deployment/web/widgets/** - Copied for Mendix project deployment
- **widgets/roboyo.RosterCalendar.mpk** - Packaged widget file ready for distribution

## Mendix Pluggable Widget Development

### Widget Property Flow
1. Properties defined in `RosterCalendar.xml` are automatically typed and passed to the component
2. The main component receives these as props: `function RosterCalendar({ sampleText })`
3. Property changes in Studio Pro trigger re-renders in the widget

### Working with Mendix Context
- The widget requires an entity context (`needsEntityContext="true"`)
- Access to Mendix data objects, attributes, and actions happens through property configuration
- Use Mendix client APIs for data operations (provided by the framework)

### Testing the Widget
During development (`npm start`):
1. Widget is automatically bundled and copied to `deployment/` and `widgets/`
2. Import the MPK from `widgets/roboyo.RosterCalendar.mpk` into a Mendix test project
3. Test in Mendix Studio Pro or by running the Mendix project
4. Changes trigger automatic rebuild and update

## Configuration Files

- **.eslintrc.js** - Extends Mendix pluggable widgets ESLint configuration
- **prettier.config.js** - Extends Mendix prettier config with XML plugin support
- **package.json** - Widget metadata, scripts, and dependencies
  - `config.mendixHost` - Mendix runtime URL (default: http://localhost:8080)
  - `config.developmentPort` - Development server port (default: 3000)

## Dependencies

- **@mendix/pluggable-widgets-tools** - Official Mendix tooling for building pluggable widgets
- **classnames** - Utility for conditional CSS class names
- React 19.x (via overrides) - UI framework

## Package Structure

The widget is published under the package path `roboyo` and follows Mendix widget naming conventions:
- Package: `roboyo`
- Widget: `RosterCalendar`
- Full ID: `roboyo.rostercalendar.RosterCalendar`
