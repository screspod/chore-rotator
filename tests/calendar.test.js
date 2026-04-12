const {
   regenerateCalendar,
   deleteAllEvents,
   weekOffset,
   extractSeriesIds,
   assigneeColor,
   replacePlaceholders,
   currentWeekStartDate,
   findCurrentAssigneeIndex,
   shareCalendarWithAssignees,
} = require('../src/calendar');

const VALID_COLORS = ['RED', 'YELLOW', 'CYAN', 'ORANGE', 'MAUVE', 'GRAY', 'PALE_BLUE', 'PALE_GREEN', 'PALE_RED', 'BLUE', 'GREEN'];

describe('weekOffset', () => {
   it('returns 0 when index equals currentIndex', () => {
      expect(weekOffset(2, 2, 3)).toBe(0);
   });

   it('returns 1 for the next assignee in rotation', () => {
      expect(weekOffset(2, 1, 3)).toBe(1);
   });

   it('wraps around from end to start', () => {
      expect(weekOffset(0, 2, 3)).toBe(1);
   });

   it('wraps at boundary with larger total', () => {
      expect(weekOffset(0, 4, 5)).toBe(1);
   });

   it('returns correct offset for last slot from first', () => {
      expect(weekOffset(4, 0, 5)).toBe(4);
   });

   it('produces a full rotation from currentIndex 0', () => {
      const offsets = [0, 1, 2].map(i => weekOffset(i, 0, 3));
      expect(offsets).toEqual([0, 1, 2]);
   });
});

describe('extractSeriesIds', () => {
   it('returns empty array for empty input', () => {
      expect(extractSeriesIds([])).toEqual([]);
   });

   it('returns empty array when no events have recurringEventId', () => {
      const events = [{ id: 'a' }, { id: 'b' }];
      expect(extractSeriesIds(events)).toEqual([]);
   });

   it('returns all unique IDs when none repeat', () => {
      const events = [
         { recurringEventId: 'id1' },
         { recurringEventId: 'id2' },
         { recurringEventId: 'id3' },
      ];
      expect(extractSeriesIds(events)).toEqual(['id1', 'id2', 'id3']);
   });

   it('stops when a repeated ID is encountered', () => {
      const events = [
         { recurringEventId: 'id1' },
         { recurringEventId: 'id2' },
         { recurringEventId: 'id1' },
         { recurringEventId: 'id3' },
      ];
      expect(extractSeriesIds(events)).toEqual(['id1', 'id2']);
   });

   it('handles a single recurring event', () => {
      expect(extractSeriesIds([{ recurringEventId: 'only' }])).toEqual(['only']);
   });

   it('skips non-recurring events mixed in with recurring ones', () => {
      const events = [
         { id: 'plain' },
         { recurringEventId: 'id1' },
         { id: 'also-plain' },
         { recurringEventId: 'id2' },
      ];
      expect(extractSeriesIds(events)).toEqual(['id1', 'id2']);
   });
});

describe('assigneeColor', () => {
   it('returns the same color for the same name', () => {
      expect(assigneeColor('Alice')).toBe(assigneeColor('Alice'));
   });

   it('returns a color from the valid color list', () => {
      expect(VALID_COLORS).toContain(assigneeColor('Alice'));
      expect(VALID_COLORS).toContain(assigneeColor('Bob'));
      expect(VALID_COLORS).toContain(assigneeColor('Z'));
   });

   it('can return different colors for different names', () => {
      const colors = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Ken', 'Laura']
         .map(assigneeColor);
      const unique = new Set(colors);
      expect(unique.size).toBeGreaterThan(1);
   });
});

describe('replacePlaceholders', () => {
   it('replaces a single placeholder', () => {
      expect(replacePlaceholders('{name} does dishes', { name: 'Alice' })).toBe('Alice does dishes');
   });

   it('replaces multiple placeholders', () => {
      expect(replacePlaceholders('{name} does {task}', { name: 'Alice', task: 'dishes' })).toBe('Alice does dishes');
   });

   it('replaces missing key with empty string', () => {
      expect(replacePlaceholders('{name} cleans', {})).toBe(' cleans');
   });

   it('returns the template unchanged when there are no placeholders', () => {
      expect(replacePlaceholders('no placeholders here', { name: 'Alice' })).toBe('no placeholders here');
   });

   it('ignores extra keys in data', () => {
      expect(replacePlaceholders('{name}', { name: 'Bob', extra: 'ignored' })).toBe('Bob');
   });
});

