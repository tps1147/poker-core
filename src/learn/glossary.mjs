// THE GLOSSARY: the controlled vocabulary of the academy (ACADEMY-LEARNING-LOOP 2026-10-07, "Lints").
// Each term names the node that introduces it, the word forms that count as using it, and banned
// synonyms (another word for the same thing, which the language lint reports). The prerequisite
// lint: a lesson's captions may use a term only at its own node or a later one in tree order.
//
// Which node introduces a term is the node whose tree objective or plan teaches it, never fitted to
// the captions. Plain action words (fold, check, call, bet, raise) and everyday words with a poker
// sense (turn, set, pair, draw as a verb) are left out: they are either taught from the first film
// or too ambiguous to lint by word match.
// Pure data and functions; the only import is the tree, for its order.
import { NODES } from "./academyTree.mjs";

const t = (term, node, forms, banned = []) => Object.freeze({ term, node, forms: Object.freeze(forms), banned: Object.freeze(banned) });

export const GLOSSARY = Object.freeze([
  // rules
  t("suit", "r-the-deck", ["suit", "suits"]),
  t("straight", "r-hand-rankings", ["straight", "straights"]),
  t("flush", "r-hand-rankings", ["flush", "flushes"]),
  t("full house", "r-hand-rankings", ["full house"]),
  t("two pair", "r-hand-rankings", ["two pair"]),
  t("three of a kind", "r-hand-rankings", ["three of a kind"]),
  t("four of a kind", "r-hand-rankings", ["four of a kind"], ["quads"]),
  t("kicker", "r-best-five", ["kicker", "kickers"]),
  t("best five", "r-best-five", ["best five"]),
  t("button", "r-seats-blinds", ["button"], ["dealer button"]),
  t("small blind", "r-seats-blinds", ["small blind"]),
  t("big blind", "r-seats-blinds", ["big blind"]),
  t("blinds", "r-seats-blinds", ["blinds"]),
  t("heads-up", "r-seats-blinds", ["heads-up"]),
  t("under the gun", "r-seats-blinds", ["under the gun"]),
  t("cutoff", "r-seats-blinds", ["cutoff"]),
  t("hijack", "r-seats-blinds", ["hijack"]),
  t("preflop", "r-streets", ["preflop"]),
  t("flop", "r-streets", ["flop", "flops"]),
  t("the turn", "r-streets", ["the turn"]),
  t("river", "r-streets", ["river", "rivers"]),
  t("street", "r-streets", ["street", "streets"]),
  t("showdown", "r-showdown", ["showdown"]),
  t("all-in", "r-all-in-side-pots", ["all-in"], ["shove", "shoves", "shoved", "jam", "jams"]),
  t("side pot", "r-all-in-side-pots", ["side pot", "side pots"]),
  // board
  t("made hand", "b-made-vs-draw", ["made hand", "made hands"]),
  t("flush draw", "b-made-vs-draw", ["flush draw", "flush draws"]),
  t("straight draw", "b-made-vs-draw", ["straight draw", "straight draws"]),
  t("the nuts", "b-the-nuts", ["the nuts", "nuts"]),
  t("counterfeit", "b-kickers-counterfeit", ["counterfeit", "counterfeited"]),
  t("suited", "b-texture-read", ["suited"]),
  t("dry", "b-texture-read", ["dry"]),
  t("wet", "b-texture-read", ["wet"]),
  t("monotone", "b-texture-read", ["monotone"]),
  // math
  t("share", "m-chance-as-share", ["share"]),
  t("outs", "m-outs", ["outs"]),
  t("equity", "m-equity", ["equity"]),
  t("price", "m-pot-odds", ["price"], ["pot odds"]),
  t("expected value", "m-ev", ["expected value"], ["EV"]),
  t("variance", "m-variance", ["variance"]),
  t("implied odds", "m-implied-odds", ["implied odds"]),
  t("SPR", "m-spr", ["SPR", "stack-to-pot"]),
  t("effective stack", "m-spr", ["effective stack"]),
  // preflop
  t("position", "p-position-value", ["position", "in position", "out of position"]),
  t("offsuit", "p-starting-hands", ["offsuit"]),
  t("starting hand", "p-starting-hands", ["starting hand", "starting hands"]),
  t("limp", "p-open-raise", ["limp", "limping", "limps"]),
  t("3-bet", "p-three-bet", ["3-bet", "3-bets", "three-bet"]),
  t("blocker", "p-three-bet", ["blocker", "blockers"]),
  // postflop
  t("range", "f-ranges", ["range", "ranges"]),
  t("c-bet", "f-cbet", ["c-bet", "c-bets"], ["continuation bet"]),
  t("value bet", "f-value-betting", ["value bet", "value bets", "thin value"]),
  t("pot control", "f-pot-control", ["pot control"]),
  t("free card", "f-pot-control", ["free card"]),
  // pressure
  t("fold equity", "x-fold-equity", ["fold equity"]),
  t("semi-bluff", "x-fold-equity", ["semi-bluff", "semi-bluffs"]),
  t("break-even", "x-fold-equity", ["break-even", "break even"]),
  t("bluff", "x-bluffing", ["bluff", "bluffs", "bluffing"]),
  t("MDF", "x-mdf", ["MDF", "minimum defense"]),
  t("check-raise", "x-check-raise", ["check-raise", "check-raises"]),
  t("barrel", "x-barrels-blockers", ["barrel", "barrels"]),
  // people
  t("player type", "h-player-types", ["player type", "player types"]),
  t("calling station", "h-player-types", ["calling station"]),
  t("balanced", "h-player-types", ["balanced"]),
  t("exploit", "h-exploits", ["exploit", "exploits"]),
  // theory
  t("indifferent", "g-balance", ["indifferent", "indifference"]),
  t("GTO", "g-gto-to-exploit", ["GTO"]),
  // player
  t("bankroll", "y-bankroll", ["bankroll"]),
  t("buy-in", "y-bankroll", ["buy-in", "buy-ins"]),
  t("tilt", "y-tilt", ["tilt"]),
  // formats
  t("multiway", "o-multiway", ["multiway"]),
  t("ICM", "o-tournaments-icm", ["ICM"]),
]);

