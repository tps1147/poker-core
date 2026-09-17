// SCRIPTED HAND — the pure core that drives the real table through a lesson hand
// (learn-flow-2026-09-16 SPEC 2.4). No React, no timers, no DOM: the web hook (useScriptedHand)
// sequences it with timers, the Remotion kit samples it by time (stateAt), and the tests run it
// in plain Node. Imports are relative with extensions for that reason.
//
// A hand is data in the lesson definition (`hands[handId]`). Two seat forms:
//
//   heads-up (lessons 1 and 4):
//     { layout: "heads-up", seats: { hero: {name, stack}, opponent: {name, stack, botId} },
//       button: "hero" | "opponent", hero: ["As","9d"], opponent: { reveal?: ["Ac","Kc"] }, … }
//
//   any table, up to six seats (positions, preflop, multiway):
//     { layout: "six-max" | "heads-up",
//       seats: [ { id: "hero", name: "You", stack }, { id: "rae", name: "Rae", stack, reveal? }, … ],
//       button: "<seat id>", hero: ["Kd","9d"], … }
//     Seats are listed CLOCKWISE starting with the hero (the order Table.js lays them out and the
//     order the action moves). Positions (BTN SB BB UTG MP CO) follow from `button`.
//
//   the six-max ring (the film kit's shape, kit/ringHand.mjs; it plays here unchanged):
//     { layout: "six-max", seats: { hero: {name, stack} }, players: [{name, stack}, x5],
//       position: "UTG", hero: [...], … }
//     Chairs are "hero", "s1".."s5" clockwise from the hero's left; the button follows from the
//     hero's `position`.
//   On a six-max table a step's `seat` (and a result's `winner`) may name a position ("CO"),
//   resolved to the seat holding it at that moment.
//
//   start: { street, board, pot, dealt: "held" | "deal" }
//   intro?: [...steps]   film only: plays from an empty table and must end on `start`
//   script: [...steps]
//
// Each step changes the table in ONE state update, the way a live server diff does. Steps:
//   deal · blinds {sb, bb} · street {cards} · pause {ms} · highlight {cards, dim} · position {hero}
//   act {seat, action: check|bet|call|raise|fold|answer, amount?, to?, prompt?, spotId?, sizes?}
//   decide {spotId} · showdown {seats?} · result {winner, message}
// Any step may carry `when: "answered"` (waits for the last decision's saved answer) or
// `if: { action, spotId? }` (a branch: runs only when that saved action is one of `action`).
// Chips: `amount` is the chips a bet or raise puts in; `to` is the seat's total bet after it
// ("raise to 90"). A call always pays what the seat owes. An `answer` act plays the learner's saved
// action; aggressive choices take their size from `sizes[choice]` (a `to` total).

import pokerEval from "../eval/pokerEvaluator.js";
const { evaluateHand, compareHands } = pokerEval;
import {
  CHIP_STAGGER_S, CHIP_TO_POT_MS, CHIP_TO_WINNER_MS, COMMUNITY_STAGGER, FLIP_S, HOLE_STAGGER,
  MOVE, POT_ROLL_MS, REVEAL_STAGGER_S, SPRING_SETTLE, STREAM_CHIPS,
} from "./motion.mjs";

export const HERO = "hero";
export const OPPONENT = "opponent";
export const STEP_KINDS = Object.freeze(["deal", "blinds", "street", "act", "pause", "decide", "showdown", "result", "highlight", "position"]);
export const ACTIONS = Object.freeze(["check", "bet", "call", "raise", "fold", "answer"]);
// Passive answers play as themselves; any other saved choice (bet, raise, large-bet, …) is a sized
// aggressive action and needs `sizes[choice]` on the answer step.
export const PASSIVE = Object.freeze(["fold", "check", "call"]);
export const LAYOUT_SEATS = Object.freeze({ "heads-up": 2, "six-max": 6 });
export const POSITION_NAMES = Object.freeze({ BTN: "Button", SB: "Small blind", BB: "Big blind", UTG: "Under the gun", MP: "Middle position", CO: "Cutoff" });
// Clockwise from the button (kit/ringHand.mjs RING). HJ is read as MP.
export const RING = Object.freeze(["BTN", "SB", "BB", "UTG", "MP", "CO"]);
const POSITION_ALIAS = { HJ: "MP", BUTTON: "BTN" };
export function positionName(value) {
  const key = String(value || "").toUpperCase();
  const name = POSITION_ALIAS[key] || key;
  return RING.includes(name) ? name : null;
}
export const CHAIRS = Object.freeze(["hero", "s1", "s2", "s3", "s4", "s5"]);

// ---- cards -----------------------------------------------------------------------------------
const SUIT = { s: "♠", h: "♥", d: "♦", c: "♣" };
const SUIT_CODE = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
const RANKS = "23456789TJQKA";
const RANK_NAME = { 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine", T: "Ten", J: "Jack", Q: "Queen", K: "King", A: "Ace" };
const SUIT_NAME = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };

export function isCardCode(code) {
  return typeof code === "string" && code.length === 2 && RANKS.includes(code[0]) && !!SUIT[code[1]];
}
// "Td" -> { rank: "T", suit: "♦" }, the server's card shape (pokerServer/src/game/Deck.js:8-13).
export function toTableCard(code) {
  if (!isCardCode(code)) throw new Error(`Not a card code: ${code}`);
  return { rank: code[0], suit: SUIT[code[1]] };
}
export function toCardCode(card) {
  return card && card.rank && SUIT_CODE[card.suit] ? `${card.rank}${SUIT_CODE[card.suit]}` : null;
}
// "As" -> "Ace of spades" (the pressable card's aria-label).
export function cardLabel(code) {
  return isCardCode(code) ? `${RANK_NAME[code[0]]} of ${SUIT_NAME[code[1]]}` : "";
}

// ---- seats and positions ---------------------------------------------------------------------
export const isRingHand = (hand) => hand?.layout === "six-max" && !Array.isArray(hand?.seats) && Array.isArray(hand?.players);

