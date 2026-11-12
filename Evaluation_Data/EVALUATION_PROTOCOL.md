# Evaluation protocol (hi-fi usability test)

Implements the pilot planned in Assignment 2 §9 with the working prototype. **Fill in the bracketed fields with what you actually did; do not report numbers you did not collect.**

## Method

- **Design:** within-subjects, both prototypes per participant, order counterbalanced (odd codes A→B, even B→A; assigned automatically).
- **Methods:** task-based usability test with think-aloud; observation; Single Ease Question (SEQ, 1–7) after each task; System Usability Scale (SUS) and a 5-point comfort/embarrassment item after each prototype; trust-symbol comprehension check (B); short semi-structured debrief (preference + why).
- **Setting:** [controlled — classroom/lab, phone on a table as a counter] or [natural — weekly market / campus vendors]. Background noise: [quiet / recorded market noise / real].
- **Participants:** target 6 per prototype (A2 §9.1). Round 1: participant plays the buyer, a team member plays the seller. Round 2: buyer–seller pairs. Record: [n], age bands, languages, smartphone comfort (all optional, non-identifying).
- **Apparatus:** Android phone with Chrome (or laptop in a phone frame), app in airplane mode for the offline condition; facilitator panel on a second screen or the 🧪 sheet.
- **Roles:** facilitator (reads tasks, runs Wizard-of-Oz controls), observer (notes quotes, hesitations).

## Tasks

| ID | Instruction read to the participant | Auto-armed Wizard | Goal event logged |
|---|---|---|---|
| A-T1 | You want onions. Greet the seller politely, ask the price, offer 40 rupees, and finish the deal at whatever price you agree. Pay by UPI. | – (facilitator plays seller) | deal |
| A-T2 | Tell the seller the onions look a bit old, but without anyone nearby hearing it. | – | show:old |
| A-T3 | Use your voice to make a counter-offer. | recogniser → noisy (unsure) | send:counter |
| A-T4 | The seller replied too fast. Hear his reply again more slowly, then reply "too much". | seller reply ₹55 pre-loaded | send:tooexp |
| A-T5 | Get the seller to show you his price as a number. | seller → long story | repair:shownum |
| B-T1 | Tell the seller in your own words that the onions look old and you will pay 40 rupees for 2 kg. Finish the deal. | verifier → all pass | deal |
| B-T2 | Say the same thing again. Decide whether to speak it, and explain why. | verifier → politeness fails | decide:unchecked |
| B-T3 | Get your price across to the seller anyway. | verifier → number lost (Blocked) | recover:blocked |
| B-T4 | Get the seller to repeat more briefly. | seller → long story | repair:again |

Instructions are neutral and never name a button.

## Measures (logged automatically unless noted)

| Measure | Definition |
|---|---|
| Completion | facilitator marks ✓ Done / ~ Assisted / ✕ Gave up; the panel shows when the goal event fired |
| Time on task | start → end, seconds |
| Taps, back-presses | all taps inside the phone frame; back-presses as a proxy for wrong turns |
| Slips & recovery | error states reached (empty number, number unheard, recogniser unsure, seller unclear, Unchecked, Blocked) and whether a send/deal/repair followed |
| B5c dwell | time between seeing the second-tap guard and confirming |
| SEQ | 1–7 after each task (facilitator asks) |
| SUS | 10 items after each prototype, scored 0–100 |
| Comfort | 1 = very embarrassed … 5 = completely at ease |
| Trust comprehension (B) | for ✓, !, ✕ shown without words: correct / confused |
| Preference | A / B / none + reason (verbatim, no names) |
| Seller (pairs) | "did it slow you down?" 1–5 + what he had to do |

## Decision rules (A2 §9.3, computed on the Results screen)

1. > 1/3 of participants confuse Unchecked with Blocked → merge the two states.
2. Most B5c confirmations < 1.5 s → replace the second tap with a spoken confirmation.
3. Sellers' "slowed down" mean ≥ 4/5 → reduce seller controls to +/− only.

## Ethics, risks and mitigation

**Statement read to every participant** (also on the consent screen):

> Participation is voluntary. You can stop at any time without giving a reason, and nothing happens if you do. We test the app, not you. We do not record audio or video and we do not collect your name, phone number or any sensitive data; you are identified only by a random code. Speech you say into the app is used only to run the task and is not stored. Sessions take about 20 minutes; tell us if you feel tired or uncomfortable and we will pause. The anonymised task logs are used only for the CS 435 course report.

| Risk | Mitigation |
|---|---|
| Fatigue (≈ 9 tasks + questionnaires) | ≤ 20 min, break between prototypes, tasks can be skipped |
| Embarrassment / feeling tested | "we test the app, not you"; neutral task wording; facilitator never corrects |
| Privacy of speech | no audio stored; option to type or use TEST sentences; in the browser recogniser case, tell participants speech may be processed by the browser's service, or use airplane mode + typing |
| Personal data | random codes only, optional age band; no names, numbers, photos; data stays on the device until exported; delete-all button |
| Power imbalance with vendors (pairs) | no purchase is required; vendors are thanked, not paid per outcome; real money never changes hands in tasks |
| Hearing/vision discomfort | volume set before start; large text; tasks can be done by tapping |
| Supervision | facilitator present throughout; participant can stop at any moment |

## Data handling

Export from *Study → Export CSV + JSON* into `Evaluation_Data/` (tasks.csv, questionnaires.csv, participants.csv, study_raw.json). Do not add names. Delete the in-browser data after export.

## Analysis plan

Descriptives per prototype (completion %, mean ± SD time, slips/task, recovery %, SEQ, SUS, comfort); per-task table; preference counts; the three decision rules; thematic grouping of observer notes (confusions, workarounds, quotes). With n ≈ 6 report descriptively; do not claim significance.
