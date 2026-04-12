function onOpen() {
   const ui = SpreadsheetApp.getUi();
   ui.createMenu("Chore Rotator")
      .addItem("TEST: Regenerate Calendar Events", "TestOnMenuRegenerateCalendarEvents")
      .addItem("TEST: Clear Calendar Events", "TestOnMenuClearCalendarEvents")
      .addSeparator()
      .addItem("Regenerate Calendar Events", "onMenuRegenerateCalendarEvents")
      .addItem("Clear Calendar Events", "onMenuClearCalendarEvents")
      .addItem("Share Calendar with Assignees", "onMenuShareCalendarWithAssignees")
      .addItem("Show Config", "onMenuShowConfig")
      .addToUi();
}

function onMenuRegenerateCalendarEvents() {
   const promptMessage = "This will delete all existing calendar events and create new ones based on the current assignees. Are you sure you want to continue?";
   if (!promptConfirmation(promptMessage)) return;
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.calendarId);
   const emailSvc = newEmailService();
   regenerateCalendar(assigneeSvc, calendarSvc, emailSvc, CONFIG.eventTitle, CONFIG.eventDescription, CONFIG.weekStartDayIndex);
}

function onMenuClearCalendarEvents() {
   const promptMessage = "This will delete all existing calendar events. Are you sure you want to continue?";
   if (!promptConfirmation(promptMessage)) return;
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.calendarId);
   deleteAllEvents(assigneeSvc, calendarSvc, CONFIG.weekStartDayIndex);
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

function onMenuShareCalendarWithAssignees() {
   promptMessage = "This will share the calendar with all assignees as readers. Are you sure you want to continue?";
   if (!promptConfirmation(promptMessage)) return;
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.calendarId);
   const emailSvc = newEmailService();
   shareCalendarWithAssignees(assigneeSvc, calendarSvc, emailSvc);
}

function promptConfirmation(message) {
   const ui = SpreadsheetApp.getUi();
   const response = ui.alert(message, ui.ButtonSet.YES_NO);
   return response === ui.Button.YES;
}

function TestOnMenuRegenerateCalendarEvents() {
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.testCalendarId);
   const emailSvc = newEmailService();
   regenerateCalendar(assigneeSvc, calendarSvc, emailSvc, CONFIG.eventTitle, CONFIG.eventDescription, CONFIG.weekStartDayIndex);
}

function TestOnMenuClearCalendarEvents() {
   const assigneeSvc = newAssigneeSheetService();
   const calendarSvc = newCalendarService(CONFIG.testCalendarId);
   deleteAllEvents(assigneeSvc, calendarSvc, CONFIG.weekStartDayIndex);
}