// The hand's seats as one clockwise list, hero first: [{ id, name, stack, botId, reveal }].
export function handSeats(hand) {
  const seats = hand?.seats;
  if (Array.isArray(seats)) return seats.map((seat) => ({ ...seat }));
  if (isRingHand(hand)) {
    return [
      { ...(seats?.hero || {}), id: HERO },
      ...hand.players.map((player, i) => ({ ...player, id: CHAIRS[i + 1] })),
    ];
  }
  if (seats && typeof seats === "object") {
    return [
      { ...(seats.hero || {}), id: HERO },
      { ...(seats.opponent || {}), id: OPPONENT, reveal: hand.opponent?.reveal },
    ];
  }
  return [];
}
const layoutOf = (hand) => hand?.layout || "heads-up";
// The button's seat: `button`, or for a ring hand the chair the hero's `position` puts it on.
export function handButton(hand) {
  if (hand?.button != null) return hand.button;
  if (!isRingHand(hand)) return null;
  return buttonForHero(handSeats(hand).map((seat) => seat.id), positionName(hand.position) || "BTN");
}
// The button seat that gives the hero (seat 0) this position.
function buttonForHero(ids, position) {
  return ids.find((id) => positionsFor(ids, id)[HERO] === position) ?? null;
}

// Position labels from the button, clockwise: BTN, SB, BB, then UTG, MP, CO as seats allow.
// Heads-up the button posts the small blind and the other seat is the big blind.
export function positionsFor(ids, button) {
  const n = ids.length;
  const b = ids.indexOf(button);
  if (b < 0 || n < 2) return {};
  const at = (offset) => ids[(b + offset) % n];
  if (n === 2) return { [at(0)]: "BTN", [at(1)]: "BB" };
  const early = ["UTG", "MP", "CO"].slice(Math.max(0, 6 - n));
  const labels = ["BTN", "SB", "BB", ...early];
  return Object.fromEntries(ids.map((_, i) => [at(i), labels[i]]));
}

// The chip-flight anchor a seat's chips leave from (ChipFlow ANCHORS). Heads-up keeps the live
// names. Six-max: the hero is "hero", the top-centre seat "opponent", other seats "seat-<i>" (their
// table index; ChipFlow falls back to the pot until tableMotion.ANCHORS names them).
export function anchorFor(state, id) {
  if (state.seats.length === 2 && state.layout !== "six-max") return id === HERO ? HERO : OPPONENT;
  const index = state.seats.findIndex((seat) => seat.id === id);
  if (index === 0) return HERO;
  if (state.layout === "six-max" && index === 3) return OPPONENT;
  return `seat-${index}`;
}

// A step's seat: a seat id, or on a six-max table a position name held by a seat right now.
export function resolveSeat(state, name) {
  if (state.seats.some((seat) => seat.id === name)) return name;
  const position = state.layout === "six-max" ? positionName(name) : null;
  if (!position) return name;
  return Object.entries(state.positions || {}).find(([, label]) => label === position)?.[0] ?? name;
}

