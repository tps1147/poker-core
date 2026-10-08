// The builders the early-track academy definitions share (welcome, rules, board, math, preflop and
// postflop nodes that had no lesson before the 2026-10-07 rework). Pure data builders, no imports,
// so the definitions still run under plain Node, Metro and the web bundler.
//
// THE V2 LESSON (ACADEMY-LEARNING-LOOP 2026-10-07, section 2), in the shape defs-b set:
//   welcome → film (pauses at canon.yourTurn for the "Your turn" spot) → why → guided →
//   practice → fresh (a changed spot, from the plan's Transfer row) → takeaway (the rule card).
// Each hand holds one decision, whose spot id is the hand id. No key ships here: answerKeys/<node>.mjs
// at the package root (not shipped) holds every key: the film spot, the why and the hands.

// Heads-up seats: You and one named opponent (a rookie stand-in, never a bot id).
export const seatsHU = (opponent = "Ace Andy", hero = 1000, opp = hero) => ({
  hero: { name: "You", stack: hero }, opponent: { name: opponent, stack: opp, botId: null },
});

const STREET_OF = { 0: "preflop", 3: "flop", 4: "turn", 5: "river" };
const streetOf = (board) => STREET_OF[board.length];

// One tap from labelled choices: `bands` for an estimate spot.
export const bands = (...pairs) => pairs.map(([id, label]) => ({ id, label }));


// A heads-up table hand with one decision. `acts` are the opponent's (or the hero's) actions before
// the decision; `answer` adds the hero's answer step (with `sizes` for a bet or raise choice).
export function huHand(id, { hero, board = [], pot = 0, seats = seatsHU(), button = "hero", acts = [], blinds = null, answer = null, pause = 400 }) {
  return {
    id, layout: "heads-up", seats, button, hero, opponent: {},
    start: { street: streetOf(board), board, pot, dealt: "deal" },
    script: [
      { do: "pause", ms: pause },
      ...(blinds ? [{ do: "blinds", sb: blinds[0], bb: blinds[1] }] : []),
      ...acts.map((act) => ({ do: "act", ...act })),
      { do: "decide", spotId: id },
      ...(answer ? [{ do: "act", seat: "hero", action: "answer", spotId: id, ...(answer.sizes ? { sizes: answer.sizes } : {}) }] : []),
    ],
  };
}

// A six-handed ring hand (the positions lesson's shape): the hero in `position`, five other chairs.
const PLAYERS = ["Rae", "Ned", "Ivy", "Sol", "Kit"];
export function ringHand(id, { position, hero, board = [], pot = 0, acts = [], blinds = null, pause = 400 }) {
  return {
    id, layout: "six-max", seats: { hero: { name: "You", stack: 1000 } }, players: PLAYERS.map((name) => ({ name, stack: 1000 })),
    position, hero,
    start: { street: streetOf(board), board, pot, dealt: "deal" },
    script: [
      { do: "pause", ms: pause },
      ...(blinds ? [{ do: "blinds", sb: blinds[0], bb: blinds[1] }] : []),
      ...acts.map((act) => ({ do: "act", ...act })),
      { do: "decide", spotId: id },
    ],
  };
}

// The stage list, in defs-b's v2 shape (lessons/academy/kit.mjs). `film`: { film, at, spot, upNext }
// where `at` is canon.yourTurn (null: the film plays to its stop, then asks, anchor "end") and
// `spot` is the "Your turn" spot, the same spot and numbers the guided hand then plays. `hands` are
// [guided, practice, fresh], each { id, label, coachLine }. `why`: { prompt, options }.
export function v2Stages({ welcome, film, hands, why, takeaway }) {
  const [guided, practice, fresh] = hands;
  const decision = (hand, role, next) => ({ kind: "decision", label: hand.label, spotId: hand.id, hand: hand.id, role, coachLine: hand.coachLine, next });
  const turnId = guided.id.replace(/-guided$/, "-turn");
  return [
    { kind: "welcome", label: "Welcome", ...welcome },
    { kind: "film", label: "Film", upNext: film.upNext, media: film.film,
      pause: { at: film.at ?? null, anchor: film.at == null ? "end" : "yourTurn", film: film.film, spotId: turnId, spot: film.spot } },
    { kind: "why", label: "Why", prompt: why.prompt, options: why.options },
    decision(guided, "guided", "Try a practice hand"),
    decision(practice, "practice", "Try a fresh hand"),
    decision(fresh, "fresh", "See your recap"),
    { kind: "takeaway", label: "Recap", recapLabels: hands.map((hand) => hand.label), note: "Your score counts first tries on the fresh hand.",
      ...takeaway, rule: takeaway.ruleCard.lines.join(" ") + (takeaway.ruleCard.sub ? ` ${takeaway.ruleCard.sub}` : "") },
  ];
}

// Why options from [id, text, fix] triples: `fix` is the line a pick shows (a correction on a
// wrong pick, a confirmation on the right one). Which one is right is the key's, never shipped.
export const options = (...triples) => triples.map(([id, text, fix]) => ({ id, text, fix }));

// The definition's fixed fields for a node lesson (defs-b's definitionBase fields).
export function v2Lesson({ node, film, coach, access, title, kicker, track, minutes = 4, assumptions, feedback, stages, spots, hands, conceptId = null }) {
  return {
    id: node, node, version: 1, flow: "film-first", format: "academy-v2",
    conceptId, sourceLessonId: node, videoLessonId: node,
    coach, access, template: track, title, kicker,
    trail: ["Learn", track, title], course: { chapter: track },
    meta: { minutes }, assumptions, media: film, filmVersion: 2,
    feedback: feedback || { found: "You found it.", missed: "Let’s look again.", open: "Here’s the thinking." },
    stages, spots, hands,
  };
}
