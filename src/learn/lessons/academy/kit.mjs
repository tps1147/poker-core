// THE ACADEMY V2 LESSON KIT: small pure builders shared by the node-id lesson definitions of the
// later tracks (pressure, people, theory, player, formats). They only assemble data in the shape the
// film-first definitions already use (lessons/*.mjs, scriptedHand.mjs hands), so a definition built
// here reads exactly like a hand-written one. No answer keys: the keys live in answerKeys/<node>.mjs
// at the package root, which is not shipped (package.json "files" is src only).
//
// The v2 loop (ACADEMY-LEARNING-LOOP 2026-10-07, section 2):
//   welcome -> film (pauses at its yourTurn anchor for the "Your turn" spot) -> why -> guided ->
//   practice -> fresh -> takeaway (the rule card).
// The "Your turn" spot is answered on the film frame, so it rides on the film stage as
// `pause: { at, anchor, film, spotId, spot }` (the in-film pause the shipped lessons already use).
// `at` is the film's canon.yourTurn time in seconds; a film whose canon.yourTurn is null plays to
// its stop and then asks (`at: null, anchor: "end"`).

import { TRACK_NARRATOR } from "../../narrators.mjs";

export const STREETS = Object.freeze({ 0: "preflop", 3: "flop", 4: "turn", 5: "river" });
export const streetOf = (board) => STREETS[board.length];

export const huSeats = (stack, name = "Ace Andy") => ({ hero: { name: "You", stack }, opponent: { name, stack, botId: null } });

// The film stage with its "Your turn" pause.
// `endAsk` (an "end" film only): "skip" when the film has already asked and answered its question at
// its end (the lesson hands off to the next step without asking it again), "variant" when `spot` is
// a transfer the film never answered (filmV2 filmAskPlan).
export function filmStage({ film, at, anchor = at == null ? "end" : "yourTurn", spotId, spot, upNext = "Play the coach’s hand", endAsk = null }) {
  return { kind: "film", label: "Film", upNext, media: film, pause: { at, anchor, film, spotId, spot, ...(endAsk ? { endAsk } : {}) } };
}

// The why stage: one tap from three reasons. `spotId` is "<lesson prefix>-why" (the prefix of the
// lesson's other spots); the server grades the pick by it (answerKeys/<node>.mjs why.spotId).
export function whyStage(spotId, prompt, options) {
  return { kind: "why", label: "Why", spotId, prompt, options };
}

// A decision stage.
export const decision = (spotId, hand, role, label, coachLine, next, extra = {}) =>
  ({ kind: "decision", label, spotId, hand, role, coachLine, next, ...extra });

// A heads-up hand on the real table. Postflop the opponent acts first when the hero has the button;
// `heroFirst` puts the button on the opponent, so the hero checks first (out of position). The
// opponent then checks or bets `bet`, the hero decides each spot in `decisions` on this one deal,
// and the last action spot (`answer`) is played on the table with `sizes`.
export function huHand(id, { hero, board = [], pot, stack = 1000, name, bet = 0, heroFirst = false, decisions, answer = null, sizes = null, blinds = null }) {
  const script = [{ do: "pause", ms: 400 }];
  if (blinds) script.unshift({ do: "blinds", sb: blinds[0], bb: blinds[1] });
  if (board.length) {
    if (heroFirst) script.push({ do: "act", seat: "hero", action: "check" });
    script.push(bet ? { do: "act", seat: "opponent", action: "bet", amount: bet } : { do: "act", seat: "opponent", action: "check" });
  }
  decisions.forEach((spotId, i) => script.push(i ? { do: "decide", spotId, when: "answered" } : { do: "decide", spotId }));
  if (answer) script.push({ do: "act", seat: "hero", action: "answer", spotId: answer, ...(sizes ? { sizes } : {}) });
  return {
    id, layout: "heads-up", seats: huSeats(stack, name), button: heroFirst ? "opponent" : "hero",
    hero, opponent: {},
    start: { street: streetOf(board), board, pot, dealt: "deal" },
    script,
  };
}

// A six-handed ring hand (the rfi lesson's shape): blinds 5 and 10, the listed positions fold,
// then the hero decides.
const PLAYERS = ["Rae", "Ned", "Ivy", "Sol", "Kit"];
export function ringHand(id, { position, hero, folds = [], decisions }) {
  return {
    id, layout: "six-max",
    seats: { hero: { name: "You", stack: 1000 } },
    players: PLAYERS.map((name) => ({ name, stack: 1000 })),
    position, hero,
    start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
    script: [
      { do: "blinds", sb: 5, bb: 10 },
      { do: "pause", ms: 400 },
      ...folds.map((seat) => ({ do: "act", seat, action: "fold" })),
      ...decisions.map((spotId, i) => (i ? { do: "decide", spotId, when: "answered" } : { do: "decide", spotId })),
    ],
  };
}

// Estimate bands from [id, label] pairs.
export const bands = (...pairs) => pairs.map(([id, label]) => ({ id, label }));

// The takeaway: the film's rule card.
export function takeaway({ heading, rule, lead, labels }) {
  return { kind: "takeaway", label: "Recap", heading, rule, lead, recapLabels: labels, note: "Your score counts first tries on the fresh hand." };
}

// The fields every v2 definition shares.
// `version` is the content version (answerKeys/<node>.mjs contentVersion): bumped whenever the stages
// or the keys change, the old version staying registered on the server for old builds.
export function definitionBase({ node, version = 1, conceptId = null, coach, access = "pro", title, kicker, track, chapter, minutes = 5, assumptions, feedback }) {
  return {
    id: node, node, version, flow: "film-first", format: "academy-v2",
    conceptId, sourceLessonId: node, videoLessonId: node,
    coach, narrator: TRACK_NARRATOR[track] || null, access, template: track, title, kicker,
    trail: ["Learn", chapter, title], course: { chapter },
    meta: { minutes }, assumptions, media: node, filmVersion: 2,
    feedback: feedback || { found: "You found it.", missed: "Let’s look again.", open: "Here’s the thinking." },
  };
}

export const welcome = (heading, em, lead, coachName) =>
  ({ kind: "welcome", label: "Welcome", heading, em, lead, cta: `Watch with ${coachName}` });
