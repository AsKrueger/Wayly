import { openStatusDuring, parseOpeningHours, weekdayIndex } from './opening-hours';

// 2026-11-16 is a Monday.
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 10, 16 + day, hours, minutes);

describe('parseOpeningHours', () => {
  it('understands 24/7', () => {
    const schedule = parseOpeningHours('24/7');
    expect(openStatusDuring(schedule, at(6, 3), 60)).toBe('open');
  });

  it('understands weekday ranges, lists and several spans', () => {
    const schedule = parseOpeningHours('Mo-Fr 09:00-14:00,17:00-20:30; Sa 10:00-14:00');
    expect(openStatusDuring(schedule, at(0, 10), 60)).toBe('open');
    expect(openStatusDuring(schedule, at(0, 13, 30), 60)).toBe('closed');
    expect(openStatusDuring(schedule, at(4, 17), 210)).toBe('open');
    expect(openStatusDuring(schedule, at(5, 11), 30)).toBe('open');
    expect(openStatusDuring(schedule, at(6, 11), 30)).toBe('closed');
  });

  it('lets later rules replace earlier ones for their days', () => {
    const schedule = parseOpeningHours('Mo-Su 10:00-20:00; Tu off');
    expect(openStatusDuring(schedule, at(1, 12), 30)).toBe('closed');
    expect(openStatusDuring(schedule, at(2, 12), 30)).toBe('open');
  });

  it('handles day lists with ranges, wrapping ranges and rules without days', () => {
    expect(openStatusDuring(parseOpeningHours('Mo,We-Th 08:00-10:00'), at(3, 8), 30)).toBe('open');
    expect(openStatusDuring(parseOpeningHours('Mo,We-Th 08:00-10:00'), at(1, 8), 30)).toBe('closed');
    expect(openStatusDuring(parseOpeningHours('Fr-Mo 12:00-16:00'), at(6, 13), 30)).toBe('open');
    expect(openStatusDuring(parseOpeningHours('Fr-Mo 12:00-16:00'), at(2, 13), 30)).toBe('closed');
    expect(openStatusDuring(parseOpeningHours('10:00-18:00'), at(2, 11), 60)).toBe('open');
    expect(openStatusDuring(parseOpeningHours('Su closed; Mo-Sa 24/7'), at(6, 11), 60)).toBe('closed');
  });

  it('handles spans past midnight and open ends', () => {
    const bar = parseOpeningHours('Fr-Sa 20:00-02:00');
    expect(openStatusDuring(bar, at(4, 23), 60)).toBe('open');
    expect(openStatusDuring(bar, at(5, 1), 30)).toBe('open');
    expect(openStatusDuring(bar, at(5, 1, 45), 30)).toBe('closed');
    expect(openStatusDuring(bar, at(0, 1), 30)).toBe('closed');
    expect(openStatusDuring(parseOpeningHours('Mo-Su 18:00+'), at(0, 22), 60)).toBe('open');
    expect(openStatusDuring(parseOpeningHours('Mo 10:00-24:00'), at(0, 23), 60)).toBe('open');
  });

  it.each([
    undefined,
    '',
    'Jan-Mar Mo-Fr 10:00-14:00',
    'Mo-Fr 09:00-14:00; PH off',
    'sunrise-sunset',
    'Mo-Fr 9-14',
    'Mo-Fr 25:00-26:00',
    'Mo-Fr 09:60-10:00',
    'Mo-Fr 10:00-12:00-14:00',
    'Mo-Fr 24:00-02:00',
    'Mo-Xx 10:00-12:00',
    'Mo-Fr 10:00+30',
    '"by appointment"',
    ';',
  ])('returns unknown for %p', (value) => {
    expect(parseOpeningHours(value)).toBeNull();
    expect(openStatusDuring(parseOpeningHours(value), at(0, 12), 30)).toBe('unknown');
  });
});

describe('weekdayIndex', () => {
  it('starts the week on Monday', () => {
    expect(weekdayIndex(at(0, 12))).toBe(0);
    expect(weekdayIndex(at(6, 12))).toBe(6);
  });
});
