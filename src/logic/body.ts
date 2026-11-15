import cut from '../data/nasa/body_cutoffs.json';
import { median } from '../lib/stats';
import { mulberry32 } from '../lib/prng';
import { T } from './thresholds';
import type { CheckSession, DataTag, Scenario } from '../types';

/* Body trends: measured things only. Nothing here is rated by the astronaut.
   Every line that decides "outside" names where it comes from (basis):
     nasa-data      derived from NASA records by analysis/winscat_cutoffs.py, or from a published NASA crew dataset
     nasa-standard  a NASA requirement
     own            the person's own range; no NASA cutoff was found for the measure
     clinical       an ordinary clinical limit, not a NASA value */

export type MeasureId = 'sleep' | 'speed' | 'rhr' | 'exercise' | 'mass' | 'sbp' | 'glucose' | 'temp' | 'co2day' | 'co2sleep';
export type System = 'sleep' | 'performance' | 'heart' | 'body' | 'air';
export type Basis = 'nasa-data' | 'nasa-standard' | 'own' | 'clinical';
export interface Point { day: number; v: number }   // day + 0.5 marks an evening test

type Line =
  | { type: 'fixed'; lo: number | null; hi: number | null }
  | { type: 'pct-usual'; drop: number }      // lower edge = own usual less this share
  | { type: 'pct-first'; drop: number }      // lower edge = first reading less this share
  | { type: 'spread'; k: number };           // own usual plus or minus k robust SD

export interface MeasureDef {
  id: MeasureId; name: string; unit: string; dec: number; system: System; worse: 'low' | 'high' | 'both';
  per: 'days' | 'nights' | 'tests' | 'weeks'; minForUsual: number;
  source: string; plain: string; origin: DataTag;
  line: Line; need: number; of: number;      // outside on `need` of the last `of` readings = worth a second look
  basis: Basis; lineName: string; rule: string; from: string;
}

/** Cutoffs taken from the NASA records. See analysis/winscat_cutoffs.py. */
export const NASA = {
  speedDrop: Math.round(cut.speedDropCut * 100) / 100,   // 0.08: 5% of healthy volunteers' single tests fall this far below their own usual
  people: cut.people, sessions: cut.laterSessions,
  single: cut.atCut.single, singleCI: cut.atCut.singleCI,
  twoInRow: cut.atCut.twoInRow, twoInRowCI: cut.atCut.twoInRowCI,
  aresSessions: cut.ares.sessions, aresSingle: cut.ares.single, aresTwoInRow: cut.ares.twoInRow,
};
export const CO2_LIMIT = 3.0;      // mmHg, NASA-STD-3001 Vol 2: one-hour average in the habitable volume
export const SLEEP_SHORT_H = 6;    // Jones et al. 2022: under 6 h on the ISS went with slower PVT-B response speed
export const MASS_LOSS = 0.05;     // ISS crews lose 2 to 5% of body mass early in flight (NASA Nutritional Status Assessment)
const OWN_K = 2;                   // own-range half width in robust SDs; not a NASA value

const pct = (x: number) => `${Math.round(x * 100)}%`;

