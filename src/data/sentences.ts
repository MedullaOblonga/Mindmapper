import type { Felt, RealGroup } from '../types';

/* AI-written sample diary sentences (origin 'ai-sample'). Voice rules: scenario-params.json → sentenceBank. */
export const SENTENCES: Record<RealGroup, Record<Felt, string[]>> = {
  work: {
    good: [
      'The sample run finished on time. Ana and I logged it before lunch.',
      'Swapped the pump on the water loop in forty minutes. Clean work.',
      'The experiment rack booted first try today. Wrote the numbers down twice.',
      'Robotic arm practice went smoothly. Two dockings, no corrections.',
      'Finished the payload checklist an hour early and read for a while.',
      'The ground liked the sample photos. One less task on tomorrow.',
    ],
    mixed: [
      'Maintenance ran long but the filter is finally seated right.',
      'Experiment slot moved twice. Got it done after dinner instead.',
      'The laptop froze during the sample log. Lost ten minutes, saved the rest.',
      'Suit fit check took the whole morning. Gloves still feel stiff.',
      'Shift handover was quick. Ravi left a note I could not read.',
      'Timeline said thirty minutes for the repair. It took ninety.',
    ],
    hard: [
      'The sensor fault came back after I had signed it off.',
      'Behind schedule all day. Skipped the window to catch up on tasks.',
      'The valve would not seat. Three tries, then we gave up until tomorrow.',
      'Spent the afternoon redoing a sample the printer ruined.',
      'The deadline moved up a day and nobody said why.',
      'Second repair on the same pump this week. My knuckles are raw.',
    ],
  },
  home: {
    good: [
      'Sam sent a photo of the garden. The tomatoes made it.',
      'Mom read me the whole family newsletter over the call.',
      'A video from my sister. The kids sang something off key.',
      'Long letter from home today. Read it at the window.',
      'The call window lined up and Sam picked up on the first ring.',
      'Mom found my old bike in the house and sent a picture.',
    ],
    mixed: [
      'Short call with Sam. The delay made us talk over each other.',
      'Mom asked when I am home. I said the date and she went quiet.',
      'Read the family message twice. Not sure what my brother meant.',
      'The call dropped halfway. We finished it by text.',
      'Sam fixed the kitchen tap without me. Glad, and a bit left out.',
      'Message from home about the car. Nothing I can do from here.',
    ],
    hard: [
      'Missed the call window again. Sam waited and then went to bed.',
      'Mom sounded tired on the call. She said it was nothing.',
      'Wrote a letter home and did not send it.',
      'Sam had a bad week at home and I heard about it after.',
      'The house is being sold next door. They decided without me.',
      'Missed my nephew’s birthday call by four minutes.',
    ],
  },
  crew: {
    good: [
      'Ravi and I laughed at the same joke for a full minute.',
      'Crew dinner ran long. Mei told the story about the goat.',
      'Ana and I finished the inventory together and it went fast.',
      'Jonas let me take the lead on the briefing. It went fine.',
      'The whole crew watched the sunrise pass from the cupola together.',
      'Mei cut my hair in the node. Not bad at all.',
    ],
    mixed: [
      'Some tension at the briefing about the timeline. It passed.',
      'Ravi took the last coffee pouch. Said nothing, noticed it.',
      'Crew dinner was quiet. Everyone looked tired.',
      'Ana and I disagreed on the procedure and split the difference.',
      'Jonas changed the plan at the debrief. Fair, but sudden.',
      'Ate with the crew but left early to finish my notes.',
    ],
    hard: [
      'Snapped at Ravi about the tool bag. Apologised an hour later.',
      'Argument at dinner about the noise. Nobody finished their food.',
      'Mei and Jonas are not talking. The galley felt small.',
      'Nobody told me the handover moved. Waited in the node alone.',
      'The crew joke was at my expense today. I laughed anyway.',
      'Tension all day after the briefing. I kept my head down.',
    ],
  },
  body: {
    good: [
      'Slept straight through. Woke before the alarm, rested.',
      'Good treadmill session. Legs felt like legs again.',
      'The new food packs taste of something. Had seconds.',
      'Stretch routine after the gym. Back feels loose.',
      'Napped twenty minutes after lunch and the afternoon went fine.',
      'Bike session with music. Forty minutes went quickly.',
    ],
    mixed: [
      'Slept six hours. Fine by the second coffee.',
      'Headache in the morning, gone after water and food.',
      'Gym felt heavy. Did the full set anyway.',
      'Woke twice in the night. The fan was louder than usual.',
      'Ate late again. Not hungry until the evening.',
      'Shoulder sore from the resistance machine. Iced it.',
    ],
    hard: [
      'Awake from three until the alarm. Counted the panel screws.',
      'Tired all day. Read the same line on the checklist four times.',
      'Back pain after the suit session. Took the medication.',
      'Could not sleep. Lay in the bunk and listened to the fans.',
      'Skipped the meal. Not hungry and too tired to eat.',
      'Exhausted after the gym. Lay down and did not get up.',
    ],
  },
  timeoff: {
    good: [
      'Finished the history book I started on day one.',
      'Chess with Ravi. I won for once.',
      'An hour in the greenhouse. The lettuce is ready.',
      'Watched a film with the crew. Mei fell asleep halfway.',
      'Sketched the cupola view from memory. Close enough.',
      'Played the guitar for twenty minutes in my quarters.',
    ],
    mixed: [
      'Started a film and stopped after twenty minutes.',
      'Greenhouse time cut short by a call from the ground.',
      'Read a few pages of the book. Could not hold the thread.',
      'Took photos from the window. Clouds over everything.',
      'Chess game with Ravi ended in a draw after an hour.',
      'Halfway party planned for next week. Not sure I will go.',
    ],
    hard: [
      'Free hour and I did nothing with it.',
      'Sat at the window and could not enjoy the view.',
      'Dropped the sketchbook behind a panel. Gone until next week.',
      'Skipped the film night. Not in the mood for anyone.',
      'The greenhouse lights failed and the seedlings wilted.',
      'Tried to read and kept checking the clock.',
    ],
  },
  self: {
    good: [
      'I feel settled now. The routine fits.',
      'Morale was up today. Even the checklists felt short.',
      'Getting used to it. The days have a shape.',
      'I felt steady all day, which I noticed.',
      'Coping fine with the schedule this week.',
      'I feel more like myself than last month.',
    ],
    mixed: [
      'Not sure how I feel about the halfway point yet.',
      'Bored by the afternoon. Found something to do.',
      'I feel flat. Not bad, just flat.',
      'Motivation came back after lunch.',
      'Missing small things, like rain on a window.',
      'Used to it mostly. Some mornings are slower.',
    ],
    hard: [
      'Lonely tonight. The station is too quiet.',
      'I feel far from everything this week.',
      'The days blur. Hard to tell Tuesday from Friday.',
      'Felt homesick all evening and did not say so.',
      'Monotony again. Same corridor, same panels.',
      'Could not shake the low mood after the call.',
    ],
  },
  space: {
    good: [
      'Cleaned my quarters. The bunk feels new.',
      'Rearranged the locker. I can find things now.',
      'The new lighting in the node is warmer.',
      'Laundry done. Fresh socks feel like a treat.',
      'An hour alone in my quarters with the door shut.',
      'The galley smell is finally gone.',
    ],
    mixed: [
      'The fans are loud tonight. Earplugs help a bit.',
      'Storage shuffle again. Half my things are in another module.',
      'Dust behind the panel. Cleaned what I could reach.',
      'The node is cramped with the new racks in.',
      'Trash pickup late. The bags are piling up.',
      'Grey walls all day. Put a photo up.',
    ],
    hard: [
      'Noisy night. The pump cycled every twenty minutes.',
      'No privacy today. Someone in every module.',
      'The toilet broke and we used the backup all day.',
      'My quarters smell of the waste bag. Cannot fix it.',
      'Cannot find the spare clothes. The inventory is wrong.',
      'Too loud to sleep. The fan by my bunk rattles.',
    ],
  },
};

