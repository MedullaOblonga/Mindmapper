/* Mission time helpers. Stardate is a TNG-style display date: 1000 units per year, counted from mission day 1. */
export const STARDATE_EPOCH = 47000;
export function stardate(day: number, clockMin: number): string {
  const v = STARDATE_EPOCH + ((day - 1) + clockMin / 1440) * (1000 / 365.25);
  return (Math.floor(v * 10) / 10).toFixed(1);
}