// ---- validation ------------------------------------------------------------------------------
// Returns a list of problems; [] means the hand is playable. The rules are the lesson house rules:
// no street after a decision, a reveal only through an earned showdown, no duplicate cards, and a
// preflop or multiway script that acts in turn.
const SEAT_ID = /^[a-z][a-z0-9-]{0,23}$/;
export function validateHand(hand) {
  const errors = [];
  if (!hand || typeof hand !== "object") return ["Hand is not an object."];
  const layout = layoutOf(hand);
  const objectSeats = !Array.isArray(hand.seats);
  if (!LAYOUT_SEATS[layout]) errors.push("layout must be heads-up or six-max.");
  const seats = handSeats(hand);
  const ids = seats.map((seat) => seat.id);
  const ring = isRingHand(hand);
  if (ring) {
    if (!hand.seats?.hero) errors.push("seats.hero is required.");
    if (hand.players.length < 1 || hand.players.length > 5 || hand.players.some((player) => !player || !Number.isFinite(Number(player.stack)))) errors.push("players lists up to five other chairs, each { name, stack }.");
    if (hand.button == null && !positionName(hand.position)) errors.push("position is the hero's position: UTG, MP, CO, BTN, SB or BB.");
  } else if (objectSeats) {
    if (layout !== "heads-up") errors.push("Six-max hands list their seats as an array, hero first, or use the ring shape (players and position).");
    if (!hand.seats?.hero || !hand.seats?.opponent) errors.push("seats.hero and seats.opponent are required.");
  } else {
    if (seats.length < 2 || seats.length > (LAYOUT_SEATS[layout] || 6)) errors.push(`${layout} holds 2 to ${LAYOUT_SEATS[layout] || 6} seats.`);
    if (layout === "heads-up" && seats.length !== 2) errors.push("A heads-up hand has exactly two seats.");
    if (ids[0] !== HERO) errors.push('The first seat is the hero (id "hero").');
    if (new Set(ids).size !== ids.length) errors.push("Seat ids must be unique.");
    seats.forEach((seat, i) => {
      if (!SEAT_ID.test(String(seat.id || ""))) errors.push(`seats[${i}]: id "${seat.id}" must be lower-case letters, digits or dashes.`);
      if (!Number.isFinite(Number(seat.stack))) errors.push(`seats[${i}]: stack must be a number.`);
    });
  }
  const isSeat = (id) => ids.includes(id) || (layout === "six-max" && !!positionName(id));
  const plainSeats = objectSeats && !ring;
  if (hand.button != null && !ids.includes(hand.button)) errors.push(plainSeats ? "button must be hero or opponent." : "button must be a seat id.");
  const seen = new Set();
  const useCard = (code, where) => {
    if (!isCardCode(code)) { errors.push(`${where}: "${code}" is not a card code.`); return; }
    if (seen.has(code)) errors.push(`${where}: ${code} appears twice.`);
    seen.add(code);
  };
  if (!Array.isArray(hand.hero) || hand.hero.length !== 2) errors.push("hero needs two hole cards.");
  else hand.hero.forEach((code) => useCard(code, "hero"));
  const reveals = {};
  seats.forEach((seat) => {
    if (seat.id === HERO || seat.reveal == null) return;
    const where = plainSeats ? "opponent.reveal" : `${seat.id}.reveal`;
    if (!Array.isArray(seat.reveal) || seat.reveal.length !== 2) errors.push(`${where} needs two cards.`);
    else { seat.reveal.forEach((code) => useCard(code, where)); reveals[seat.id] = seat.reveal; }
  });
  const start = hand.start || {};
  if (!["held", "deal"].includes(start.dealt)) errors.push('start.dealt must be "held" or "deal".');
  const board = Array.isArray(start.board) ? start.board : [];
  if (board.length > 5 || [1, 2].includes(board.length)) errors.push("start.board must hold 0, 3, 4 or 5 cards.");
  board.forEach((code) => useCard(code, "start.board"));
  if (!Number.isFinite(Number(start.pot))) errors.push("start.pot must be a number.");

  const checkSteps = (steps, label, boardCards) => {
    if (!Array.isArray(steps)) { errors.push(`${label} must be an array.`); return new Set(); }
    let decided = false;
    const shown = new Set();
    steps.forEach((step, i) => {
      const at = `${label}[${i}]`;
      if (!step || !STEP_KINDS.includes(step.do)) { errors.push(`${at}: unknown step "${step?.do}".`); return; }
      if (step.when != null && step.when !== "answered") errors.push(`${at}: when must be "answered".`);
      if (step.if != null) {
        const actions = [].concat(step.if?.action ?? []);
        if (!actions.length || !actions.every((a) => typeof a === "string")) errors.push(`${at}: if needs an action (or a list of actions).`);
        if (!decided) errors.push(`${at}: an if branch must follow a decision.`);
      }
      if (step.do === "street") {
        if (decided) errors.push(`${at}: no street may follow a decision.`);
        if (!Array.isArray(step.cards) || !step.cards.length) errors.push(`${at}: street needs cards.`);
        else step.cards.forEach((code) => { if (label === "intro") { if (!boardCards.includes(code)) errors.push(`${at}: intro street card ${code} is not on start.board.`); } else useCard(code, at); });
      }
      if (step.do === "blinds") {
        if (!(Number(step.bb) > 0)) errors.push(`${at}: blinds need a positive bb.`);
        if (!handButton(hand)) errors.push(`${at}: blinds need a button.`);
      }
      if (step.do === "position") {
        if (layout !== "six-max") errors.push(`${at}: position moves the button on a six-max table.`);
        if (!positionName(step.hero)) errors.push(`${at}: position names the hero's new position (UTG, MP, CO, BTN, SB or BB).`);
      }
      if (step.do === "act") {
        if (!isSeat(step.seat)) errors.push(plainSeats ? `${at}: seat must be hero or opponent.` : `${at}: seat "${step.seat}" is not a seat id or position.`);
        if (!ACTIONS.includes(step.action)) errors.push(`${at}: unknown action "${step.action}".`);
        if (["bet", "raise"].includes(step.action) && !(Number(step.amount) > 0) && !(Number(step.to) > 0)) errors.push(`${at}: ${step.action} needs a positive amount or to.`);
        if (step.action === "answer" && (step.seat !== HERO || !step.spotId)) errors.push(`${at}: an answer action is the hero's and names its spotId.`);
        if (step.sizes != null && (typeof step.sizes !== "object" || !Object.values(step.sizes).every((n) => Number(n) > 0))) errors.push(`${at}: sizes maps each aggressive choice to a positive total.`);
        if (step.prompt != null && step.seat !== HERO) errors.push(`${at}: only the hero's action can prompt the learner.`);
      }
      if (step.do === "pause" && !(Number(step.ms) >= 0)) errors.push(`${at}: pause needs ms.`);
      if (step.do === "decide") {
        if (!step.spotId) errors.push(`${at}: decide needs a spotId.`);
        if (label === "intro") errors.push(`${at}: the film intro cannot hold a decision.`);
        decided = true;
      }
      if (step.do === "showdown") {
        if (!decided) errors.push(`${at}: showdown must follow a decision whose answer is saved.`);
        const named = step.seats == null ? Object.keys(reveals) : [].concat(step.seats);
        if (!Object.keys(reveals).length) errors.push(plainSeats || seats.length === 2 ? `${at}: showdown requires opponent.reveal.` : `${at}: showdown requires a seat with reveal.`);
        named.forEach((id) => { if (!reveals[id]) errors.push(`${at}: seat "${id}" has no reveal.`); else shown.add(id); });
      }
      if (step.do === "result") {
        if (!isSeat(step.winner)) errors.push(plainSeats ? `${at}: result winner must be hero or opponent.` : `${at}: result winner "${step.winner}" is not a seat id or position.`);
        if (step.message == null) errors.push(`${at}: result needs a message ("from-expected" or text).`);
      }
      if (step.do === "highlight") {
        if (!Array.isArray(step.cards)) errors.push(`${at}: highlight needs cards.`);
        if (!(step.dim == null || step.dim === true || Array.isArray(step.dim))) errors.push(`${at}: dim is an array of codes or true.`);
      }
    });
    return shown;
  };
  if (hand.intro != null) checkSteps(hand.intro, "intro", board);
  const shown = checkSteps(hand.script, "script", board);
  for (const id of Object.keys(reveals)) {
    if (!shown.has(id)) errors.push(plainSeats ? "opponent.reveal is only allowed on a hand with a showdown step." : `${id}.reveal is only allowed when a showdown step shows that seat.`);
  }
  if (!errors.length) errors.push(...playErrors(hand));
  return errors;
}

// Walk the script up to its first decision (everything before it is fixed) and check that every
// action is legal where it happens: the right seat acts, nobody checks facing a bet, nobody folded
// acts again, a raise raises.
function playErrors(hand) {
  const errors = [];
  const steps = expandScript(hand);
  let s = initialState(hand);
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    if (step.do === "decide" || step.if || step.when) break;
    if (step.do === "act" && step.action !== "answer") {
      const id = resolveSeat(s, step.seat);
      const seat = seatOf(s, id);
      const at = `script step ${i}`;
      if (seat?.folded) errors.push(`${at}: ${step.seat} has folded and cannot act.`);
      if (s.currentTurnId != null && s.currentTurnId !== id) errors.push(`${at}: ${step.seat} acts out of turn (${s.currentTurnId} is next).`);
      const owes = owedBy(s, id);
      if (step.action === "check" && owes > 0) errors.push(`${at}: ${step.seat} cannot check facing ${owes}.`);
      if (step.action === "call" && owes === 0) errors.push(`${at}: ${step.seat} has nothing to call; use check.`);
      if (step.action === "bet" && maxBet(s) > 0) errors.push(`${at}: there is already a bet; use raise.`);
      if (step.action === "raise" && maxBet(s) === 0) errors.push(`${at}: there is no bet to raise; use bet.`);
      if (step.action === "raise" && step.to != null && Number(step.to) <= maxBet(s)) errors.push(`${at}: raise to ${step.to} does not raise ${maxBet(s)}.`);
    }
    if (blockedBy(s, step, {})) break;
    s = apply(s, step, { index: i }, hand);
  }
  return errors;
}

