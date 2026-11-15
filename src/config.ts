export const APP_NAME = 'Psych Navigator';
export const MISSION_LENGTH = 520;
export const LAST_DAY = 250;
export const DEFAULT_DAY = 112;
/** A day number as shown on screen. It is the mission day itself: days 1 to 126 are the story, days 127 to 250 the quiet continuation. */
export const D = (day: number) => day;
/** The early-mission usual, as shown on screen. */
export const USUAL_DAYS = `days ${D(15)} to ${D(56)}`;
