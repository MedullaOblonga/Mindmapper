/* Distance from Earth and one-way light time, by mission day.
   The spacecraft leaves Earth on day 0 and coasts to Mars on a minimum-energy (Hohmann) transfer, arriving on day 259.
   Earth keeps moving on its own orbit, so the gap opens slowly at first and faster later. Orbits are taken as circular
   and in one plane; radius and periods are from NASA's planetary fact sheets (NSSDCA). Real trajectories differ by a few minutes.
   The delay is that distance divided by the speed of light, for the actual mission day. No offset is applied.
   The demo ends on day 250, inside the outbound leg; after arrival the spacecraft is held at Mars. */
const AU_LIGHT_S = 499.004784;          // light time for 1 au, seconds
export const AU_KM = 149_597_870.7;
const N_EARTH = 360 / 365.256;          // degrees per day
const N_MARS = 360 / 686.98;
const R_MARS = 1.5237;                  // au
export const TRANSFER_DAYS = 258.87;    // half the period of the transfer ellipse

/** Straight-line distance from Earth to the spacecraft on a mission day, in au. */
export function distanceAu(day: number): number {
  const rad = Math.PI / 180, a = (1 + R_MARS) / 2, e = (R_MARS - 1) / (R_MARS + 1);
  const t = Math.max(0, day);
  let r: number, th: number;
  if (t <= TRANSFER_DAYS) {
    const M = Math.PI * t / TRANSFER_DAYS;
    let E = M;
    for (let i = 0; i < 12; i++) E = M + e * Math.sin(E);
    r = a * (1 - e * Math.cos(E));
    th = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  } else {
    r = R_MARS;
    th = (180 - N_MARS * TRANSFER_DAYS + N_MARS * t) * rad;
  }
  const tE = N_EARTH * t * rad;
  const dx = r * Math.cos(th) - Math.cos(tE), dy = r * Math.sin(th) - Math.sin(tE);
  return Math.sqrt(dx * dx + dy * dy);
}
export function distanceMillionKm(day: number): number { return distanceAu(day) * AU_KM / 1e6; }
/** One-way light time in minutes for that distance. */
export function delayMin(day: number): number { return distanceAu(day) * AU_LIGHT_S / 60; }

/** "2 min 35 s", for the header readout. */
export function fmtDelay(min: number): string {
  const s = Math.round(min * 60);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
}

/** "3 minutes", for sentences. */
export function delayWords(min: number): string {
  const s = Math.round(min * 60);
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`;
  const m = Math.round(min);
  return `${m} minute${m === 1 ? '' : 's'}`;
}