export const MEASURES: MeasureDef[] = [
  { id: 'sleep', name: 'Sleep', unit: 'h', dec: 2, system: 'sleep', worse: 'low', per: 'nights', minForUsual: 14,
    source: 'Wrist wearable, every night', plain: 'Hours asleep each night, measured by your wrist device.', origin: 'sim',
    line: { type: 'fixed', lo: SLEEP_SHORT_H, hi: null }, need: 3, of: 5, basis: 'nasa-data', lineName: 'the NASA line',
    rule: 'Under 6 hours on 3 of the last 5 nights.',
    from: 'ISS Reaction Self-Test records, 24 astronauts and 2,856 tests (Jones 2022): nights under 6 hours went with slower response speed.' },
  { id: 'speed', name: 'Reaction speed', unit: 'per s', dec: 2, system: 'performance', worse: 'low', per: 'tests', minForUsual: 6,
    source: '3-minute reaction speed test', plain: 'Responses per second on the reaction speed test. Higher is faster. Short sleep slows it.', origin: 'nasa-replay',
    line: { type: 'pct-usual', drop: NASA.speedDrop }, need: 2, of: 2, basis: 'nasa-data', lineName: 'the NASA line',
    rule: `${pct(NASA.speedDrop)} or more below your usual on two tests in a row.`,
    from: `NASA bed-rest WinSCAT records (MR085G), ${NASA.people} healthy volunteers and ${NASA.sessions} tests: ${pct(NASA.single)} of single tests fell this far below the person’s own usual, ${(NASA.twoInRow * 100).toFixed(1)}% did so twice in a row.` },
  { id: 'rhr', name: 'Resting heart rate', unit: 'bpm', dec: 0, system: 'heart', worse: 'high', per: 'days', minForUsual: 14,
    source: 'Wrist wearable, every day', plain: 'Heart rate at rest. Exercise, illness and adapting to flight all move it.', origin: 'sim',
    line: { type: 'spread', k: OWN_K }, need: 3, of: 5, basis: 'own', lineName: 'your usual range',
    rule: 'Above your own usual range on 3 of the last 5 days.',
    from: 'Your own readings from days 15 to 56. No NASA cutoff was found for this measure.' },
  { id: 'exercise', name: 'Exercise, last 7 days', unit: 'min', dec: 0, system: 'body', worse: 'low', per: 'days', minForUsual: 14,
    source: 'Exercise device log', plain: 'Minutes of exercise over the last seven days. Exercise protects bone, muscle and heart in low gravity.', origin: 'sim',
    line: { type: 'pct-usual', drop: 1 - 1 / T.ledgerRatio }, need: 3, of: 5, basis: 'own', lineName: 'your usual range',
    rule: 'Under half your own usual on 3 of the last 5 days.',
    from: 'Your own usual from days 15 to 56, with the same placeholder rule as the ledger. No NASA cutoff was found for this measure.' },
  { id: 'mass', name: 'Body mass', unit: 'kg', dec: 1, system: 'body', worse: 'low', per: 'weeks', minForUsual: 3,
    source: 'Body mass device, weekly', plain: 'Measured once a week. A steady fall can mean too little food or loss of muscle.', origin: 'sim',
    line: { type: 'pct-first', drop: MASS_LOSS }, need: 2, of: 2, basis: 'nasa-data', lineName: 'the NASA range',
    rule: 'More than 5% below your launch mass on two weekly readings in a row.',
    from: 'NASA Nutritional Status Assessment on the ISS: crews lose 2 to 5% of body mass in the first month, then hold. Past 5% is outside that range.' },
  { id: 'sbp', name: 'Blood pressure, upper', unit: 'mmHg', dec: 0, system: 'heart', worse: 'both', per: 'weeks', minForUsual: 3,
    source: 'Arm cuff, weekly body check', plain: 'The upper (systolic) number from the arm cuff.', origin: 'sim',
    line: { type: 'fixed', lo: 90, hi: 139 }, need: 1, of: 1, basis: 'clinical', lineName: 'the clinical range',
    rule: 'Latest reading under 90 or over 139 mmHg.', from: 'Ordinary clinical range. Not a NASA value.' },
  { id: 'glucose', name: 'Blood sugar, fasting', unit: 'mmol/L', dec: 1, system: 'body', worse: 'both', per: 'weeks', minForUsual: 3,
    source: 'Finger-prick meter before breakfast, weekly body check', plain: 'Sugar in your blood before breakfast.', origin: 'sim',
    line: { type: 'fixed', lo: 4.0, hi: 6.9 }, need: 1, of: 1, basis: 'clinical', lineName: 'the clinical range',
    rule: 'Latest reading under 4.0 or over 6.9 mmol/L.', from: 'Ordinary clinical range. Not a NASA value.' },
  { id: 'temp', name: 'Body temperature', unit: '°C', dec: 1, system: 'body', worse: 'both', per: 'weeks', minForUsual: 3,
    source: 'Ear thermometer, weekly body check', plain: '38.0 °C or more is a fever.', origin: 'sim',
    line: { type: 'fixed', lo: 35.5, hi: 37.9 }, need: 1, of: 1, basis: 'clinical', lineName: 'the clinical range',
    rule: 'Latest reading under 35.5 or over 37.9 °C.', from: 'Ordinary clinical range. Not a NASA value.' },
  { id: 'co2day', name: 'CO2 around you, awake', unit: 'mmHg', dec: 1, system: 'air', worse: 'high', per: 'days', minForUsual: 14,
    source: 'Collar-worn CO2 monitor, mean while awake', plain: 'Carbon dioxide in the air at your collar. Without gravity, breathed-out air can pool around you, so a wall sensor reads lower than what you breathe.', origin: 'sim',
    line: { type: 'fixed', lo: null, hi: CO2_LIMIT }, need: 2, of: 2, basis: 'nasa-standard', lineName: 'the NASA limit',
    rule: 'Daily mean at or above 3.0 mmHg two days in a row.',
    from: 'NASA-STD-3001 Volume 2: one-hour average CO2 of 3.0 mmHg or less, set from ISS crew headache reports. The limit is written for cabin air; using it for a worn sensor is this prototype’s choice.' },
  { id: 'co2sleep', name: 'CO2 around you, asleep', unit: 'mmHg', dec: 1, system: 'air', worse: 'high', per: 'nights', minForUsual: 14,
    source: 'Collar-worn CO2 monitor, mean over the sleep period', plain: 'The same monitor, clipped inside your sleep station overnight. Still air in a small space is where a pocket is most likely to build.', origin: 'sim',
    line: { type: 'fixed', lo: null, hi: CO2_LIMIT }, need: 2, of: 2, basis: 'nasa-standard', lineName: 'the NASA limit',
    rule: 'Sleep-period mean at or above 3.0 mmHg two nights in a row.',
    from: 'NASA-STD-3001 Volume 2: one-hour average CO2 of 3.0 mmHg or less, set from ISS crew headache reports. The limit is written for cabin air; using it for a worn sensor is this prototype’s choice.' },
];
export const measure = (id: MeasureId) => MEASURES.find(m => m.id === id)!;
export const BASIS_LABEL: Record<Basis, string> = { 'nasa-data': 'Line from NASA data', 'nasa-standard': 'NASA standard', own: 'Own range only', clinical: 'Clinical limit' };
export const SYSTEMS: { id: System | 'all'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'sleep', label: 'Sleep' }, { id: 'performance', label: 'Performance' },
  { id: 'heart', label: 'Heart' }, { id: 'body', label: 'Body' }, { id: 'air', label: 'Air' }];