// ---- state -----------------------------------------------------------------------------------
const clone = (s) => ({ ...s, seats: s.seats.map((seat) => ({ ...seat })) });
const seatOf = (s, id) => s.seats.find((seat) => seat.id === id);
const maxBet = (s) => s.seats.reduce((m, seat) => Math.max(m, seat.currentBet || 0), 0);
const owedBy = (s, id) => Math.max(0, maxBet(s) - (seatOf(s, id)?.currentBet || 0));
const activeSeats = (s) => s.seats.filter((seat) => !seat.folded);
const withOwed = (s) => {
  const n = owedBy(s, HERO);
  return { ...s, currentBet: n, canCall: n > 0 };
};
const handKeyOf = (hand, epoch) => `${hand.id || "lesson-hand"}#${epoch || 0}`;

// The next seat clockwise from `id` that can still act (not folded, chips behind).
function nextToAct(s, id) {
  const n = s.seats.length;
  const from = s.seats.findIndex((seat) => seat.id === id);
  for (let k = 1; k < n; k += 1) {
    const seat = s.seats[(from + k) % n];
    if (!seat.folded && seat.chips > 0) return seat.id;
  }
  return null;
}
// A betting round is closed when every seat still in (with chips behind) has acted since the last
// bet or raise and matched it.
function roundClosed(s) {
  const top = maxBet(s);
  const acted = s.acted || [];
  const live = activeSeats(s).filter((seat) => seat.chips > 0);
  return live.every((seat) => acted.includes(seat.id) && (seat.currentBet || 0) === top);
}
const sweep = (s) => { s.seats = s.seats.map((x) => ({ ...x, currentBet: 0 })); };

function baseState(hand, { epoch = 0, empty = false } = {}) {
  const start = hand.start || {};
  const held = !empty && start.dealt === "held";
  const seats = handSeats(hand);
  const ids = seats.map((seat) => seat.id);
  const twoSeats = seats.length === 2;
  const button = handButton(hand);
  return withOwed({
    layout: layoutOf(hand),
    handId: handKeyOf(hand, epoch),
    // How the cards on the felt arrive when this handId mounts. "settled": they are already there
    // (the film handoff, a resume, Back), so nothing re-deals. "deal": a genuinely new hand, dealt
    // with the live springs. Deal again (epoch > 0) is always a new deal, even for a held hand.
    entrance: held && epoch === 0 ? "settled" : "deal",
    haveHand: held,
    street: held ? start.street || null : null,
    seats: seats.map((seat) => ({
      id: seat.id,
      username: seat.name ?? (seat.id === HERO ? "You" : seat.id === OPPONENT ? "Opponent" : seat.id),
      chips: Number(seat.stack ?? 0),
      currentBet: 0,
      cards: held ? (seat.id === HERO ? hand.hero.slice() : [null, null]) : [],
    })),
    community: held ? (start.board || []).slice() : [],
    pot: Number(start.pot || 0),
    dealerId: button || null,
    currentTurnId: null,
    // A campaign chibi only sits in a heads-up seat; a six-max table shows plain avatars.
    botId: twoSeats ? seats.find((seat) => seat.id !== HERO)?.botId ?? null : null,
    positions: positionsFor(ids, button),
    oppRevealCards: null,
    revealed: {},
    result: null,
    betEvent: null,
    winEvent: null,
    highlightCards: [],
    dimCards: [],
    acted: [], // seat ids that have acted since the last bet or raise this round
    decided: [], // spotIds whose decide step has run
    stepIndex: 0,
  });
}

// The effective script. A `dealt: "deal"` hand with no explicit deal step deals its hole cards and
// its start board street by street before the script runs (flop, then turn, then river).
export function expandScript(hand) {
  const script = Array.isArray(hand?.script) ? hand.script : [];
  if (hand?.start?.dealt !== "deal" || script.some((s) => s.do === "deal")) return script;
  const board = hand.start.board || [];
  const pre = [{ do: "deal", auto: true }];
  if (board.length >= 3) pre.push({ do: "street", cards: board.slice(0, 3), auto: true });
  if (board.length >= 4) pre.push({ do: "street", cards: [board[3]], auto: true });
  if (board.length >= 5) pre.push({ do: "street", cards: [board[4]], auto: true });
  return [...pre, ...script];
}

// The state before any script step runs. `dealt: "held"`: cards already on the felt (the film
// handoff). `dealt: "deal"`: an empty felt waiting for the deal.
export function initialState(hand, { epoch = 0 } = {}) {
  return hand?.start?.dealt === "deal" ? { ...baseState(hand, { epoch, empty: true }), pot: Number(hand.start.pot || 0) } : baseState(hand, { epoch });
}

const cap = (text) => (text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : text);
const lower = (text) => (text ? text.toLowerCase() : text);
function bestOf(codes) {
  const cards = codes.filter(isCardCode).map(toTableCard);
  return cards.length >= 5 ? evaluateHand(cards) : null;
}
const revealOf = (hand, id) => handSeats(hand).find((seat) => seat.id === id)?.reveal || null;

