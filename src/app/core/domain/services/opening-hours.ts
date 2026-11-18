/**
 * Interpreter for the most common subset of the OpenStreetMap
 * `opening_hours` syntax:
 *
 * - `24/7`
 * - weekday ranges and lists: `Mo-Fr`, `Mo,We,Fr`, `Mo-Fr,Su`
 * - several time spans: `09:00-14:00,17:00-20:30`
 * - spans past midnight: `20:00-02:00`
 * - open end: `18:00+` (treated as open until midnight)
 * - `off` / `closed`
 * - rules separated by `;`; a later rule replaces earlier ones for its days
 *
 * Anything else (months, dates, public holidays, sunrise, comments…) makes
 * the whole value unknown: Wayly never guesses opening hours.
 */

/** Minutes from midnight; an end above 1440 means the span continues the next day. */
export interface TimeSpan {
  readonly start: number;
  readonly end: number;
}

/** Index 0 is Monday, 6 is Sunday. */
export type WeeklySchedule = readonly (readonly TimeSpan[])[];

export type OpenStatus = 'open' | 'closed' | 'unknown';

const DAYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];
const FULL_DAY: TimeSpan = { start: 0, end: 1440 };

function parseClock(text: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) {
    return null;
  }
  return hours * 60 + minutes;
}

function parseDays(text: string): number[] | null {
  const days = new Set<number>();
  for (const part of text.split(',')) {
    const [from, to] = part.split('-').map((day) => DAYS.indexOf(day.trim().toLowerCase()));
    if (from < 0 || (to !== undefined && to < 0)) {
      return null;
    }
    if (to === undefined) {
      days.add(from);
      continue;
    }
    for (let day = from; ; day = (day + 1) % 7) {
      days.add(day);
      if (day === to) {
        break;
      }
    }
  }
  return [...days];
}

function parseSpans(text: string): TimeSpan[] | null {
  const spans: TimeSpan[] = [];
  for (const part of text.split(',')) {
    const trimmed = part.trim();
    if (/^\d{1,2}:\d{2}\+$/.test(trimmed)) {
      const start = parseClock(trimmed.slice(0, -1));
      if (start === null) {
        return null;
      }
      spans.push({ start, end: 1440 });
      continue;
    }
    const [from, to, extra] = trimmed.split('-');
    if (extra !== undefined || to === undefined) {
      return null;
    }
    const start = parseClock(from);
    const end = parseClock(to);
    if (start === null || end === null || start === 1440) {
      return null;
    }
    spans.push({ start, end: end <= start ? end + 1440 : end });
  }
  return spans;
}

/** Parses an `opening_hours` value, or returns `null` when it cannot be understood. */
export function parseOpeningHours(value: string | undefined): WeeklySchedule | null {
  const text = value?.trim();
  if (!text) {
    return null;
  }
  if (text === '24/7') {
    return DAYS.map(() => [FULL_DAY]);
  }

  const week: TimeSpan[][] = DAYS.map(() => []);
  let anyRule = false;

  for (const rawRule of text.split(';')) {
    const rule = rawRule.trim();
    if (!rule) {
      continue;
    }
    const tokens = rule.split(/\s+/);
    let days = [0, 1, 2, 3, 4, 5, 6];
    if (/^[A-Za-z]{2}([,-][A-Za-z]{2})*$/.test(tokens[0])) {
      const parsedDays = parseDays(tokens.shift() ?? '');
      if (!parsedDays) {
        return null;
      }
      days = parsedDays;
    }
    if (tokens.length !== 1) {
      return null;
    }
    const timePart = tokens[0].toLowerCase();
    let spans: TimeSpan[];
    if (timePart === 'off' || timePart === 'closed') {
      spans = [];
    } else if (timePart === '24/7') {
      spans = [FULL_DAY];
    } else {
      const parsed = parseSpans(timePart);
      if (!parsed) {
        return null;
      }
      spans = parsed;
    }
    for (const day of days) {
      week[day] = [...spans];
    }
    anyRule = true;
  }

  return anyRule ? week : null;
}

/** Monday-based weekday index of a date in local time. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Whether the place stays open for the whole visit, starting at `start`.
 * Spans that cross midnight from the previous day are taken into account.
 */
export function openStatusDuring(
  schedule: WeeklySchedule | null,
  start: Date,
  durationMinutes: number,
): OpenStatus {
  if (!schedule) {
    return 'unknown';
  }
  const day = weekdayIndex(start);
  const minute = start.getHours() * 60 + start.getMinutes();
  const end = minute + Math.max(0, durationMinutes);

  const covers = (span: TimeSpan, from: number, to: number) => span.start <= from && to <= span.end;
  const today = schedule[day].some((span) => covers(span, minute, end));
  const yesterday = schedule[(day + 6) % 7].some((span) => span.end > 1440 && covers(span, minute + 1440, end + 1440));

  return today || yesterday ? 'open' : 'closed';
}