/** Default NASA category for generated sentences of each group. */
export const GROUP_CATEGORY: Record<RealGroup, string> = {
  work: 'Work', home: 'Outside Communications', crew: 'Group Interaction', body: 'Sleep',
  timeoff: 'Recreation/Leisure', self: 'Adjustment', space: 'Privacy/Personal Space',
};

/**
 * Full simulated diary entries for a cross-section of days (99 to 111), so a day reads as one journal entry.
 * One string per generated segment, in the generator's order; null keeps the story's own sentence.
 * AI-written sample text (origin 'ai-sample').
 */
export const DAY_TEXTS: Record<number, (string | null)[]> = {
  99: ['The pump on the water loop failed again, the same seal as Tuesday.', 'The suit fit check after that took the rest of the morning; the left glove still pinches.',
    'Missed the call window with Sam by six minutes because the check overran.', 'Dinner was better. Mei told the story about the goat and even Jonas laughed.', 'Went to bed feeling flat. Not bad, just flat.'],
  100: [null, 'One good thing: the experiment rack booted first try and the numbers looked clean.', 'Then the sensor fault came back on the airlock panel after I had signed it off.',
    'Sam sent a message asking if I was all right. I answered in two words.', 'Shoulder sore from the suit hours. Iced it in the bunk.'],
  102: ['The experiment slot moved twice today. Got it done after dinner.', 'My sister sent a video of the kids singing, off key and loud.',
    'Mom was on the same call and sounded tired. She said it was nothing.', 'Took a twenty-minute nap after lunch, which helped more than the coffee.'],
  103: [null, 'Robotic arm practice went well, two clean dockings.', 'A long letter from Sam came through. Read it at the window twice.',
    'Chess with Ravi after dinner. He blamed the lighting again and we both laughed.', 'Only six hours of sleep. Fine by the second coffee.'],
  105: ['Third suit day this week. The laptop froze during the log and I lost ten minutes.', 'Sam’s last message was short. I cannot tell if that is the delay or something at home.',
    'Ate with the crew but left early to finish my notes.', 'Sketched the cupola view before bed. Close enough.'],
  106: [null, 'Work went fine. Finished the payload checklist an hour early.', 'Ana and I logged the sample run together, on time for once.',
    'Sam had a bad week at home and I only heard about it after.', 'Played the guitar in my quarters for twenty minutes. My fingers remembered.'],
  107: ['Short handover from Ravi, then suit prep ran past the timeline.', 'The experiment slot moved again. Got it done after dinner.',
    'Spent the evening counting days to Sam’s birthday instead of writing to her.', 'Motivation came back a little after the gym.'],
  108: ['The ground liked the sample photos. One less task tomorrow.', 'The call window lined up for once and Sam picked up on the first ring.',
    'Ana and I finished the inventory together. It went fast with two.'],
  109: [null, 'The fan repair took ninety minutes. The timeline said thirty.', 'Mom found my old bike in the garage and sent a picture of it.', 'Jonas let me lead the briefing. It went fine.'],
  110: [null, 'Maintenance ran long, but the filter is finally seated.', 'Sam wrote about the car again. Nothing I can do from here.', 'Lay in the bunk and listened to the fans until after one.'],
  111: [null, 'Behind all day. Skipped my free hour to catch up on the log.', 'Wrote Sam a letter and did not send it.', 'Headache this morning, gone after water and food.'],
};
