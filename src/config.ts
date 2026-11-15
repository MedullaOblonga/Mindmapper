export const APP_NAME = 'Psych Navigator';
export const MISSION_LENGTH = 520;
export const LAST_DAY = 126;
export const DEFAULT_DAY = 112;
/** The 126-day story is the second half of the outbound cruise: story day 1 is mission day 125, story day 126 is mission day 250 (near Mars arrival). */
export const MISSION_DAY_OFFSET = 124;
export const missionDay = (storyDay: number) => storyDay + MISSION_DAY_OFFSET;