// "You win 240 · Full house beats two pair", from the saved answer's expected cards and the
// revealed hand. The bundle never names the hero's hand before the answer exists.
export function resultMessage(state, hand, step, ctx = {}) {
  const winner = seatOf(state, step.winner);
  const amount = Number(state.pot || 0).toLocaleString("en-US");
  const head = step.winner === HERO ? `You win ${amount}` : `${winner?.username || "Opponent"} wins ${amount}`;
  if (step.message !== "from-expected") return step.message || head;
  const answered = Object.values(ctx.answers || {}).find((a) => Array.isArray(a?.expected) && a.expected.length === 5)
    || Object.values(ctx.answers || {}).find((a) => Array.isArray(a?.expected?.cards));
  const expected = answered ? (Array.isArray(answered.expected) ? answered.expected : answered.expected.cards) : null;
  const heroHand = expected ? bestOf(expected) : null;
  const otherId = step.winner !== HERO ? step.winner
    : Object.keys(state.revealed || {})[0] || state.seats.find((seat) => seat.id !== HERO)?.id;
  const otherCards = revealOf(hand, otherId);
  const oppHand = Array.isArray(otherCards) ? bestOf([...otherCards, ...state.community]) : null;
  if (!heroHand || !oppHand) return head;
  const cmp = compareHands(heroHand, oppHand);
  const [a, b] = step.winner === HERO ? [heroHand, oppHand] : [oppHand, heroHand];
  if (cmp === 0) return `${head} · ${cap(a.name)} ties ${lower(b.name)}`;
  return a.rank === b.rank ? `${head} · ${cap(a.name)} beats a lower ${lower(b.name)}` : `${head} · ${cap(a.name)} beats ${lower(b.name)}`;
}

// The saved choice a branch or an answer step reads: an action spot's `action`.
function savedAction(saved) {
  return saved?.action ?? saved?.expected?.action ?? null;
}
// Does a branch step run? true, false, or null while its decision has no saved answer.
export function branchTaken(state, step, ctx = {}) {
  if (!step?.if) return true;
  const spotId = step.if.spotId || state.decided[state.decided.length - 1];
  const saved = spotId ? ctx.answers?.[spotId] : null;
  if (!saved) return null;
  return [].concat(step.if.action).includes(savedAction(saved));
}

// Is this step allowed to run yet? `when: "answered"` steps, branches, `decide` release and
// showdowns wait for a saved answer; a hero step with a `prompt` also waits for the learner to press it.
export function blockedBy(state, step, ctx = {}) {
  const answers = ctx.answers || {};
  const lastDecided = state.decided[state.decided.length - 1];
  if (step.when === "answered" && lastDecided && !answers[lastDecided]) return { kind: "answer", spotId: lastDecided };
  if (step.if && branchTaken(state, step, ctx) === null) return { kind: "answer", spotId: step.if.spotId || lastDecided || null };
  if (step.do === "showdown" && (!lastDecided || !answers[lastDecided])) return { kind: "answer", spotId: lastDecided || null };
  if (step.do === "act" && step.action === "answer" && !answers[step.spotId]) return { kind: "answer", spotId: step.spotId };
  return null;
}

// The learner's saved choice as a table action: { action, to }. Aggressive choices are sized by
// the answer step's `sizes`; one with no size moves no chips.
export function answerAction(state, step, saved) {
  const chosen = savedAction(saved) || "fold";
  if (PASSIVE.includes(chosen)) return { action: chosen, to: null, choice: chosen };
  const size = Number(step.sizes?.[chosen]);
  return { action: maxBet(state) > 0 ? "raise" : "bet", to: size > 0 ? size : null, choice: chosen };
}

function pay(s, winnerId, key) {
  const winner = seatOf(s, winnerId);
  sweep(s);
  seatOf(s, winner.id).chips += s.pot;
  s.winEvent = { key: `${key}-win`, to: anchorFor(s, winner.id) };
  return winner;
}