/* ---------- series ---------- */
const HASH: Record<string, number> = { rhr: 11, mass: 23, sbp: 37, glucose: 41, temp: 53, co2day: 67, co2sleep: 79 };
/** One standard-normal draw, fixed for a measure and day. */
function noise(id: string, day: number): number {
  const r = mulberry32(HASH[id] * 100003 + day * 7919);
  let u = 0; while (!u) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
const round = (v: number, dec: number) => Math.round(v * 10 ** dec) / 10 ** dec;
/** Simulated run of nights with still air in the sleep station, to show what a pocket looks like. */
const POCKET: Record<number, number> = { 99: 0.5, 100: 0.75, 101: 0.8, 102: 0.6 };
const LAUNCH_MASS = 74.2;

export function bodySeries(s: Scenario, checks: CheckSession[], day: number): Record<MeasureId, Point[]> {
  const days = s.days.filter(d => d.day <= day);
  const gym = days.map(d => d.blocks.filter(b => b.kind === 'gym').reduce((a, b) => a + (b.endMin - b.startMin), 0));
  const daily = (id: MeasureId, f: (d: number) => number) => days.map(d => ({ day: d.day, v: round(f(d.day), measure(id).dec) }));
  const weekly = (id: MeasureId, f: (d: number) => number) => days.filter(d => d.dayIndex === 7).map(d => ({ day: d.day, v: round(f(d.day), measure(id).dec) }));
  return {
    sleep: days.map(d => ({ day: d.day, v: round(d.sleepMin / 60, 2) })),
    speed: checks.filter(c => c.counts && c.day <= day).map(c => ({ day: c.day + (c.slot === 'pm' ? 0.5 : 0), v: round(c.speed, 2) })),
    exercise: days.filter(d => d.day >= 7).map(d => ({ day: d.day, v: gym.slice(d.day - 7, d.day).reduce((a, b) => a + b, 0) })),
    rhr: daily('rhr', d => 56 + 1.5 * noise('rhr', d)),
    mass: [{ day: 1, v: LAUNCH_MASS }, ...weekly('mass', d => LAUNCH_MASS * (1 - 0.03 * (1 - Math.exp(-d / 20))) + 0.2 * noise('mass', d))],
    sbp: weekly('sbp', d => 112 + 4 * noise('sbp', d)),
    glucose: weekly('glucose', d => 5.1 + 0.25 * noise('glucose', d)),
    temp: weekly('temp', d => 36.9 + 0.15 * noise('temp', d)),
    co2day: daily('co2day', d => 2.2 + 0.12 * noise('co2day', d)),
    co2sleep: daily('co2sleep', d => 2.5 + 0.12 * noise('co2sleep', d) + (POCKET[d] ?? 0)),
  };
}

/* ---------- reading: one measure against its line ---------- */
export type Status = 'learning' | 'inside' | 'once' | 'sustained';
export interface Reading {
  def: MeasureDef; all: Point[]; points: Point[];            // points = the 28-day window
  usual: number | null; lo: number | null; hi: number | null;
  out: (p: Point) => boolean; last: Point | null; nOut: number; status: Status; statusText: string;
}
export const WINDOW_DAYS = 28;

/** Own usual: median of readings from days 15 to 56 (the app-wide rule), once there are enough of them. */
export function usualOf(points: Point[], day: number, minN: number): { usual: number; sd: number } | null {
  const xs = points.filter(p => p.day >= 15 && p.day < 57 && p.day < day).map(p => p.v);
  if (xs.length < minN) return null;
  const m = median(xs);
  return { usual: m, sd: 1.4826 * median(xs.map(x => Math.abs(x - m))) };
}

export function readMeasure(def: MeasureDef, all: Point[], day: number): Reading {
  const u = usualOf(all, day, def.minForUsual);
  let lo: number | null = null, hi: number | null = null, ready = true;
  const L = def.line;
  if (L.type === 'fixed') { lo = L.lo; hi = L.hi; }
  else if (L.type === 'pct-first') { if (all.length) lo = all[0].v * (1 - L.drop); else ready = false; }
  else if (!u) ready = false;
  else if (L.type === 'pct-usual') lo = u.usual * (1 - L.drop);   // at the edge still counts as inside
  else { lo = u.usual - L.k * u.sd; hi = u.usual + L.k * u.sd; }
  const below = (p: Point) => lo !== null && p.v < lo;
  const above = (p: Point) => hi !== null && (L.type === 'fixed' && def.worse === 'high' ? p.v >= hi : p.v > hi);
  const out = (p: Point) => ready && (def.worse === 'low' ? below(p) : def.worse === 'high' ? above(p) : below(p) || above(p));
  const points = all.filter(p => p.day > day - WINDOW_DAYS);
  const last = all.length ? all[all.length - 1] : null;
  const recent = all.slice(-def.of);
  const nOut = recent.filter(out).length;
  const status: Status = !ready || !last ? 'learning' : nOut >= def.need && recent.length >= def.need ? 'sustained' : out(last) ? 'once' : 'inside';
  const statusText = status === 'learning' ? 'Still learning your usual'
    : status === 'inside' ? `Inside ${def.lineName}`
    : status === 'once' ? `One reading outside ${def.lineName}; one is not a pattern`
    : def.of === 1 ? `Outside ${def.lineName}`
    : `Outside ${def.lineName} on ${nOut} of the last ${def.of} ${def.per}`;
  return { def, all, points, usual: u?.usual ?? null, lo, hi, out, last, nOut, status, statusText };
}

export function bodyReadings(s: Scenario, checks: CheckSession[], day: number): Reading[] {
  const series = bodySeries(s, checks, day);
  return MEASURES.map(def => readMeasure(def, series[def.id], day));
}

export const fmt = (r: Reading, v: number) => v.toFixed(r.def.dec);
export function rangeText(r: Reading): string {
  if (r.lo === null && r.hi === null) return '';
  if (r.lo === null) return `under ${fmt(r, r.hi!)} ${r.def.unit}`;
  if (r.hi === null) return `${fmt(r, r.lo)} ${r.def.unit} and above`;
  return `${fmt(r, r.lo)} to ${fmt(r, r.hi)} ${r.def.unit}`;
}

/** A note built from the numbers only. */
export function bodyDraft(readings: Reading[], day: number): string {
  const far = readings.filter(r => r.status === 'sustained');
  if (!far.length) return `Body trends, day ${day}: everything measured is inside its line.`;
  const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  return `Body trends, day ${day}. ${far.map(r => `${r.def.name}: latest ${fmt(r, r.last!.v)} ${r.def.unit}, ${lower(r.statusText)}.`).join(' ')} I would like to talk it through.`;
}
