# Conceptual model

## Metaphor: a *saathi* at the counter

The device is a **companion who stands beside you at the stall** (*saathi* = companion), not a translation machine. A good companion does three things a dictionary does not:

1. **Says it the way you would want it said** — politely, or plainly, as you choose (the politeness switch).
2. **Whispers before speaking** — tells you privately what it is about to say, and says it only when you nod (private preview / second tap).
3. **Admits when it is not sure** — "I didn't catch the price" rather than inventing one (Did you mean?, Unchecked, Blocked, "Number heard: none").

A second, physical metaphor carries the two-party part: the phone is a **slate on the counter**. It turns between buyer and seller, and the price is chalked on it in big digits that both can point at (shared number, seller screen, deal total).

## Objects and actions

| Object (what the user thinks about) | Actions | Shown as |
|---|---|---|
| **Act** — a thing to say (greet, ask freshness, counter-offer…) | pick, speak, preview, send silently | picture tile, preview card |
| **Number** — price or weight | type, nudge ±5, lift out of speech, send alone | big digits, `₹40 · 2 kg` chips |
| **Politeness level** — Respectful / Neutral / Familiar | set once, change any time | segmented switch with ✓, voice speed |
| **Turn** — one utterance by either person | hear again, replay slowly, point back at it | reply card, history row |
| **Trust light** (B) — how far to trust the sentence | speak (✓), speak with second tap (!), take another route (✕) | symbol + word + tone + vibration |
| **Deal** — the agreed price × quantity | confirm, ask UPI / pay cash | total in the largest digits on any screen |

## Mappings

- Politeness is a *persistent mode*, like a volume knob: always visible at the top, never hidden in a menu (A1: R22–R24 made politeness controllable but assumed someone would supply the level).
- One primary action per screen, at the bottom, largest target; Back always top-left.
- Colour is never the only carrier: green/amber/red trust states also differ in symbol (✓ ! ✕), wording, sound (steady tone / double beep / falling buzz) and vibration (one pulse / three short / one long).
- Numbers bypass language everywhere — the same digits appear on buyer screen, seller screen, history and deal.

## The two interaction models

```
A  choose  →  (number)  →  private preview  →  speak / show  →  seller acts  →  reply ×4
B  speak   →  numbers lifted  →  translate  →  4 checks  →  ✓ speak | ! second tap | ✕ another route
```

Both share the same layout grammar so a user who learns one can use the other.

## Design space (where our two points sit)

| Dimension | Options considered | A | B |
|---|---|---|---|
| When translation happens | authoring time · run time | authoring time | run time |
| Range of expression | closed set · open | 31 acts (10 families) | open within domain |
| Politeness guarantee | by construction · by checking · none | construction | forced + checked |
| Input | tap · speak · type | all three | all three |
| Output | audio · text · icon · digits | all four | all four |
| Error stance | guess · ask · refuse | ask (Did you mean?) | ask / refuse (Unchecked / Blocked) |
| Seller's role | passive listener · co-operator | co-operator (+/−, speak) | co-operator |
| Connectivity | cloud · hybrid · offline | offline | offline (cloud stand-in only for demo) |
| Footprint | — | ~118 MB | ~260 MB |
