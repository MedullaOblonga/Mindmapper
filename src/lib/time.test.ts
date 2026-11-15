import { fmtClock, fmtDuration, fmtLater, weekOf, dayIndex } from './time';
it('formats times', () => {
  expect(fmtClock(42)).toBe('00:42'); expect(fmtClock(-50)).toBe('23:10'); expect(fmtClock(400)).toBe('06:40');
  expect(fmtDuration(358)).toBe('5h 58m'); expect(fmtDuration(430)).toBe('7h 10m'); expect(fmtLater(92)).toBe('1 h 32 min');
  expect(weekOf(112)).toBe(16); expect(dayIndex(112)).toBe(7); expect(dayIndex(106)).toBe(1);
});
