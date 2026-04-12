function newAssigneeSheetService() {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.assigneeSheetName);

   return {
      readAssignees() {
         if (!sheet) return [];

         const data = sheet.getDataRange().getValues();
         const assignees = [];

         for (const row of data.slice(1)) {
            if (row[ASSIGNEE_SHEET_COLUMNS.name]) {
               assignees.push({ name: row[ASSIGNEE_SHEET_COLUMNS.name], email: row[ASSIGNEE_SHEET_COLUMNS.email] });
            }
         }

         return assignees;
      }
   };
}

function newCalendarService(calendarId) {
   return {
      getEvents(startDate, endDate) {
         try {
            return Calendar.Events.list(calendarId, {
               timeMin: startDate.toISOString(),
               timeMax: endDate.toISOString(),
               singleEvents: true,
               orderBy: 'startTime',
            }).items || [];
         } catch (e) { }
         return [];
      },

      createRecurringSeries({ title, description, guestEmail, color, startDate, endDate, weeklyInterval }) {
         const calendar = CalendarApp.getCalendarById(calendarId);
         const recurrence = CalendarApp.newRecurrence().addWeeklyRule().interval(weeklyInterval);
         const series = calendar.createEventSeries(title, startDate, endDate, recurrence, { description, ...(guestEmail && { guests: guestEmail }) });
         series.setColor(CalendarApp.EventColor[color]);
         return series.getId().split('@')[0];
      },

      batchDeleteSeries(seriesIds) {
         for (const seriesId of seriesIds) {
            try {
               Calendar.Events.remove(calendarId, seriesId);
            } catch (e) {
               // Series may have been manually deleted from the calendar or already removed; ignore if not found (404) or already deleted (410)
               if (e.details && e.details.code !== 404 && e.details.code !== 410) throw e;
            }
         }
      },

      shareWithEmail(email) {
         Calendar.Acl.insert({
            role: 'reader',
            scope: { type: 'user', value: email },
         }, calendarId);
      }
   };
}

function newEmailService() {
   return {
      getCurrentUserEmail() {
         return Session.getActiveUser().getEmail();
      },
   };
}   