const ORDER = new Map(NODES.map((n, i) => [n.id, i]));
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
// Upper-case forms (SPR, EV, MDF, GTO, ICM) match their case only; everything else ignores case.
const matcher = (form) => new RegExp(`(?<![\\w-])${escape(form)}(?![\\w-])`, form === form.toUpperCase() ? "" : "i");
const COMPILED = GLOSSARY.map((entry) => ({ entry, forms: entry.forms.map((f) => [f, matcher(f)]), banned: entry.banned.map((f) => [f, matcher(f)]) }));

// The glossary entry for a term, or null.
export const glossaryTerm = (term) => GLOSSARY.find((e) => e.term === term) || null;

// The terms a text uses: [{ term, node, form }], one per term.
export function termsIn(text) {
  const out = [];
  for (const { entry, forms } of COMPILED) {
    const hit = forms.find(([, re]) => re.test(text || ""));
    if (hit) out.push({ term: entry.term, node: entry.node, form: hit[0] });
  }
  return out;
}

// The captions a lint reads: those before the film's upNext caption, never an "Up next" line
// (the end card names the next lesson on purpose).
export function lintableCaptions(captions = []) {
  const list = Array.isArray(captions) ? captions : [];
  const upNext = list.find((c) => c?.at === "upNext");
  return list.filter((c) => c && typeof c.text === "string" && !/^\s*up next\b/i.test(c.text) && !(upNext && Number(c.start) >= Number(upNext.start)));
}

// THE PREREQUISITE LINT for one lesson: every caption term introduced at a LATER node.
// Returns [{ lesson, term, form, introducedAt, caption }].
export function prereqHits(lessonId, captions) {
  const at = ORDER.get(lessonId);
  if (at == null) return [];
  const hits = [];
  for (const c of lintableCaptions(captions)) {
    for (const use of termsIn(c.text)) {
      if (ORDER.get(use.node) > at) hits.push({ lesson: lessonId, term: use.term, form: use.form, introducedAt: use.node, caption: c.text });
    }
  }
  return hits;
}

// THE SYNONYM LINT for one lesson: every banned synonym in its captions.
// Returns [{ lesson, term, synonym, caption }].
export function synonymHits(lessonId, captions) {
  const hits = [];
  for (const c of lintableCaptions(captions)) {
    for (const { entry, banned } of COMPILED) {
      for (const [form, re] of banned) if (re.test(c.text)) hits.push({ lesson: lessonId, term: entry.term, synonym: form, caption: c.text });
    }
  }
  return hits;
}