describe('currentWeekStartDate', () => {
   afterEach(() => {
      jest.useRealTimers();
   });

   it('returns the same day when today is the start day (Monday)', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 15)); // Monday Jan 15
      const result = currentWeekStartDate(1);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
   });

   it('goes back to Monday when today is Wednesday', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 17)); // Wednesday Jan 17
      const result = currentWeekStartDate(1);
      expect(result.getDate()).toBe(15); // Monday Jan 15
   });

   it('returns same day when today is Sunday and start day is Sunday', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 14)); // Sunday Jan 14
      const result = currentWeekStartDate(0);
      expect(result.getDate()).toBe(14);
   });

   it('goes back to Tuesday when today is Thursday and start day is Tuesday', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 18)); // Thursday Jan 18
      const result = currentWeekStartDate(2); // Tuesday
      expect(result.getDate()).toBe(16); // Tuesday Jan 16
   });

   it('returns a date with time set to midnight', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 15, 14, 30, 0));
      const result = currentWeekStartDate(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
   });
});

describe('findCurrentAssigneeIndex', () => {
   const assignees = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }];

   beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 15)); // Monday Jan 15, weekStartDayIndex=1
   });

   afterEach(() => {
      jest.useRealTimers();
   });

   it('returns -1 for empty assignees', () => {
      expect(findCurrentAssigneeIndex([], [], 1)).toBe(-1);
   });

   it('returns 0 for a single assignee regardless of events', () => {
      expect(findCurrentAssigneeIndex([{ name: 'Alice' }], [], 1)).toBe(0);
   });

   it('finds assignee by name in event summary for week 0 using start.date format', () => {
      const events = [{ summary: "Alice's chore", start: { date: '2024-01-15' } }];
      expect(findCurrentAssigneeIndex(assignees, events, 1)).toBe(0);
   });

   it('finds assignee by name in event summary for week 0 using start.dateTime format', () => {
      const events = [{ summary: "Alice's chore", start: { dateTime: '2024-01-15T09:00:00' } }];
      expect(findCurrentAssigneeIndex(assignees, events, 1)).toBe(0);
   });

   it('finds assignee in a later week', () => {
      const events = [{ summary: 'Bob cleans', start: { date: '2024-01-22' } }]; // week 1
      expect(findCurrentAssigneeIndex(assignees, events, 1)).toBe(1);
   });

   it('returns 0 when no events match any assignee', () => {
      expect(findCurrentAssigneeIndex(assignees, [], 1)).toBe(0);
   });

   it('returns 0 when event summary does not match any assignee name', () => {
      const events = [{ summary: 'Unknown task', start: { date: '2024-01-15' } }];
      expect(findCurrentAssigneeIndex(assignees, events, 1)).toBe(0);
   });
});

describe('deleteAllEvents', () => {
   let assigneesSheetSvc;
   let calendarSvc;

   beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 15)); // Monday Jan 15, weekStartDayIndex=1
      calendarSvc = {
         getEvents: jest.fn().mockReturnValue([]),
         batchDeleteSeries: jest.fn(),
      };
   });

   afterEach(() => {
      jest.useRealTimers();
   });

   it('does nothing when assignee list is empty', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([]) };
      deleteAllEvents(assigneesSheetSvc, calendarSvc, 1);
      expect(calendarSvc.getEvents).not.toHaveBeenCalled();
      expect(calendarSvc.batchDeleteSeries).not.toHaveBeenCalled();
   });

   it('queries the correct window: weekStart to weekStart + assignees.length * 2 weeks', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }]) };
      deleteAllEvents(assigneesSheetSvc, calendarSvc, 1);
      const [from, to] = calendarSvc.getEvents.mock.calls[0];
      expect(from.getDate()).toBe(15); // Jan 15
      // 3 assignees * 2 = 6 weeks out: Jan 15 + 42 days = Feb 26
      expect(to.getDate()).toBe(26);
      expect(to.getMonth()).toBe(1); // February
   });

   it('calls batchDeleteSeries with extracted series IDs', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice' }, { name: 'Bob' }]) };
      calendarSvc.getEvents.mockReturnValue([
         { recurringEventId: 'series-1' },
         { recurringEventId: 'series-2' },
      ]);
      deleteAllEvents(assigneesSheetSvc, calendarSvc, 1);
      expect(calendarSvc.batchDeleteSeries).toHaveBeenCalledWith(['series-1', 'series-2']);
   });

   it('calls batchDeleteSeries with empty array when no recurring events exist', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice' }]) };
      calendarSvc.getEvents.mockReturnValue([{ id: 'non-recurring' }]);
      deleteAllEvents(assigneesSheetSvc, calendarSvc, 1);
      expect(calendarSvc.batchDeleteSeries).toHaveBeenCalledWith([]);
   });
});

