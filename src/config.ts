export const APP_NAME = 'Psych Navigator';
export const MISSION_LENGTH = 520;
export const LAST_DAY = 126;
export const DEFAULT_DAY = 112;
/** The 126-day story is the second half of the outbound cruise: story day 1 is mission day 125, story day 126 is mission day 250 (near Mars arrival). */
export const MISSION_DAY_OFFSET = 124;
export const missionDay = (storyDay: number) => storyDay + MISSION_DAY_OFFSET;
/** A story day as the astronaut sees it: the mission day. Use for every day number shown on screen. */
export const D = (storyDay: number) => storyDay + MISSION_DAY_OFFSET;
/** The early-mission usual (story days 15 to 56) as mission days. */
export const USUAL_DAYS = `days ${15 + MISSION_DAY_OFFSET} to ${56 + MISSION_DAY_OFFSET}`;
