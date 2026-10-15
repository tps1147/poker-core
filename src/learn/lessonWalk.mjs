// THE LESSON WALK: can a learner get stuck anywhere in a lesson? A pure walk of a film-first
// definition through the same driver the clients play (scriptedHand.mjs runUntilBlocked, with the
// hook's start rule and its released-answer rule from lessonModel.mjs), so every consumer's tests can
// ask the same questions of all 59 definitions without a browser:
//
//   decisionPoints(definition)  every decision stage at its decision point, once for every branch an
//                               earlier action on the same hand can open: the table state, what blocked
//                               the driver, and the seat whose turn it was before the decision
//   answerOptions(spot)         the answer fields a client sends for each option it offers
//   legalActions(state)         what the hero may legally do on that table
//   afterAnswer(...)            the driver once an answer is saved: where the hand goes next
//   walkProblems(definition)    every way a learner could be stuck: [] means none was found
//
// A problem names the definition, the stage, the branch and what is wrong, so a data fix is exact.
// The why stage and the film's "Your turn" pause are checked for options a client can render. No
// grading lives here (poker-core ships no keys); the server's test plays the same options through
// its reducer and registry.
// Relative imports with extensions: plain Node, Metro and the web bundler all load it.
import { HERO, PASSIVE, expandScript, initialState, runUntilBlocked, stateAfter, validateDefinitionHands } from "./scriptedHand.mjs";
import { decisionStages } from "./lessons/index.mjs";
import { isWhyStage } from "./academyLoop.mjs";

const AGGRESSIVE = (choice) => !PASSIVE.includes(choice);
const maxBet = (state) => state.seats.reduce((m, seat) => Math.max(m, seat.currentBet || 0), 0);
const heroSeat = (state) => state.seats.find((seat) => seat.id === HERO) || null;

// Every option a client offers for a spot, as the fields its answer carries. Counts offer every value
// of their stepper; a best five offers every five of the visible cards.
export function answerOptions(spot) {
  if (!spot) return [];
  if (spot.decision === "action" || spot.kind === "choice") return (spot.choices || []).map((choice) => ({ id: String(choice), fields: { action: choice } }));
  if (spot.decision === "estimate") return (spot.bands || []).map((band) => ({ id: String(band.id ?? band), fields: { band: band.id ?? band } }));
  if (spot.decision === "count") {
    const [min, max] = Array.isArray(spot.range) ? spot.range : [0, 47];
    const step = spot.step || 1;
    const out = [];
    for (let value = min; value <= max; value += step) out.push({ id: String(value), fields: { value } });
    return out;
  }
  if (spot.decision === "best-five") {
    const cards = [...(spot.hero || []), ...(spot.board || [])];
    const out = [];
    const pick = (start, chosen) => {
      if (chosen.length === 5) { out.push({ id: chosen.join(" "), fields: { cards: chosen.slice() } }); return; }
      for (let i = start; i < cards.length; i += 1) pick(i + 1, [...chosen, cards[i]]);
    };
    pick(0, []);
    return out;
  }
  return [];
}

// What the hero may do on this table: fold, check, call, bet, raise (a bet or raise only with chips
// behind the price). A choice the lesson labels differently ("large-bet") is a bet or a raise.
export function legalActions(state) {
  const hero = heroSeat(state);
  if (!hero || hero.folded || !(hero.chips > 0)) return [];
  const top = maxBet(state);
  const owed = Math.max(0, top - (hero.currentBet || 0));
  const out = ["fold"];
  if (owed === 0) out.push("check");
  if (owed > 0) out.push("call");
  if (top === 0) out.push("bet");
  if (top > 0 && hero.chips > owed) out.push("raise");
  return out;
}
export function choiceIsLegal(state, choice) {
  const legal = legalActions(state);
  if (!AGGRESSIVE(choice)) return legal.includes(choice);
  return legal.includes(maxBet(state) > 0 ? "raise" : "bet");
}

// The saved answer a client hands the driver: an action spot's `action`, any other spot's response.
export function savedAnswer(spot, fields, correct = null) {
  return spot?.decision === "action" ? { action: fields.action, correct } : { response: { ...fields }, correct };
}