describe('regenerateCalendar', () => {
   let assigneesSheetSvc;
   let calendarSvc;
   let emailSvc;

   beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 15)); // Monday Jan 15, weekStartDayIndex=1
      calendarSvc = {
         getEvents: jest.fn().mockReturnValue([]),
         batchDeleteSeries: jest.fn(),
         createRecurringSeries: jest.fn(),
      };
      emailSvc = { getCurrentUserEmail: jest.fn().mockReturnValue('owner@example.com') };
   });

   afterEach(() => {
      jest.useRealTimers();
   });

   it('does nothing when assignee list is empty', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name} chore', '{name} desc', 1);
      expect(calendarSvc.getEvents).not.toHaveBeenCalled();
      expect(calendarSvc.createRecurringSeries).not.toHaveBeenCalled();
   });

   it('creates one series per assignee', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice', email: 'alice@example.com' }, { name: 'Bob', email: 'bob@example.com' }]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name} chore', '{name} desc', 1);
      expect(calendarSvc.createRecurringSeries).toHaveBeenCalledTimes(2);
   });

   it('deletes existing series before creating new ones', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice', email: 'alice@example.com' }]) };
      calendarSvc.getEvents.mockReturnValue([{ recurringEventId: 'old-series' }]);
      const callOrder = [];
      calendarSvc.batchDeleteSeries.mockImplementation(() => callOrder.push('delete'));
      calendarSvc.createRecurringSeries.mockImplementation(() => callOrder.push('create'));
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name} chore', '{name} desc', 1);
      expect(callOrder).toEqual(['delete', 'create']);
   });

   it('sets weeklyInterval to the number of assignees', () => {
      const assignees = [{ name: 'Alice', email: 'alice@example.com' }, { name: 'Bob', email: 'bob@example.com' }, { name: 'Carol', email: 'carol@example.com' }];
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue(assignees) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name}', '{name}', 1);
      for (const call of calendarSvc.createRecurringSeries.mock.calls) {
         expect(call[0].weeklyInterval).toBe(3);
      }
   });

   it('substitutes assignee name into title and description', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice', email: 'alice@example.com' }]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name} chore', '{name} desc', 1);
      const args = calendarSvc.createRecurringSeries.mock.calls[0][0];
      expect(args.title).toBe('Alice chore');
      expect(args.description).toBe('Alice desc');
   });

   it('converts literal \\n in description to real newlines', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice', email: 'alice@example.com' }]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name}', 'line1\\nline2', 1);
      const args = calendarSvc.createRecurringSeries.mock.calls[0][0];
      expect(args.description).toBe('line1\nline2');
   });

   it('assigns the first week to the current assignee when no existing events', () => {
      // No existing events → findCurrentAssigneeIndex falls back to 0 (Alice)
      // Alice offset=0 → startDate = Jan 15 (weekStart)
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice', email: 'alice@example.com' }, { name: 'Bob', email: 'bob@example.com' }]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name}', '{name}', 1);
      const aliceCall = calendarSvc.createRecurringSeries.mock.calls[0][0];
      expect(aliceCall.title).toBe('Alice');
      expect(aliceCall.startDate.getDate()).toBe(15); // Jan 15
   });

   it('respects existing event rotation when determining current assignee', () => {
      // Bob is assigned this week → currentIndex=1
      // Alice offset = weekOffset(0,1,2) = 1 → Jan 22
      // Bob   offset = weekOffset(1,1,2) = 0 → Jan 15
      const assignees = [{ name: 'Alice', email: 'alice@example.com' }, { name: 'Bob', email: 'bob@example.com' }];
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue(assignees) };
      calendarSvc.getEvents.mockReturnValue([
         { summary: 'Bob chore', start: { date: '2024-01-15' } },
      ]);
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name} chore', '{name}', 1);
      const calls = calendarSvc.createRecurringSeries.mock.calls;
      const aliceCall = calls.find(c => c[0].title === 'Alice chore')[0];
      const bobCall = calls.find(c => c[0].title === 'Bob chore')[0];
      expect(bobCall.startDate.getDate()).toBe(15);  // Bob starts Jan 15 (current week)
      expect(aliceCall.startDate.getDate()).toBe(22); // Alice starts Jan 22 (next week)
   });

   it('passes assignee email as guestEmail', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice', email: 'alice@example.com' }]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name}', '{name}', 1);
      const args = calendarSvc.createRecurringSeries.mock.calls[0][0];
      expect(args.guestEmail).toBe('alice@example.com');
   });

   it('passes null guestEmail for the calendar owner', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Owner', email: 'owner@example.com' }]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name}', '{name}', 1);
      const args = calendarSvc.createRecurringSeries.mock.calls[0][0];
      expect(args.guestEmail).toBeNull();
   });

   it('passes null guestEmail when assignee has no email', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([{ name: 'Alice', email: '' }]) };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name}', '{name}', 1);
      const args = calendarSvc.createRecurringSeries.mock.calls[0][0];
      expect(args.guestEmail).toBeNull();
   });

   it('passes correct guestEmail for each assignee in a mixed list', () => {
      assigneesSheetSvc = {
         readAssignees: jest.fn().mockReturnValue([
            { name: 'Alice', email: 'alice@example.com' },
            { name: 'Owner', email: 'owner@example.com' },
            { name: 'Bob', email: '' },
         ]),
      };
      regenerateCalendar(assigneesSheetSvc, calendarSvc, emailSvc, '{name}', '{name}', 1);
      const calls = calendarSvc.createRecurringSeries.mock.calls;
      expect(calls[0][0].guestEmail).toBe('alice@example.com');
      expect(calls[1][0].guestEmail).toBeNull();
      expect(calls[2][0].guestEmail).toBeNull();
   });
});