// Apply one step: a pure (state, step) -> state. `ctx.answers` is { [spotId]: savedAnswer };
// `ctx.index` keys the one-shot events so a replayed state never re-fires a chip flight.
export function apply(state, step, ctx = {}, hand = {}) {
  let s = clone(state);
  const key = `${s.handId}:${ctx.index ?? s.stepIndex}`;
  s.stepIndex = (ctx.index ?? s.stepIndex) + 1;
  switch (step.do) {
    case "deal": {
      s.haveHand = true;
      s.street = "preflop";
      s.seats = s.seats.map((seat) => ({ ...seat, folded: undefined, currentBet: 0, cards: seat.id === HERO ? (hand.hero || []).slice() : [null, null] }));
      s.community = [];
      s.oppRevealCards = null;
      s.revealed = {};
      s.result = null;
      s.winEvent = null;
      s.highlightCards = [];
      s.dimCards = [];
      s.acted = [];
      return withOwed(s);
    }
    case "blinds": {
      const bb = Number(step.bb || 0);
      const sb = Number(step.sb || 0);
      const ids = s.seats.map((seat) => seat.id);
      const n = ids.length;
      // Heads-up the button posts the small blind; otherwise the two seats after the button post.
      const b = Math.max(0, ids.indexOf(s.dealerId || HERO));
      const small = n === 2 ? (s.dealerId || HERO) : ids[(b + 1) % n];
      const big = n === 2 ? ids.find((id) => id !== small) : ids[(b + 2) % n];
      for (const [id, amount] of [[small, sb], [big, bb]]) {
        const seat = seatOf(s, id);
        seat.chips -= amount;
        seat.currentBet = (seat.currentBet || 0) + amount;
        s.pot += amount;
      }
      s.acted = [];
      s.currentTurnId = n === 2 ? small : nextToAct(s, big);
      return withOwed(s);
    }
    case "street": {
      s.community = [...s.community, ...step.cards];
      s.street = ["flop", "flop", "flop", "flop", "turn", "river"][s.community.length] || s.street;
      sweep(s);
      // Six-max shows whose turn it is after the button (as the ring film does); heads-up waits for an act.
      s.currentTurnId = s.layout === "six-max" && s.dealerId ? nextToAct(s, s.dealerId) : null;
      s.acted = [];
      return withOwed(s);
    }
    case "act": {
      let action = step.action;
      let amount = Number(step.amount || 0);
      let to = step.to != null ? Number(step.to) : null;
      if (action === "answer") {
        ({ action, to } = answerAction(s, step, ctx.answers?.[step.spotId]));
        amount = 0;
      }
      const seat = seatOf(s, resolveSeat(s, step.seat));
      if (action === "fold") {
        seat.folded = true;
        const left = activeSeats(s);
        if (step.action === "answer") {
          // The learner folded. With one seat left it takes the pot, with no reveal.
          if (left.length === 1) {
            const winner = pay(s, left[0].id, key);
            s.result = { type: "fold", winner: { id: winner.id, username: winner.username }, amount: s.pot, message: `${winner.id === HERO ? "You win" : `${winner.username} wins`} ${Number(s.pot).toLocaleString("en-US")}` };
            s.pot = 0; // paid: the pill counts down as the win chips fly (tableProps.potCountDownMs)
          }
          s.currentTurnId = null;
          return withOwed(s);
        }
        s.currentTurnId = left.length >= 2 ? nextToAct(s, seat.id) : null;
        if (left.length >= 2 && roundClosed(s)) { sweep(s); s.currentTurnId = null; }
        return withOwed(s);
      }
      if (action === "check") {
        s.acted = [...new Set([...(s.acted || []), seat.id])];
        if (roundClosed(s) && activeSeats(s).length > 1) { sweep(s); s.currentTurnId = null; return withOwed(s); }
        s.currentTurnId = nextToAct(s, seat.id);
        return withOwed(s);
      }
      if (action === "call") amount = owedBy(s, seat.id) || amount;
      else if (to != null) amount = Math.max(0, to - (seat.currentBet || 0));
      amount = Math.min(amount, Math.max(0, seat.chips));
      if (amount > 0) {
        seat.chips -= amount;
        seat.currentBet = (seat.currentBet || 0) + amount;
        s.pot += amount;
        s.betEvent = { key, from: anchorFor(s, seat.id) };
      }
      if (action === "call") {
        s.acted = [...new Set([...(s.acted || []), seat.id])];
        // A call that closes the round sweeps every bet spot into the pot.
        if (roundClosed(s)) { sweep(s); s.currentTurnId = null; } else s.currentTurnId = nextToAct(s, seat.id);
      } else {
        s.acted = [seat.id];
        s.currentTurnId = nextToAct(s, seat.id);
      }
      return withOwed(s);
    }
    case "position": {
      // The button and every label move; the hero stays in the hero's chair.
      const ids = s.seats.map((seat) => seat.id);
      const button = buttonForHero(ids, positionName(step.hero));
      if (button) { s.dealerId = button; s.positions = positionsFor(ids, button); }
      return withOwed(s);
    }
    case "pause":
      return s;
    case "decide":
      s.currentTurnId = HERO;
      s.decided = [...s.decided, step.spotId];
      return withOwed(s);
    case "showdown": {
      const ids = step.seats != null ? [].concat(step.seats)
        : s.seats.filter((seat) => seat.id !== HERO && !seat.folded && revealOf(hand, seat.id)).map((seat) => seat.id);
      s.revealed = { ...s.revealed, ...Object.fromEntries(ids.filter((id) => revealOf(hand, id)).map((id) => [id, revealOf(hand, id).slice()])) };
      if (s.seats.length === 2) s.oppRevealCards = (revealOf(hand, s.seats.find((seat) => seat.id !== HERO).id) || []).slice();
      sweep(s);
      s.currentTurnId = null;
      return withOwed(s);
    }
    case "result": {
      const winnerId = resolveSeat(s, step.winner);
      const message = resultMessage(s, hand, { ...step, winner: winnerId }, ctx);
      const winner = pay(s, winnerId, key);
      s.result = { type: s.oppRevealCards || Object.keys(s.revealed || {}).length ? "showdown" : "fold", winner: { id: winner.id, username: winner.username }, amount: s.pot, message };
      s.pot = 0; // paid: the pill counts down as the win chips fly (tableProps.potCountDownMs)
      s.currentTurnId = null;
      return withOwed(s);
    }
    case "highlight": {
      s.highlightCards = (step.cards || []).slice();
      if (step.dim === true) {
        const visible = [...(seatOf(s, HERO).cards || []), ...s.community].filter(isCardCode);
        s.dimCards = visible.filter((code) => !s.highlightCards.includes(code));
      } else {
        s.dimCards = Array.isArray(step.dim) ? step.dim.slice() : [];
      }
      return s;
    }
    default:
      throw new Error(`Unknown step: ${step?.do}`);
  }
}

// The pot pays out over the whole win-chip stream: the last chip leaves .12 s after the first.
export const PAYOUT_MS = Math.round(CHIP_TO_WINNER_MS + (STREAM_CHIPS - 1) * CHIP_STAGGER_S * 1000);

