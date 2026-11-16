export type Group = 'work'|'home'|'crew'|'body'|'timeoff'|'self'|'space'|'other';
export type Felt = 'good'|'mixed'|'hard';
export type DataTag = 'nasa-replay'|'nasa-method'|'sim'|'ai-sample'|'user'|'nasa-journal';
export type EvidenceTag = 'nasa-use'|'earth'|'analog'|'exp'|'placeholder';
export type Branch = 'A'|'B';
/** Which simulation is running: the demo story, or a real NASA astronaut journal replayed on the Mars timeline. */
export type Source = 'demo'|'williams'|'anderson';

export interface Segment { id: string; day: number; text: string; category: string; group: Group;
  felt: Felt|null; feltBy: 'tool'|'you'; origin: DataTag; }
export interface Entry { id: string; day: number; segments: Segment[]; origin: DataTag; }

export type BlockKind = 'sleep'|'work'|'gym'|'call'|'dinner'|'greenhouse'|'meal'|'free';
export type Mood = 'high'|'low';
export interface MoodMark { min: number; blockLabel: string|null; mood: Mood; }
export interface Block { id: string; day: number; kind: BlockKind; label: string;
  startMin: number; endMin: number;            // minutes from 00:00 of `day`; sleep start may be negative
  source: 'wearable'|'timeline'|'messages'|'you'; felt: Felt|null; safetyCritical?: boolean; }

export interface DayRecord { day: number; week: number; dayIndex: number;   // dayIndex 1..7
  onsetMin: number; wakeMin: number; sleepMin: number; blocks: Block[];
  marks: MoodMark[];
  dials: { stress: number; sleepiness: number }; }

export interface CheckSession { id: string; day: number; slot: 'am'|'pm'; trials: number;
  meanRtMs: number; speed: number; lapses: number; falseStarts: number;
  durationS: number; counts: boolean; origin: DataTag; dials?: Record<string, number>; }

export type LedgerKey = 'sleep'|'suitPrepLong'|'daysSinceRest'|'callsMissed'|'noisyNights'
  |'dinners'|'callsSam'|'callsMom'|'gym'|'greenhouse'|'copingDone';
export interface LedgerItem { key: LedgerKey; side: 'draw'|'refill';
  reserve: 'rest'|'connection'|'movement'|'calm'; label: string;
  value: number; usual: number|null; earlyUsual: number|null;   // earlyUsual differs from usual only after the astronaut moved it
  scaleMax: number; sentence: string; far: boolean; away: boolean; }   // far = costly direction (cards); away = either direction (screen)

export interface Scenario { source: Source; branch: Branch; days: DayRecord[]; entries: Entry[];
  checks: CheckSession[]; weeks: WeekRow[]; profile: Profile; }   // WeekRow, Profile mirror the JSON

export type CardKind = 'topic-shift'|'own-sign'|'check'|'ledger'|'rhythm';
export type ActionKind = 'write'|'call-window'|'talk'|'own-step'|'protective'|'coping'|'reminder'|'rebuild-day';
export interface CardAction { id: string; kind: ActionKind; label: string; payload?: Record<string, unknown>; }
export interface Card { id: string;            // `${week}-${kind}-${subject}`
  week: number; day: number; kind: CardKind; subject: string;   // group id, sign id, ledger key, check slot ('am'|'pm') or 'sleep'
  title: string; statement: string; evidence: CardEvidence; actions: CardAction[]; whyKey: string; dataTag: DataTag; }
export type CardEvidence =
  | { type: 'marks'; rows: { label: string; count: number; good: number; mixed: number; hard: number }[]; group: Group }
  | { type: 'quote'; quote: string; note: string }
  | { type: 'usual-rows'; rows: { label: string; value: number; usual: number; scaleMax: number; text: string }[] }
  | { type: 'nights'; rows: { day: number; onsetMin: number; usualMin: number }[] };

export interface Resolution { cardId: string; day: number; status: 'acted'|'not-right'|'skipped';
  title: string; choice: string; effect: string; }
export interface ShareLogEntry { id: string; day: number; to: string; text: string; auto: boolean;
  kind: 'message' | 'line' | 'rule-change'; ruleId?: string;
  fixed?: boolean; source?: 'entry' | 'report'; }   // fixed line only: crossed by a diary entry match or by a report

/* ---- mirrors of scenario-params.json ---- */
export type RealGroup = Exclude<Group, 'other'>;
export interface WeekLedger { suitPrepLong: number; daysSinceRest: number; callsMissed: number; noisyNights: number;
  gym: number; greenhouse: number; dinners: number; callsSam: number; callsMom: number; }
export interface WeekRow { week: number; days: number[]; segments: Record<RealGroup, number>;
  homeFelt: { good: number; mixed: number; hard: number }; sleepMeanMin: number; onsetMeanMin: number;
  ledger: WeekLedger; dials: { stress: number; sleepiness: number }; }
export interface SignRule { metric: string; window?: string; atLeast?: number; atMost?: number; minData?: number; }
export interface Sign { id: string; quote: string; source: string; rule: SignRule; steps?: string[]; shareRuleId?: string; }
export interface ShareRule { id: string; auto: boolean; fixed?: boolean; text: string; metric: string; atLeast: number; to?: string; message?: string; }
export interface Reminder { id: string; text: string; buzz: string[]; on: boolean; fromDay: number; wristLabel: string; atMin?: number; }
export interface CopingTask { id: string; label: string; minutes: number; fits: string[]; fromPreferences: boolean;
  evidenceTag: string; evidence: string; }
export interface Profile { writtenOnDay: number; enjoys: string[]; dislikes: string[];
  supportMap: Record<string, string>; stressAnchors: Record<string, string>; signs: Sign[];
  signMetricsNote: string; shareRules: ShareRule[]; reminders: Reminder[]; reminderLimits: string[];
  copingMenu: CopingTask[]; helpedLog: { taskId: string; uses: number; medianChange: number }[]; helpedNote: string; }
