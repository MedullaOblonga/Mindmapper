import type { DataTag, EvidenceTag } from '../types';

export interface WhyRecord { title: string; compared: string; rule: string; tags: (DataTag | EvidenceTag)[]; source: string; }

export const USUAL_RULE = 'Prototype rule: your usual is taken from days 15 to 56, and moves only when you say so.';

export const WHY: Record<string, WhyRecord> = {
  'why.topic-shift': { title: 'Why this card?', compared: 'How much of your diary was about {topic} each week, and how those entries felt to you.',
    rule: 'Shown only when a topic takes a much bigger share than your usual for three weeks running and more of it felt difficult. A bigger share alone is not shown.',
    tags: ['ai-sample', 'placeholder'], source: 'Stuster 2010 (NASA journals study, NASA TM-2010-216130); placeholder thresholds' },
  'why.own-sign': { title: 'Why this card?', compared: 'A sign you wrote before launch, checked against your wearable.',
    rule: 'The tool adds no signs of its own.', tags: ['sim', 'analog'], source: 'Behavioral Health evidence report 2025, p.60 (self-reflection training)' },
  'why.check': { title: 'Why this card?', compared: 'Your slow responses and response time against your earlier tests.',
    rule: 'Slow means 355 ms or more, the line used for the 3-minute test ISS crews take. A single slower test is ignored: in NASA bed-rest test records, one person’s results wobble by 10 to 20 ms from session to session, so the tool waits for two in a row beyond three times your own wobble.',
    tags: ['nasa-replay', 'nasa-method', 'nasa-use'], source: 'Basner 2011; Jones 2022; NASA bed-rest performance tests (L01)' },
  'why.ledger': { title: 'Why this card?', compared: 'This week’s count against your usual from days 15 to 56.',
    rule: 'Shown when something that costs you (short sleep, long days) at least doubles, or something you usually have (dinners, calls) at least halves.',
    tags: ['sim', 'placeholder'], source: 'Placeholder thresholds; Behavioral Health evidence report 2025, p.121–123 (interacting risks)' },
  'why.rhythm': { title: 'Why this card?', compared: 'When your sleep started, from your wearable.',
    rule: 'Three nights running, an hour or more later than your usual.', tags: ['sim', 'placeholder'], source: 'HRP evidence report: Sleep (2016)' },
  'why.no-mood-score': { title: 'Why is there no mood score?', compared: '',
    rule: 'Topics carry their own tone. In NASA’s study of ISS journals, entries about recreation leaned positive and entries about equipment leaned negative, whoever wrote them. An average would mostly show what you wrote about, not how you are. So the tool compares how things felt only inside one topic, against your own usual for that topic.',
    tags: ['nasa-method'], source: 'Stuster 2010 (NASA TM-2010-216130), figure on p.54' },
  'why.usual': { title: 'Your usual', compared: '',
    rule: 'Your usual is taken from days 15 to 56. It moves only when you say a change is your new usual. The early mark stays visible.',
    tags: ['placeholder'], source: 'Prototype rule (DESIGN §8.1)' },
  'why.topics': { title: 'Where the topics come from', compared: '',
    rule: 'The topics are the 24 categories NASA used to study ten ISS astronauts’ journals. In those journals the most written-about were work, contact with home and ground, adjusting, and the crew.',
    tags: ['nasa-method'], source: 'Stuster 2010 (NASA TM-2010-216130), figure on p.9' },
  'why.sharing': { title: 'Why nothing is sent', compared: '',
    rule: 'Astronauts under-report symptoms when they fear for their flight status. So nothing leaves this device unless you send it, or unless a line agreed before launch is crossed. One of those lines is fixed, as it is on Earth: an imminent risk to you or to someone else. It is the only thing your diary is checked for, and your words are never sent.',
    tags: ['nasa-method'], source: 'Behavioral Health evidence report 2025, p.28' },
};
