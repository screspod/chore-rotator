// Deletes all existing chore events in the window and recreates them from scratch.
// Regenerating rather than updating avoids having to diff existing events against
// the current assignee list, which would be complex and error-prone.
// The window covers 2x the rotation length so findCurrentAssigneeIndex has
// enough existing events to determine who is currently assigned.
function regenerateCalendar(assigneesSheetSvc, calendarSvc, eventTitle, eventDescription, weekStartDayIndex) {
   const assignees = assigneesSheetSvc.readAssignees();
   if (assignees.length === 0) return;

   const weekStart = currentWeekStartDate(weekStartDayIndex);
   const windowEnd = assigneeStartDate(weekStart, assignees.length * 2);
   const events = calendarSvc.getEvents(weekStart, windowEnd);

   calendarSvc.batchDeleteSeries(extractSeriesIds(events));

   const currentIndex = findCurrentAssigneeIndex(assignees, events, weekStartDayIndex);
   for (const [i, assignee] of assignees.entries()) {
      const offset = weekOffset(i, currentIndex, assignees.length);
      const startDate = assigneeStartDate(weekStart, offset);
      const endDate = weekEndDate(startDate);
      calendarSvc.createRecurringSeries({
         title: replacePlaceholders(eventTitle, { name: assignee.name }),
         description: replacePlaceholders(eventDescription, { name: assignee.name }).replace(/\\n/g, '\n'),
         color: assigneeColor(assignee.name),
         startDate,
         endDate,
         weeklyInterval: assignees.length,
      });
   }
}

// Deletes all chore events within the rotation window.
// Uses the same window size as regenerateCalendar so the query covers
// exactly the events this app creates and nothing more.
function deleteAllEvents(assigneesSheetSvc, calendarSvc, weekStartDayIndex) {
   const assignees = assigneesSheetSvc.readAssignees();
   if (assignees.length === 0) return;
   const weekStart = currentWeekStartDate(weekStartDayIndex);
   const windowEnd = assigneeStartDate(weekStart, assignees.length * 2);
   const events = calendarSvc.getEvents(weekStart, windowEnd);
   calendarSvc.batchDeleteSeries(extractSeriesIds(events));
}

// Determines which assignee is currently up by scanning existing calendar events.
// Looks at each upcoming week in order and returns the index of the first assignee
// whose name appears in an event title during that week.
// Scanning forward from the current week (rather than backward) ensures we always
// anchor to the live rotation even if past events have been deleted.
// Falls back to 0 if no match is found, treating the first assignee as current.
function findCurrentAssigneeIndex(assignees, events, weekStartDayIndex) {
   if (assignees.length === 0) return -1;
   if (assignees.length === 1) return 0;

   const baseDate = currentWeekStartDate(weekStartDayIndex);
   for (let week = 0; week < assignees.length; week++) {
      const weekStart = assigneeStartDate(baseDate, week);
      const weekEnd = weekEndDate(weekStart);
      for (const event of events) {
         // Append local midnight to avoid UTC parsing shifting the date by one day in local time.
         const start = event.start.date
            ? new Date(event.start.date + 'T00:00:00')
            : new Date(event.start.dateTime);
         if (start >= weekStart && start < weekEnd) {
            const index = assignees.findIndex(a => event.summary && event.summary.includes(a.name));
            if (index !== -1) return index;
         }
      }
   }
   return 0;
}

// Returns the most recent occurrence of the configured start day at midnight.
// e.g. today is Thursday Apr 10, weekStartDayIndex is 2 (Tuesday) → returns Tuesday Apr 8
function currentWeekStartDate(weekStartDayIndex) {
   const currentStartDate = new Date();
   currentStartDate.setHours(0, 0, 0, 0);
   const daysSince = (currentStartDate.getDay() - weekStartDayIndex + 7) % 7;
   // +7 before modulo ensures the result is non-negative when today's day index
   // is less than weekStartDayIndex (e.g. today is Sunday=0, start day is Monday=1).
   currentStartDate.setDate(currentStartDate.getDate() - daysSince);
   return currentStartDate;
}

// Returns the start date for an assignee by offsetting the base date by the given number of weeks.
// e.g. baseDate is Apr 8, weekOffset is 2 → returns Apr 22
function assigneeStartDate(baseDate, weekOffset) {
   const date = new Date(baseDate);
   date.setDate(date.getDate() + weekOffset * 7);
   return date;
}

// Returns the end date of a week-long event given its start date.
// e.g. startDate is Apr 8 → returns Apr 15
function weekEndDate(startDate) {
   const date = new Date(startDate);
   date.setDate(date.getDate() + 7);
   return date;
}

// Returns the number of weeks from the current rotation week to the given assignee's week.
// e.g. index 2, currentIndex 1, total 3 → (2 - 1 + 3) % 3 = 1 (one week from now)
function weekOffset(index, currentIndex, total) {
   return (index - currentIndex + total) % total;
}

// Returns unique recurring series IDs from a list of calendar events.
// Stops when a repeated ID is found — that signals one full rotation has been seen.
function extractSeriesIds(events) {
   const ids = new Set();
   for (const event of events) {
      if (event.recurringEventId) {
         if (ids.has(event.recurringEventId)) break;
         ids.add(event.recurringEventId);
      }
   }
   return [...ids];
}

// Returns a stable color for an assignee using a polynomial hash of their name.
// The same name always maps to the same color, so events remain visually consistent
// across regenerations without storing any color state.
function assigneeColor(name) {
   const COLORS = ['RED', 'YELLOW', 'CYAN', 'ORANGE', 'MAUVE', 'GRAY', 'PALE_BLUE', 'PALE_GREEN', 'PALE_RED', 'BLUE', 'GREEN'];
   const hash = [...name].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);

   return COLORS[Math.abs(hash) % COLORS.length];
}

// Replaces {key} tokens in a template string with values from data.
// Missing keys are replaced with an empty string rather than left as-is,
// so partial data never leaks placeholder syntax into calendar event text.
function replacePlaceholders(template, data) {
   return template.replace(/{(\w+)}/g, (_, key) => data[key] || '');
}

if (typeof module !== 'undefined') {
   module.exports = {
      regenerateCalendar,
      deleteAllEvents,
      weekOffset,
      extractSeriesIds,
      assigneeColor,
      replacePlaceholders,
      currentWeekStartDate,
      findCurrentAssigneeIndex,
   };
}
