function onOpen() {
   const ui = SpreadsheetApp.getUi();
   ui.createMenu("Chore Rotator")
      .addItem("TEST: Regenerate Calendar Events", "TestOnMenuRegenerateCalendarEvents")
      .addItem("TEST: Clear Calendar Events", "TestOnMenuClearCalendarEvents")
      .addSeparator()
      .addItem("Regenerate Calendar Events", "onMenuRegenerateCalendarEvents")
      .addItem("Clear Calendar Events", "onMenuClearCalendarEvents")
      .addItem("Show Config", "onMenuShowConfig")
      .addToUi();
}

function onMenuRegenerateCalendarEvents() {
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.calendarId);
   regenerateCalendar(assigneeSvc, calendarSvc, CONFIG.eventTitle, CONFIG.eventDescription, CONFIG.weekStartDayIndex);
   SpreadsheetApp.getUi().alert('Calendar regenerated.');
}

function onMenuClearCalendarEvents() {
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.calendarId);
   deleteAllEvents(assigneeSvc, calendarSvc, CONFIG.weekStartDayIndex);
   SpreadsheetApp.getUi().alert('All calendar events deleted.');
}

function onMenuShowConfig() {
   const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
   const message = [
      'Calendar ID: ' + CONFIG.calendarId,
      'Test Calendar ID: ' + CONFIG.testCalendarId,
      'Assignee Sheet Name: ' + CONFIG.assigneeSheetName,
      'Event Title: ' + CONFIG.eventTitle,
      'Week Start Day: ' + (days[CONFIG.weekStartDayIndex] || CONFIG.weekStartDayIndex) + ' [index: ' + CONFIG.weekStartDayIndex + ']',
      'Event Description:',
      CONFIG.eventDescription.replace(/\\n/g, '\n'),
   ].join('\n');
   SpreadsheetApp.getUi().alert(message);
}

function TestOnMenuRegenerateCalendarEvents() {
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.testCalendarId);
   regenerateCalendar(assigneeSvc, calendarSvc, CONFIG.eventTitle, CONFIG.eventDescription, CONFIG.weekStartDayIndex);
   SpreadsheetApp.getUi().alert('Calendar regenerated.');
}

function TestOnMenuClearCalendarEvents() {
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.testCalendarId);
   deleteAllEvents(assigneeSvc, calendarSvc, CONFIG.weekStartDayIndex);
   SpreadsheetApp.getUi().alert('All calendar events deleted.');
}