// Play a hand the way the client hook does: from the live plan's start (its `startAt`, settled), to
// the first input, pressing every hero prompt on the way. `answers` are the released answers.
export function playHand(hand, answers = {}) {
  const from = hand.startAt || 0;
  let state = from > 0 ? stateAfter(hand, from, { answers }) : initialState(hand);
  let next = from;
  const performed = [];
  let turnBefore = null;
  const steps = expandScript(hand);
  for (let guard = 0; guard < 128; guard += 1) {
    const run = runUntilBlocked(hand, state, next, { answers, performed }, { reduce: true });
    // The seat whose turn it was just before the decide step ran (decide always hands the hero the turn).
    const decideAt = run.timeline.findIndex((entry) => entry.step.do === "decide" && entry.index === run.next - 1);
    if (run.blocked?.kind === "decide") turnBefore = decideAt > 0 ? run.timeline[decideAt - 1].state.currentTurnId : decideAt === 0 ? state.currentTurnId : turnBefore;
    state = run.state;
    next = run.next;
    if (run.blocked?.kind === "action") { performed.push(run.blocked.index); continue; }
    return { state, blocked: run.blocked, next, performed, turnBefore, steps: steps.length };
  }
  return { state, blocked: { kind: "loop" }, next, performed, turnBefore, steps: steps.length };
}

// Every combination of the choices of the earlier ACTION decisions on the same hand (the branches);
// counts, estimates and best fives do not branch, so they are answered once.
function branchesBefore(definition, stage) {
  const earlier = decisionStages(definition).filter((item) => item.hand === stage.hand && item.index < stage.index);
  let combos = [{ answers: {}, path: [] }];
  for (const item of earlier) {
    const spot = definition.spots[item.spotId];
    const options = spot?.decision === "action" ? answerOptions(spot) : answerOptions(spot).slice(0, 1);
    combos = combos.flatMap((combo) => options.map((option) => ({
      answers: { ...combo.answers, [item.spotId]: savedAnswer(spot, option.fields) },
      path: [...combo.path, `${item.spotId}=${option.id}`],
    })));
  }
  return combos;
}

// Each decision stage at its decision point, once per branch.
export function decisionPoints(definition) {
  const out = [];
  for (const stage of decisionStages(definition)) {
    const hand = definition.hands?.[stage.hand];
    const spot = definition.spots?.[stage.spotId];
    for (const branch of branchesBefore(definition, stage)) {
      const played = hand ? playHand(hand, branch.answers) : null;
      out.push({ stage, spot, hand, branch: branch.path, answers: branch.answers, ...(played || {}) });
    }
  }
  return out;
}

// The driver once this stage's answer is saved and released: the next input on the hand, or its end.
export function afterAnswer(point, fields) {
  const answers = { ...point.answers, [point.stage.spotId]: savedAnswer(point.spot, fields) };
  return playHand(point.hand, answers);
}

const WHERE = (definition, stage, branch = []) => `${definition.id}@${definition.version} stage ${stage.index ?? ""} (${stage.spotId || stage.kind})${branch.length ? ` after ${branch.join(", ")}` : ""}`;

