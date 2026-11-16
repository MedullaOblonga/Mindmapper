import { params } from './params';
import type { Profile } from '../types';

/* Preset self-guided CBT for thoughts of self-harm.
   Every word the astronaut reads here is fixed text in this file. Nothing is generated, and no language model
   is called at any point, so the tool cannot say something unplanned during a crisis.
   Structure: a check-in, slow breathing, naming the thought, weighing it (cognitive restructuring), a safety plan
   in the six parts of the Stanley and Brown Safety Planning Intervention, and a second check-in.
   PROTOTYPE CONTENT: written for this demo and not yet reviewed by a clinician. It supports the crew medical
   officer; it does not replace them. */

export const CBT_MINUTES = 10;
/** Check-in answers at or beyond these send the astronaut to a person first. Placeholder values. */
export const CBT_URGENT = { thoughtsAtLeast: 8, safeAtMost: 3 };

export interface Thought { id: string; text: string; balance: string[]; }
export const THOUGHTS: Thought[] = [
  { id: 'burden', text: 'They would be better off without me.', balance: [
    'This is a thought my mind makes when I am worn down. It is not a fact about the crew.',
    'The mission was planned around all of us. My work is in every checklist.',
    'The people who love me would not agree with this thought.' ] },
  { id: 'point', text: 'I can’t see the point in going on.', balance: [
    'I can’t see it right now. That is different from there being none.',
    'The point has felt far away after short sleep before, and it came back.',
    'I do not have to solve the whole mission tonight. Only the next hour.' ] },
  { id: 'never', text: 'This will never change.', balance: [
    'Feelings this strong rise and fall, even when it does not feel that way.',
    'I have had bad weeks on this mission that ended.',
    'Tonight is not the measure of the days still to come.' ] },
  { id: 'failing', text: 'I am letting everyone down.', balance: [
    'One hard stretch is not my whole record.',
    'Asking for help is part of the job. It is what I would want a crewmate to do.',
    'The crew would rather know than not know.' ] },
];
/** Questions for a thought the astronaut writes in their own words. */
export const OWN_THOUGHT_QUESTIONS = [
  'Is this a fact, or a feeling that is very strong right now?',
  'What would I say to a crewmate who thought this?',
  'What has helped a thought like this pass before?',
];

export interface PlanPart { id: 'signs' | 'alone' | 'company' | 'ask' | 'pros' | 'space' | 'reason'; title: string; hint: string; options: string[]; }
const name = (id: string) => [...params.people.crew, ...params.people.home].find(p => p.id === id)?.name ?? id;

/** The safety plan, pre-filled from what the astronaut wrote before launch. They keep what fits and add their own. */
export function planParts(profile: Profile): PlanPart[] {
  const cmo = name(profile.supportMap.medical), mate = name(profile.supportMap.work), home = name(profile.supportMap.home);
  const others = params.people.crew.filter(p => p.id !== profile.supportMap.medical && p.id !== profile.supportMap.work).map(p => p.name);
  const own = profile.copingMenu.filter(c => c.fromPreferences).map(c => c.label);
  const solo = [...own.filter(l => !/ with [A-Z]/.test(l)), ...profile.enjoys.filter(e => !own.includes(e) && !/ with |shared/i.test(e))];
  const social = [...own.filter(l => / with [A-Z]/.test(l)), ...profile.enjoys.filter(e => /shared/i.test(e)), 'Crew dinner'];
  return [
    { id: 'signs', title: 'My warning signs', hint: 'From the early signs you wrote before launch.', options: profile.signs.map(s => s.quote) },
    { id: 'alone', title: 'Things I can do on my own', hint: 'From your own list.', options: solo.slice(0, 5) },
    { id: 'company', title: 'People and places that take my mind off it', hint: 'Company, without having to talk about it.', options: social },
    { id: 'ask', title: 'People I can ask for help', hint: 'On board, face to face.', options: [cmo, mate, ...others] },
    { id: 'pros', title: 'Professional help', hint: 'Who is trained for this.', options: [`${cmo}, crew medical officer, here now`, 'Flight surgeon, by message', 'Ground psychologist, by message'] },
    { id: 'space', title: 'Making my space safer', hint: 'A short-term step, done with your crew medical officer.', options: [`Ask ${cmo} to look after anything I am worried about having near me`, `Stay where other people are until I have talked with ${cmo}`] },
    { id: 'reason', title: 'One reason to keep going', hint: 'Yours to choose.', options: [home, 'My family', 'The crew', 'Standing on Mars'] },
  ];
}

export interface CbtRatings { thoughts: number; safe: number; }
export interface CbtPlan { thought: string; balance: string[]; parts: Partial<Record<PlanPart['id'], string[]>>; }

/** The plan as plain text, for the astronaut to keep or to share with the crew medical officer if they choose. */
export function planText(plan: CbtPlan, parts: PlanPart[]): string {
  const lines = parts.filter(p => plan.parts[p.id]?.length).map(p => `${p.title}: ${plan.parts[p.id]!.join('; ')}.`);
  return ['My safety plan.', ...lines].join('\n');
}
