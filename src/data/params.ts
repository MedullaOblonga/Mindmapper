import raw from './scenario-params.json';
import type { Profile, RealGroup, WeekRow } from '../types';

export interface Chapter { id: string; day: number; label: string; route: string; caption?: string; captionA?: string; captionB?: string; }
export interface AnchorEntry { day: number; branch?: 'A' | 'B'; group: RealGroup; category: string; felt: 'good' | 'mixed' | 'hard'; text: string; }
export interface ScriptedResolution { day: number; cardKind: string; status: 'acted' | 'not-right'; reason?: string; choice: string; effect: string; setsFlag?: string; enablesReminder?: string; }

const p = raw as unknown as {
  mission: { lengthDays: number; defaultDay: number; lastDay: number; safetyCriticalBlocks: { day: number; label: string; startMin: number; endMin: number }[] };
  people: { crew: { id: string; name: string; role: string }[]; home: { id: string; name: string; role: string }[]; ground: { id: string; name: string; role: string }[] };
  groupsOrder: RealGroup[];
  weeks: WeekRow[]; weeksBranchA: WeekRow[]; weeksBranchB: WeekRow[]; weeksLater: WeekRow[];
  generation: {
    seed: number;
    journalDayIndexes: { default: number[]; week16: number[] };
    feltCycles: Record<string, ('good' | 'mixed' | 'hard')[]>;
    sleepDurationOffsetsMin: number[]; onsetOffsetsMin: number[];
    explicitOnsetMin: Record<string, number>; explicitOnsetMinBranchA: Record<string, number>; explicitOnsetMinBranchB: Record<string, number>;
    blockDayIndexes: Record<string, number[]>;
    blockTimes: Record<string, [string, number, number, string][] | [string, number, number]>;
    week6UnloggedDinners: number;
    checks: { day112am: { meanRtMs: number; lapses: number; falseStarts: number; trials: number; origin: string }; rtPatternB: number[]; lapsePatternB: number[] };
  };
  dayPartFelt: { days: number[]; morning: string[]; afternoon: string[]; evening: string[] };
  day112BlockFelt: Record<string, 'good' | 'mixed' | 'hard' | null>;
  markedMoments: { day: number; min: number; mood: 'high' | 'low' }[];
  moodMarks: { perDayByWeek: Record<string, [number, number]>; branchA: Record<string, [number, number]>; branchB: Record<string, [number, number]> };
  lightOnNights: { week16: number };
  anchorEntries: AnchorEntry[];
  profile: Profile;
  scriptedResolutions: ScriptedResolution[];
  chapters: Chapter[];
};
export const params = p;
export default p;