export function walkProblems(definition) {
  const problems = [];
  const stages = definition?.stages || [];
  // The tables match their spots on the neutral path (the producer's gate).
  for (const error of validateDefinitionHands(definition)) problems.push(`${definition.id}@${definition.version}: ${error}`);

  // The why step: two or more distinct options, each with words a client renders.
  stages.forEach((stage, index) => {
    if (!isWhyStage(stage)) return;
    const options = (stage.options || []).filter((option) => option && option.text);
    const ids = options.map((option) => String(option.id));
    if (options.length < 2) problems.push(`${WHERE(definition, { ...stage, index })}: the why step offers ${options.length} option(s).`);
    if (new Set(ids).size !== ids.length) problems.push(`${WHERE(definition, { ...stage, index })}: the why options repeat an id.`);
    if (!stage.spotId) problems.push(`${WHERE(definition, { ...stage, index })}: the why step names no spotId to answer.`);
  });

  // The film's "Your turn": an authored spot offers something to commit (or the card's plain commit).
  stages.forEach((stage, index) => {
    if (stage.kind !== "film" || !stage.pause?.spot) return;
    const spot = stage.pause.spot;
    const offered = answerOptions(spot);
    const known = ["action", "estimate", "count"].includes(spot.decision) || spot.kind === "choice";
    if (known && !offered.length) problems.push(`${WHERE(definition, { ...stage, index })}: the "Your turn" spot offers no option.`);
    if (!stage.pause.spotId) problems.push(`${WHERE(definition, { ...stage, index })}: the "Your turn" pause names no spotId.`);
  });

  for (const point of decisionPoints(definition)) {
    const { stage, spot, hand, branch, state, blocked } = point;
    const where = WHERE(definition, stage, branch);
    if (!hand || !spot) { problems.push(`${where}: no hand or no spot.`); continue; }
    // 1. The driver stops at THIS stage's decision (the dock opens only then).
    if (!blocked || blocked.kind !== "decide" || blocked.spotId !== stage.spotId) {
      problems.push(`${where}: the hand never reaches this decision (driver ${blocked ? `${blocked.kind}${blocked.spotId ? ` ${blocked.spotId}` : ""}` : "done"}).`);
      continue;
    }
    // 2. The hero is to act: the hero's turn, a seat still in the hand, with chips, and for an action
    //    it was the hero's turn (or nobody's) before the decision took it.
    const hero = heroSeat(state);
    if (state.currentTurnId !== HERO) problems.push(`${where}: the table has ${state.currentTurnId} to act, not the hero.`);
    if (!hero || hero.folded) problems.push(`${where}: the hero has folded.`);
    else if (!(hero.chips > 0) && spot.decision === "action") problems.push(`${where}: the hero has no chips to act with.`);
    // An action out of turn is not a legal play; a question about the table (an estimate, a count)
    // may pause the hand while another seat is next.
    if (spot.decision === "action" && point.turnBefore != null && point.turnBefore !== HERO) problems.push(`${where}: ${point.turnBefore} was to act; the decision jumps the queue.`);
    // 3. At least one option, every one the table allows.
    const options = answerOptions(spot);
    if (!options.length) problems.push(`${where}: the ${spot.decision} spot offers no option.`);
    if (spot.decision === "action") {
      if (!legalActions(state).length) problems.push(`${where}: the hero has no legal action.`);
      for (const choice of spot.choices) {
        if (!choiceIsLegal(state, choice)) problems.push(`${where}: "${choice}" is not legal here (owed ${Math.max(0, maxBet(state) - (hero?.currentBet || 0))}, top bet ${maxBet(state)}).`);
        if (AGGRESSIVE(choice)) {
          const answerStep = expandScript(hand).find((step) => step.do === "act" && step.action === "answer" && step.spotId === stage.spotId);
          const size = Number(answerStep?.sizes?.[choice]);
          if (size > 0 && size <= maxBet(state)) problems.push(`${where}: "${choice}" to ${size} does not raise the ${maxBet(state)} bet.`);
          if (size > 0 && hero && size > (hero.currentBet || 0) + hero.chips) problems.push(`${where}: "${choice}" to ${size} is more than the hero has.`);
          // The key says what the table will do: the size on the spot matches the answer step's.
          if (size > 0 && Number(spot.sizes?.[choice]) !== size) problems.push(`${where}: "${choice}" plays as ${size} but the spot shows ${spot.sizes?.[choice] ?? "no size"}.`);
        }
      }
    }
    // 4. Every option moves the hand on: to this hand's next decision, or to its end. (A wrong count,
    //    estimate or best five is not released; the driver then holds this decision for the retry,
    //    which blockedBy guarantees, so only the released path can strand the learner.)
    const later = decisionStages(definition).filter((item) => item.hand === stage.hand && item.index > stage.index);
    const nextSpot = later[0]?.spotId || null;
    const sample = spot.decision === "action" ? options : options.slice(0, 1);
    for (const option of sample) {
      let after;
      try { after = afterAnswer(point, option.fields); } catch (error) { problems.push(`${where}: answering ${option.id} throws: ${error.message}`); continue; }
      const b = after.blocked;
      if (!b) { if (nextSpot) problems.push(`${where}: after ${option.id} the hand ends before ${nextSpot}.`); continue; }
      if (b.kind === "decide" && b.spotId === nextSpot) continue;
      problems.push(`${where}: after ${option.id} the driver waits on ${b.kind}${b.spotId ? ` ${b.spotId}` : ""}${nextSpot ? `, not ${nextSpot}` : " on a finished hand"}.`);
    }
  }
  return problems;
}