// ---- timing ----------------------------------------------------------------------------------
// lead: ms from this step's start until the NEXT step may start.
// settle: ms from this step's start until everything it set in motion has landed.
// Board cards deal with the live index delay (Table's CommunityRow: index * .15 s).
export function stepTiming(step, state = null, { reduce = false } = {}) {
  const quick = 150;
  switch (step.do) {
    case "deal": return reduce ? { lead: quick, settle: 0 } : { lead: 350, settle: Math.round((HOLE_STAGGER + SPRING_SETTLE) * 1000) };
    case "street": {
      const last = (state?.community?.length ?? 0) + (step.cards?.length || 1) - 1;
      return reduce ? { lead: quick, settle: 0 } : { lead: 350, settle: Math.round((last * COMMUNITY_STAGGER + SPRING_SETTLE) * 1000) };
    }
    case "act": {
      if (step.action === "fold") return reduce ? { lead: quick, settle: 0 } : { lead: MOVE.fold * 1000, settle: MOVE.fold * 1000 };
      if (step.action === "answer") {
        // A learner fold pays the pot like a result; a learner call moves chips like a call.
        const chips = Math.round(Math.max(CHIP_TO_POT_MS + (STREAM_CHIPS - 1) * CHIP_STAGGER_S * 1000, POT_ROLL_MS, PAYOUT_MS));
        return reduce ? { lead: quick, settle: 0 } : { lead: chips, settle: chips };
      }
      if (step.action === "check") return { lead: reduce ? quick : 300, settle: 0 };
      const chips = CHIP_TO_POT_MS + (STREAM_CHIPS - 1) * CHIP_STAGGER_S * 1000;
      const ms = Math.round(Math.max(chips, POT_ROLL_MS));
      return reduce ? { lead: quick, settle: 0 } : { lead: ms, settle: ms };
    }
    case "pause": return reduce ? { lead: Math.min(quick, Number(step.ms) || 0), settle: 0 } : { lead: Number(step.ms) || 0, settle: 0 };
    case "decide": return { lead: 0, settle: 0 };
    case "showdown": return reduce ? { lead: quick, settle: 0 } : { lead: Math.round((FLIP_S + REVEAL_STAGGER_S) * 1000), settle: Math.round((FLIP_S + REVEAL_STAGGER_S) * 1000) };
    case "result": {
      const ms = PAYOUT_MS;
      return reduce ? { lead: quick, settle: 0 } : { lead: ms, settle: ms };
    }
    case "highlight": return reduce ? { lead: 0, settle: 0 } : { lead: 0, settle: MOVE.highlightRing * 1000 };
    case "position": return reduce ? { lead: 150, settle: 0 } : { lead: 320, settle: 320 };
    case "blinds":
    default: return { lead: 0, settle: 0 };
  }
}
// Run the effective script from `fromIndex` until something needs the learner. Returns a timeline
// of { index, step, at, state } (ms from now) for the hook to play, the step to resume from, what
// blocked, and `readyAt`: the moment every deal, chip flight and pot roll so far has landed. A
// decision's input must not open before readyAt (SPEC 2.4: buttons are never live mid-motion).
// `ctx.performed` lists the script indices of hero `prompt` actions the learner has pressed.
export function runUntilBlocked(hand, state, fromIndex, ctx = {}, { reduce = false } = {}) {
  const steps = expandScript(hand);
  const performed = new Set(ctx.performed || []);
  let s = state;
  let t = 0;
  let busy = 0;
  const timeline = [];
  for (let i = fromIndex; i < steps.length; i += 1) {
    const step = steps[i];
    const waiting = blockedBy(s, step, ctx);
    if (waiting) return { timeline, state: s, next: i, blocked: waiting, readyAt: busy };
    if (branchTaken(s, step, ctx) === false) continue; // the branch the learner did not choose
    if (step.do === "act" && step.prompt && !performed.has(i)) {
      const amount = step.action === "call" ? owedBy(s, step.seat) : step.to != null ? Number(step.to) : Number(step.amount || 0);
      return { timeline, state: s, next: i, blocked: { kind: "action", index: i, seat: step.seat, action: step.action, prompt: step.prompt, amount }, readyAt: busy };
    }
    const at = t;
    const timing = stepTiming(step, s, { reduce });
    s = apply(s, step, { ...ctx, index: i }, hand);
    timeline.push({ index: i, step, at, state: s });
    busy = Math.max(busy, at + timing.settle);
    // The automatic deal of a start board (expandScript) lands in ONE render: hole cards at 0/.1 s
    // and the board at the live index delays (i * .15 s), the way the live table mounts a board.
    // Dealing street by street here left the unfilled slots dashed for about a second.
    const chained = step.auto && steps[i + 1]?.auto;
    t = chained ? at : at + timing.lead;
    // The script after the deal waits for the last card to land.
    if (step.auto && !chained) t = Math.max(t, busy);
    if (step.do === "decide" && !ctx.answers?.[step.spotId]) {
      return { timeline, state: s, next: i + 1, blocked: { kind: "decide", spotId: step.spotId }, readyAt: Math.max(busy, at) };
    }
  }
  return { timeline, state: s, next: steps.length, blocked: null, readyAt: busy };
}

// The first frame a hand paints: its start state plus every step that fires on mount (at 0 ms).
// The hook seeds React state with it, so a new hand never paints an empty felt ("Waiting for
// hand…") or dashed board slots before the deal starts.
export function mountState(hand, { from = 0, epoch = 0, answers = {}, reduce = false } = {}) {
  if (!hand) return null;
  const start = from > 0 && epoch === 0 ? stateAfter(hand, from, { answers }) : initialState(hand, { epoch });
  const run = runUntilBlocked(hand, start, epoch === 0 ? from : 0, { answers }, { reduce });
  const first = run.timeline.filter((entry) => entry.at <= 0).at(-1);
  return first ? first.state : start;
}

// SPEC name: the settle time of one step, in ms.
export const settleTime = (step, state) => stepTiming(step, state).settle;

// Drop the one-shot events, so a state mounted directly (resume, retry, handoff) never replays a
// chip flight. ChipFlow and ResultFlash ignore a null event.
export function settled(state) {
  return { ...state, betEvent: null, winEvent: null, entrance: "settled" };
}

// The settled state after the first `count` steps of the effective script (used for handoff,
// retry and Back). Steps that would block are applied only if the context allows them.
export function stateAfter(hand, count, ctx = {}, { epoch = 0 } = {}) {
  const steps = expandScript(hand);
  let s = initialState(hand, { epoch });
  for (let i = 0; i < Math.min(count, steps.length); i += 1) {
    if (blockedBy(s, steps[i], ctx)) break;
    if (branchTaken(s, steps[i], ctx) === false) continue;
    s = apply(s, steps[i], { ...ctx, index: i }, hand);
  }
  return settled(s);
}

// Film sampling. `beats[i]` is the start time in seconds of step i of the sequence (intro steps
// first when the hand has an intro, then the script); a step without a beat never runs in the film.
// Returns the table state at time t plus when each applied step started, so the kit can compute
// every motion's progress from the tableMotion curves.
export function filmSteps(hand) {
  return Array.isArray(hand?.intro) ? [...hand.intro, ...(hand.script || [])] : expandScript(hand);
}
export function stateAt(hand, t, beats, ctx = {}) {
  const steps = filmSteps(hand);
  let s = Array.isArray(hand?.intro) ? { ...baseState(hand, { empty: true }) } : initialState(hand);
  const applied = [];
  for (let i = 0; i < steps.length; i += 1) {
    const at = Array.isArray(beats) ? beats[i] : beats?.[i];
    if (at == null || at > t) continue;
    if (steps[i].do === "decide") continue; // no dock in a film; the table does not change turn
    if (blockedBy(s, steps[i], ctx)) continue;
    if (branchTaken(s, steps[i], ctx) === false) continue;
    const before = s;
    s = apply(s, steps[i], { ...ctx, index: i }, hand);
    applied.push({ index: i, step: steps[i], at, timing: stepTiming(steps[i], before) });
  }
  return { state: s, applied };
}

