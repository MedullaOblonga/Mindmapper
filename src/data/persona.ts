/*
 * "About you": a structured portrait of the astronaut, written with them before launch.
 * SIMULATED content. The categories follow evidence-based sources used in astronaut psychological
 * assessment and long-duration analog research; the instrument named on each category is what a
 * real version would draw from. Nothing here is a score or a diagnosis.
 */
export interface PersonaItem { id: string; text: string; source: string; }
export interface PersonaCategory { id: string; title: string; basis: string; usedFor: string; items: PersonaItem[]; }

export const PERSONA_NOTE = 'Written with you before launch, from your psychological interview and short questionnaires. You can change or remove any line, and add your own. The tool uses this to word things the way you prefer and to offer the right kind of help. It never uses it to judge you.';

export const PERSONA: PersonaCategory[] = [
  {
    id: 'traits', title: 'Temperament', basis: 'Five-factor personality model (as in NEO-PI-R style inventories used in astronaut selection research)',
    usedFor: 'How strongly the tool words things, and how much it repeats itself.',
    items: [
      { id: 't1', text: 'Very conscientious. Keeps lists and finishes the checklist before resting.', source: 'Questionnaire, day −60' },
      { id: 't2', text: 'Moderately introverted. Recharges alone after crew time; prefers one-to-one over groups.', source: 'Questionnaire, day −60' },
      { id: 't3', text: 'Steady under sudden stress. Worry builds slowly over weeks rather than in a moment.', source: 'Interview, day −58' },
      { id: 't4', text: 'Curious and visual: sketches from memory, reads history.', source: 'Interview, day −58' },
      { id: 't5', text: 'Agreeable. Tends to go quiet rather than argue.', source: 'Questionnaire, day −60' },
    ],
  },
  {
    id: 'comms', title: 'How you like to communicate', basis: 'NASA expeditionary behaviour competencies: communication',
    usedFor: 'How drafts in the Talk sheet are written, and who is suggested first.',
    items: [
      { id: 'c1', text: 'Point first, detail after. Short sentences.', source: 'Your own words, day −41' },
      { id: 'c2', text: 'Hard topics in writing, not on a live call.', source: 'Interview, day −58' },
      { id: 'c3', text: 'Prefers to be asked, not told.', source: 'Your own words, day −41' },
      { id: 'c4', text: 'Best time to talk: after dinner. Not right before sleep.', source: 'Interview, day −58' },
      { id: 'c5', text: 'Uses dry humour to take the edge off. Do not read it as “fine”.', source: 'Your own words, day −41' },
    ],
  },
  {
    id: 'coping', title: 'How you cope', basis: 'Brief COPE (problem-focused and emotion-focused coping)',
    usedFor: 'Which things to do the tool offers first.',
    items: [
      { id: 'k1', text: 'Problem-solving first: makes a plan, then feels better.', source: 'Questionnaire, day −60' },
      { id: 'k2', text: 'Hands-on distraction helps: greenhouse, cooking, fixing something.', source: 'Interview, day −58' },
      { id: 'k3', text: 'Rarely vents to people. Uses the diary for that instead.', source: 'Interview, day −58' },
      { id: 'k4', text: 'Guided meditation audio does not help and can annoy.', source: 'Your own words, day −41' },
    ],
  },
  {
    id: 'rhythm', title: 'Sleep and daily rhythm', basis: 'Morningness–Eveningness Questionnaire (chronotype); Karolinska Sleepiness Scale anchors',
    usedFor: 'When the bedtime light comes on, and which nights count as late.',
    items: [
      { id: 'r1', text: 'Moderate morning type. Natural sleep about 22:45 to 06:30.', source: 'Questionnaire, day −60' },
      { id: 'r2', text: 'Staying up past midnight is an early sign for you, not a habit.', source: 'Your own words, day −41' },
      { id: 'r3', text: 'Sharpest before lunch. Plan hard thinking for the morning.', source: 'Interview, day −58' },
    ],
  },
  {
    id: 'social', title: 'People and group living', basis: 'NASA expeditionary behaviour: group living and team care; support mapping',
    usedFor: 'Who the Talk sheet suggests for each kind of problem.',
    items: [
      { id: 's1', text: 'Needs about an hour alone each day.', source: 'Interview, day −58' },
      { id: 's2', text: 'Closest on the crew: Ravi (chess). Work questions: Ana. Medical: Mei.', source: 'Support map, day −41' },
      { id: 's3', text: 'At home: Sam (partner) first, then Mom.', source: 'Support map, day −41' },
      { id: 's4', text: 'Group games are not restful.', source: 'Your own words, day −41' },
    ],
  },
  {
    id: 'conflict', title: 'When there is friction', basis: 'Thomas–Kilmann conflict modes',
    usedFor: 'How the tool suggests raising a crew problem.',
    items: [
      { id: 'f1', text: 'Accommodates first, then avoids. Raises things late.', source: 'Questionnaire, day −60' },
      { id: 'f2', text: 'A private one-to-one works better than a group debrief.', source: 'Interview, day −58' },
    ],
  },
  {
    id: 'values', title: 'What matters to you', basis: 'Values and motivation interview (self-determination theory: competence, relatedness, autonomy)',
    usedFor: 'Which things to do are offered as meaningful, not just restful.',
    items: [
      { id: 'v1', text: 'Being useful to the crew. Competence matters more than credit.', source: 'Interview, day −58' },
      { id: 'v2', text: 'Family is the anchor. Birthdays and anniversaries matter a lot.', source: 'Interview, day −58' },
      { id: 'v3', text: 'Wants to choose how to handle things. Does not like being managed.', source: 'Your own words, day −41' },
    ],
  },
  {
    id: 'stressors', title: 'Stressors you named', basis: 'Pre-flight stressor interview (isolation and confinement research)',
    usedFor: 'Which changes the tool looks at more closely.',
    items: [
      { id: 'x1', text: 'Missing family milestones because of the delay or the timeline.', source: 'Interview, day −58' },
      { id: 'x2', text: 'Being rushed on safety-critical work.', source: 'Interview, day −58' },
      { id: 'x3', text: 'Noise at night in the crew quarters.', source: 'Interview, day −58' },
    ],
  },
];