describe('shareCalendarWithAssignees', () => {
   let assigneesSheetSvc;
   let calendarSvc;
   let emailSvc;

   beforeEach(() => {
      calendarSvc = { shareWithEmail: jest.fn() };
      emailSvc = { getCurrentUserEmail: jest.fn().mockReturnValue('owner@example.com') };
   });

   it('shares with each assignee that has an email', () => {
      assigneesSheetSvc = {
         readAssignees: jest.fn().mockReturnValue([
            { name: 'Alice', email: 'alice@example.com' },
            { name: 'Bob', email: 'bob@example.com' },
         ]),
      };
      shareCalendarWithAssignees(assigneesSheetSvc, calendarSvc, emailSvc);
      expect(calendarSvc.shareWithEmail).toHaveBeenCalledTimes(2);
      expect(calendarSvc.shareWithEmail).toHaveBeenCalledWith('alice@example.com');
      expect(calendarSvc.shareWithEmail).toHaveBeenCalledWith('bob@example.com');
   });

   it('does nothing when assignee list is empty', () => {
      assigneesSheetSvc = { readAssignees: jest.fn().mockReturnValue([]) };
      shareCalendarWithAssignees(assigneesSheetSvc, calendarSvc, emailSvc);
      expect(calendarSvc.shareWithEmail).not.toHaveBeenCalled();
   });

   it('skips assignees without an email', () => {
      assigneesSheetSvc = {
         readAssignees: jest.fn().mockReturnValue([
            { name: 'Alice', email: 'alice@example.com' },
            { name: 'Bob', email: '' },
            { name: 'Carol', email: null },
         ]),
      };
      shareCalendarWithAssignees(assigneesSheetSvc, calendarSvc, emailSvc);
      expect(calendarSvc.shareWithEmail).toHaveBeenCalledTimes(1);
      expect(calendarSvc.shareWithEmail).toHaveBeenCalledWith('alice@example.com');
   });

   it('skips the calendar owner to avoid ACL self-modification error', () => {
      assigneesSheetSvc = {
         readAssignees: jest.fn().mockReturnValue([
            { name: 'Alice', email: 'alice@example.com' },
            { name: 'Owner', email: 'owner@example.com' },
         ]),
      };
      shareCalendarWithAssignees(assigneesSheetSvc, calendarSvc, emailSvc);
      expect(calendarSvc.shareWithEmail).toHaveBeenCalledTimes(1);
      expect(calendarSvc.shareWithEmail).toHaveBeenCalledWith('alice@example.com');
      expect(calendarSvc.shareWithEmail).not.toHaveBeenCalledWith('owner@example.com');
   });
});