// ---- the props the table takes -----------------------------------------------------------------
// Maps a driver state onto <Table>/<TableSurface> props. Card codes become server-shaped cards.
// Heads-up, the opponent's hole cards stay null (face-down) until a showdown sets oppRevealCards.
// With more seats, a seat the showdown shows carries its own cards, so only that seat flips.
export function tableProps(state) {
  const card = (code) => (code == null ? null : toTableCard(code));
  const perSeat = state.seats.length > 2;
  return {
    layout: state.layout,
    heroId: HERO,
    handId: state.handId,
    haveHand: state.haveHand,
    status: "playing",
    seats: state.seats.map((seat) => ({
      id: seat.id,
      username: seat.username,
      chips: seat.chips,
      currentBet: seat.currentBet,
      cards: seat.id === HERO ? seat.cards.map(card)
        : perSeat && state.revealed?.[seat.id] && seat.cards.length ? state.revealed[seat.id].map(card)
          : seat.cards.map(() => null),
      ...(seat.folded != null ? { folded: seat.folded } : { folded: false }),
    })),
    community: state.community.map(card),
    pot: state.pot,
    currentBet: state.currentBet,
    canCall: state.canCall,
    dealerId: state.dealerId,
    currentTurnId: state.currentTurnId,
    botId: state.botId,
    oppRevealCards: !perSeat && state.oppRevealCards ? state.oppRevealCards.map(card) : null,
    result: state.result,
    // Lesson-only table props (inert on live): cards already on the felt render at rest, and a
    // paid pot counts down over the win-chip flight instead of snapping.
    settledCards: state.entrance === "settled",
    potCountDownMs: PAYOUT_MS,
    betEvent: state.betEvent,
    winEvent: state.winEvent,
    highlightCards: state.highlightCards,
    dimCards: state.dimCards,
    // Six-max only: each seat's position label, for the lesson's position tags (not a Table prop).
    ...(state.layout === "six-max" ? { positions: state.positions } : null),
  };
}

// ---- a lesson's hands against its spots ----------------------------------------------------------
// The producer's gate (RECIPE step 6): every decision stage names a hand that validates, the hand
// decides that spot, and what the spot tells the learner matches the table at that moment (hero
// cards, board, street, the pot before the bet, the bet and the call). An aggressive choice needs
// its size on the hand's answer step. Returns a list of problems; [] means the lesson is consistent.
export function validateDefinitionHands(definition) {
  const errors = [];
  const stages = (definition?.stages || []).map((stage, index) => ({ ...stage, index })).filter((stage) => stage.kind === "decision");
  const same = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);
  const decidedOrder = {};
  for (const stage of stages) {
    const where = `stage ${stage.index} (${stage.spotId})`;
    const hand = definition.hands?.[stage.hand];
    const spot = definition.spots?.[stage.spotId];
    if (!hand) { errors.push(`${where}: hand "${stage.hand}" is not in hands.`); continue; }
    if (!spot) { errors.push(`${where}: spot is not in spots.`); continue; }
    if (hand.id !== stage.hand) errors.push(`${where}: hands["${stage.hand}"].id must be "${stage.hand}".`);
    if (!["guided", "practice", "fresh"].includes(stage.role)) errors.push(`${where}: role must be guided, practice or fresh.`);
    const handErrors = validateHand(hand);
    if (handErrors.length) { errors.push(...handErrors.map((e) => `${where}: hand ${stage.hand}: ${e}`)); continue; }
    const steps = expandScript(hand);
    const at = steps.findIndex((step) => step.do === "decide" && step.spotId === stage.spotId);
    if (at < 0) { errors.push(`${where}: hand ${stage.hand} has no decide step for this spot.`); continue; }
    decidedOrder[stage.hand] = [...(decidedOrder[stage.hand] || []), at];
    // Earlier decisions on this hand answered with a neutral choice (they cannot deal a street).
    const answers = {};
    for (const earlier of stages) {
      if (earlier.hand !== stage.hand || earlier.index >= stage.index) continue;
      const other = definition.spots[earlier.spotId] || {};
      answers[earlier.spotId] = { action: (other.choices || []).includes("call") ? "call" : (other.choices || [])[0], value: 0, band: "", cards: [] };
    }
    const s = stateAfter(hand, at + 1, { answers });
    if (!s.decided.includes(stage.spotId)) { errors.push(`${where}: the script is blocked before this decision.`); continue; }
    const heroCards = s.seats[0].cards;
    if (spot.hero && !same(spot.hero, heroCards)) errors.push(`${where}: spot.hero ${spot.hero.join(" ")} is not the hand's hero ${heroCards.join(" ")}.`);
    if (spot.board && !same(spot.board, s.community)) errors.push(`${where}: spot.board ${spot.board.join(" ")} is not the table's board ${s.community.join(" ") || "(none)"}.`);
    if (spot.street && s.street && spot.street !== s.street) errors.push(`${where}: spot.street ${spot.street} but the table is on the ${s.street}.`);
    if (Number.isFinite(spot.call) && spot.call !== s.currentBet) errors.push(`${where}: spot.call ${spot.call} but the hero owes ${s.currentBet}.`);
    if (Number.isFinite(spot.potBefore) && Number.isFinite(spot.bet) && spot.potBefore + spot.bet !== s.pot) errors.push(`${where}: spot.potBefore + spot.bet is ${spot.potBefore + spot.bet} but the pot is ${s.pot}.`);
    if (spot.decision === "action") {
      const aggressive = (spot.choices || []).filter((choice) => !PASSIVE.includes(choice));
      const answerStep = steps.find((step) => step.do === "act" && step.action === "answer" && step.spotId === stage.spotId);
      for (const choice of aggressive) {
        if (!answerStep) errors.push(`${where}: choice "${choice}" needs an answer step with sizes.`);
        else if (!(Number(answerStep.sizes?.[choice]) > 0)) errors.push(`${where}: the answer step needs sizes["${choice}"].`);
      }
      if ((spot.choices || []).includes("check") && s.currentBet > 0) errors.push(`${where}: check is offered but the hero faces ${s.currentBet}.`);
      if ((spot.choices || []).includes("call") && s.currentBet === 0) errors.push(`${where}: call is offered but there is no bet.`);
    }
  }
  return errors;
}
