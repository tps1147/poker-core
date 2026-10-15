// THE NO-REPEAT RULE (2026-10-09, Tyler: "avoid repeating the same question or the exact question
// from the lesson -- it needs to work off each of them"). Each step of a lesson builds on the one
// before: the film's own question (the film stage's `pause.spot`), the why, the guided, practice and
// fresh hands never ask the same spot, with the same numbers, in the same words. Guided may follow
// the film's idea, on different cards, numbers or seats.
//
// A stage's SPOT SIGNATURE is { board, hero, versus, pot, bet, choices, given }: the cards on the
// table, the money, what can be picked and the given numbers. Two stages REPEAT when
//   - their signatures match on board, hero, pot, bet and choices (the same spot), or
//   - one of them is the film's question, which often names no cards (the film shows them), and
//     every field both carry matches, choices and the given numbers included (the same numbers), or
//   - one is the film's question and the other carries every number it names (three or more
//     distinct numbers of 5 or more, cards aside, in its prompt or its pot and bet): the film's numbers,
//     reworded, or
//   - their prompts are near-identical (PROMPT_SIMILAR or more of their word pairs shared; a
//     templated prompt with new numbers stays under it).
// A hand with two decisions (count, then call) shares its cards and money by design: its two spots
// differ in what they ask (choices), so they never match.
//
// Pure: used by scripts/audit-lesson-repeats.mjs and test/lessonRepeats.test.mjs.
export const PROMPT_SIMILAR = 0.92;

const list = (v) => (Array.isArray(v) ? v.map(String) : []);
const numOrNull = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// The bet the hand's script puts in before the decision, when the spot itself names none.
function scriptBet(hand) {
  const act = (hand?.script || []).find((s) => s.do === "act" && s.seat !== "hero" && /bet|raise|all-?in/.test(String(s.action)) && numOrNull(s.amount) != null);
  return act ? act.amount : null;
}

function choicesOf(spot) {
  if (Array.isArray(spot.choices)) return `act:${spot.choices.map((c) => (typeof c === "object" ? c.id ?? c.action ?? c.label : c)).join("|")}${spot.sizes ? `@${JSON.stringify(spot.sizes)}` : ""}`;
  if (Array.isArray(spot.bands)) return `bands:${spot.bands.map((b) => `${b.id}=${b.label ?? ""}`).join("|")}`;
  if (Array.isArray(spot.range)) return `count:${spot.range.join("-")}:${spot.unit ?? ""}`;
  if (spot.decision === "best-five") return "best-five";
  return null;
}

