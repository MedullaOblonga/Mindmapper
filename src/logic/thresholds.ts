/* Every threshold is a placeholder. NASA lists validated thresholds as an open gap (BH-102). */
export const T = {
  settlingDays: 14,          // placeholder, DESIGN §8.1
  usualWeeks: [3, 8] as const, // placeholder, DESIGN §8.1
  minWeeksForUsual: 3,       // placeholder, DESIGN §8.1
  shareRisePoints: 0.10,     // placeholder, DESIGN §8.2
  shareRiseRatio: 1.5,       // placeholder, DESIGN §8.2
  shareRiseWeeks: 3,         // placeholder, DESIGN §8.2
  hardRisePoints: 0.20,      // placeholder, DESIGN §8.2
  hardMinEntries: 5,         // placeholder, DESIGN §8.2
  sleepShortMin: 60,         // placeholder, DESIGN §8.2
  ledgerGap: 2,              // placeholder, DESIGN §8.2
  ledgerRatio: 2,            // placeholder, DESIGN §8.2
  lapseOver: 2,              // placeholder, DESIGN §8.2
  rtWobbleTimes: 3,          // placeholder, DESIGN §8.2
  rtRunSessions: 2,          // placeholder, DESIGN §8.2
  minSessionsForUsual: 6,    // placeholder, DESIGN §8.2
  newUsualWeeks: 4,          // placeholder, DESIGN §8.1
  lapseMs: 355,              // placeholder, DESIGN §8.7
  falseStartMs: 100,         // placeholder, DESIGN §8.7
  onsetLateMin: 60,          // placeholder, DESIGN §8.2
  onsetLateNights: 3,        // placeholder, DESIGN §8.2
  quietActedDays: 28,        // placeholder, DESIGN §8.2
  quietSkippedDays: 7,       // placeholder, DESIGN §8.2
  maxCardsPerWeek: 3,        // placeholder, DESIGN §8.2
};
