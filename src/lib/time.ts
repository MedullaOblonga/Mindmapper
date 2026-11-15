export function weekOf(day: number): number { return Math.floor((day - 1) / 7) + 1; }
export function dayIndex(day: number): number { return ((day - 1) % 7) + 1; }
const pad = (n: number) => String(n).padStart(2, '0');
export function fmtClock(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}
export function fmtDuration(min: number): string {
  const m = Math.round(min);
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`.replace(/ 0(\d)m$/, ' $1m');
}
export function fmtLater(min: number): string {
  const m = Math.round(Math.abs(min));
  const h = Math.floor(m / 60), r = m % 60;
  if (h === 0) return `${r} min`;
  if (r === 0) return `${h} h`;
  return `${h} h ${r} min`;
}
export function weekDays(week: number): [number, number] { return [7 * week - 6, 7 * week]; }