// The numbers a spot is given beyond its cards and money (given equities, fold rates, ranges, stacks).
const GIVEN_KEYS = ["given", "range", "live", "value", "pot", "betSize", "played", "raised", "hands", "bankroll", "buyIn", "games", "under", "stacks", "payouts", "players", "seats", "position", "line", "game"];
function givenOf(spot) {
  const out = {};
  for (const key of GIVEN_KEYS) if (spot[key] != null && !(key === "range" && Array.isArray(spot.range))) out[key] = spot[key];
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

// The given numbers as flat "path=value" entries: one spot's given matches another's when every
// entry of the smaller is in the larger (a film's "30%, after three losses" carries the guided 30%).
const flat = (value, at = "") => (value && typeof value === "object"
  ? Object.entries(value).flatMap(([k, v]) => flat(v, at ? `${at}.${k}` : k))
  : [`${at}=${value}`]);
function givenMatch(a, b) {
  if (a == null || b == null) return a == null && b == null;
  const x = flat(JSON.parse(a)); const y = flat(JSON.parse(b));
  const [small, large] = x.length <= y.length ? [x, y] : [y, x];
  return small.every((entry) => large.includes(entry));
}

// The distinct numbers of 5 or more a prompt names ("1,000" is 1000), with the spot's pot and bet.
export function numbersOf(text, sig = null) {
  const found = String(text || "").replace(/[2-9TJQKA][♠♥♦♣]/g, " ").replace(/(\d),(\d{3})/g, "$1$2").match(/\d+(?:\.\d+)?/g) || [];
  const out = new Set(found.map(Number).filter((n) => n >= 5));
  if (sig?.pot != null) out.add(sig.pot);
  if (sig?.bet != null) out.add(sig.bet);
  return out;
}

export function signature(spot = {}, hand = null) {
  const board = list(spot.board?.length ? spot.board : hand?.start?.board);
  const hero = list(spot.hero?.length ? spot.hero : hand?.hero);
  return {
    board: board.length ? board.join(" ") : null,
    hero: hero.length ? hero.join(" ") : null,
    versus: list(spot.versus).join(" ") || null,
    pot: numOrNull(spot.potBefore) ?? numOrNull(spot.pot) ?? (hand ? numOrNull(hand.start?.pot) : null),
    bet: numOrNull(spot.bet) ?? numOrNull(spot.betSize) ?? numOrNull(spot.call) ?? scriptBet(hand),
    choices: choicesOf(spot),
    given: givenOf(spot),
  };
}

// The stages of a lesson that ask something, in order: [{ role, id, spot, signature, prompt }].
// The film's question first (role "film"), then the why ("why"), then every decision spot.
export function askingStages(definition) {
  const out = [];
  for (const stage of definition.stages || []) {
    if (stage.kind === "film" && Array.isArray(stage.pause?.pauses) && stage.pause.pauses.length) {
      // A film with several pauses (filmV2 multiPause): each pause's spot is one of the film's questions.
      for (const p of stage.pause.pauses) if (p?.spot) out.push({ role: "film", id: p.spotId || "film", spot: p.spot, signature: signature(p.spot), prompt: p.spot.prompt || "" });
    } else if (stage.kind === "film" && stage.pause?.spot) {
      out.push({ role: "film", id: stage.pause.spotId || "film", spot: stage.pause.spot, signature: signature(stage.pause.spot), prompt: stage.pause.spot.prompt || "" });
    } else if (stage.kind === "why") {
      out.push({ role: "why", id: stage.spotId, spot: null, signature: null, prompt: stage.prompt || "" });
    } else if (stage.kind === "decision") {
      const spot = definition.spots?.[stage.spotId] || {};
      const hand = definition.hands?.[stage.hand] || null;
      out.push({ role: stage.role || "decision", id: stage.spotId, spot, signature: signature(spot, hand), prompt: spot.prompt || "" });
    }
  }
  return out;
}

const words = (text) => String(text || "").toLowerCase()
  .replace(/[♠♥♦♣]/g, " ").replace(/[’']/g, "").replace(/[^a-z0-9%.]+/g, " ").replace(/\.(?!\d)/g, " ")
  .split(/\s+/).filter(Boolean);
// Dice similarity of the prompts' word pairs (0..1).
export function promptSimilarity(a, b) {
  const pairs = (text) => { const w = words(text); const out = new Map(); for (let i = 0; i + 1 < w.length; i += 1) { const k = `${w[i]} ${w[i + 1]}`; out.set(k, (out.get(k) || 0) + 1); } return out; };
  const x = pairs(a); const y = pairs(b);
  const total = [...x.values()].reduce((s, v) => s + v, 0) + [...y.values()].reduce((s, v) => s + v, 0);
  if (!total) return 0;
  let shared = 0;
  for (const [k, v] of x) shared += Math.min(v, y.get(k) || 0);
  return (2 * shared) / total;
}

const SAME_SPOT = ["board", "hero", "pot", "bet", "choices"];
// Why two asking stages repeat, or null.
export function repeatOf(a, b) {
  if (a.signature && b.signature) {
    const sa = a.signature; const sb = b.signature;
    if (SAME_SPOT.every((k) => sa[k] === sb[k]) && (sa.board || sa.hero || sa.pot != null)) return "same spot (board, hole cards, pot, bet, choices)";
    if (a.role === "film" || b.role === "film") {
      const both = Object.keys(sa).filter((k) => sa[k] != null && sb[k] != null);
      const fields = both.filter((k) => k !== "given");
      if (fields.includes("choices") && fields.length >= 3 && fields.every((k) => sa[k] === sb[k]) && givenMatch(sa.given, sb.given)) {
        return `the film's numbers (${both.join(", ")})`;
      }
      const [film, other] = a.role === "film" ? [a, b] : [b, a];
      const named = numbersOf(film.prompt);
      const carried = numbersOf(other.prompt, other.signature);
      if (named.size >= 3 && [...named].every((n) => carried.has(n))) return `the film's numbers (${[...named].join(", ")})`;
    }
  }
  const similar = promptSimilarity(a.prompt, b.prompt);
  if (a.prompt && b.prompt && similar >= PROMPT_SIMILAR) return `near-identical prompt (${similar.toFixed(2)})`;
  return null;
}

// Every repeat in a lesson: [{ a, b, why }] over each pair of asking stages.
export function lessonRepeats(definition) {
  const stages = askingStages(definition);
  const out = [];
  for (let i = 0; i < stages.length; i += 1) {
    for (let j = i + 1; j < stages.length; j += 1) {
      const why = repeatOf(stages[i], stages[j]);
      if (why) out.push({ a: `${stages[i].role}:${stages[i].id}`, b: `${stages[j].role}:${stages[j].id}`, why });
    }
  }
  return out;
}
