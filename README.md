# Chore Rotator

A Google Apps Script that automates weekly chore assignments for shared households. It reads an assignee list from a Google Sheet, creates recurring week-long calendar events for each person, and automatically shifts the rotation when the list changes.

## Features

- Recurring all-day week events per assignee on a dedicated Google Calendar
- Consistent color per person based on their name
- Automatically detects who is current when the assignee list changes
- Shifts the rotation forward if the current person is removed
- No external dependencies — runs entirely within Google Apps Script

## Prerequisites

- A Google account
- A Google Sheet to manage assignees
- A dedicated Google Calendar for chore events
- [Node.js](https://nodejs.org/) 18+ (for local development and testing)
- [clasp](https://github.com/google/clasp) — Google Apps Script CLI

## Tools

| Tool | Purpose |
|------|---------|
| Google Apps Script | Runtime environment |
| Google Sheets | Assignee list |
| Google Calendar | Chore event display |
| clasp | Push/pull code to GAS |
| Jest | Unit testing |

## Development Flow

1. Edit source files locally under `src/`
2. Run tests with `npm test`
3. Push to GAS with `npx clasp push` or `npm run push`
4. Open the linked Google Sheet and use the **Chore Rotator** menu to test

## Configuration

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Set up clasp

Clasp is included as a dev dependency. Authenticate with:

```bash
npx clasp login
```

Copy the example clasp config and fill in your Script ID (found in the GAS editor under **Project Settings**):

```bash
cp .clasp.json.example .clasp.json
```

### 3. Enable the Google Calendar Advanced Service

The script uses the Calendar Advanced Service to manage recurring events.

1. Open your script: **Extensions → Apps Script**
2. In the left sidebar, click **Services (+)**
3. Find **Google Calendar API** and click **Add**

### 4. Add your Calendar ID to Script Properties

The Calendar ID is stored as a Script Property to keep it out of source code.

1. In the GAS editor, click **Project Settings** (gear icon)
2. Scroll to **Script Properties** and click **Add script property**
3. Key: `CALENDAR_ID`, Value: your Google Calendar ID
4. Click **Save script properties**

Your Calendar ID can be found in Google Calendar under **Settings → [Calendar name] → Integrate calendar**.

### 5. Update CONFIG in `src/config.js`

```js
const CONFIG = {
  assigneeSheetName: "ChoreRotation",  // name of the sheet tab with assignees
  eventTitle: "{name}'s Chore Week",   // {name} is replaced with the assignee's name
  eventDescription: "...",             // event description template
  weekStartDayIndex: 2                 // 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
};
```

### 6. Set up the assignee sheet

Create a sheet tab named to match `CONFIG.assigneeSheetName` with this structure:

| Column A | Column B |
|----------|----------|
| Name     | Email    |

Row 1 is the header. Add one assignee per row starting at row 2.

### 7. Push and run

```bash
npx clasp push
# or
npm run push
```

Open the linked Google Sheet, refresh the page, and use **Chore Rotator → Regenerate Calendar Events** to create the initial events.

## Usage

The **Chore Rotator** menu is added to the spreadsheet automatically on open.

| Menu item | Description |
|-----------|-------------|
| Regenerate Calendar Events | Deletes existing rotation events and recreates them based on the current assignee list |
| Clear Calendar Events | Removes all rotation events from the calendar |
