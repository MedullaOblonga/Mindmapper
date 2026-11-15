export const APP_NAME = 'Psych Navigator';
export const MISSION_LENGTH = 520;
export const LAST_DAY = 126;
export const DEFAULT_DAY = 112;
/** Delay to Earth only: the 126-day story is placed in the second half of the outbound cruise (story day 1 is cruise day 125),
    so the delay is minutes long. This offset is never shown as a day number. */
export const MISSION_DAY_OFFSET = 124;
export const missionDay = (storyDay: number) => storyDay + MISSION_DAY_OFFSET;
/** A day number as shown on screen. It is the story's own day (12, 42, 98, 112, 119), so every label matches the chapters and the text. */
export const D = (storyDay: number) => storyDay;
/** The early-mission usual, as shown on screen. */
export const USUAL_DAYS = `days ${D(15)} to ${D(56)}`;
