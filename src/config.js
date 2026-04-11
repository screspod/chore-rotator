const CONFIG = {
   calendarId: PropertiesService.getScriptProperties().getProperty("CALENDAR_ID"),
   testCalendarId: PropertiesService.getScriptProperties().getProperty("TEST_CALENDAR_ID"),
   assigneeSheetName: PropertiesService.getScriptProperties().getProperty("ASSIGNEE_SHEET_NAME"),
   eventTitle: PropertiesService.getScriptProperties().getProperty("EVENT_TITLE"),
   eventDescription: PropertiesService.getScriptProperties().getProperty("EVENT_DESCRIPTION"),
   weekStartDayIndex: PropertiesService.getScriptProperties().getProperty("WEEK_START_DAY_INDEX") // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
};

const ASSIGNEE_SHEET_COLUMNS = {
   name: 0,
   email: 1,
};
