// The table's hand-strength label: what the hero holds, in plain words, from
// the hero's two cards and the board ("Top pair, weak kicker", "Flush draw",
// "Nothing yet"). It names the made hand and the draw; it never prints an
// equity, a solver number or anything from the rating. Pure and CommonJS so
// the app, the web and plain node all read the same words.
//
// describeHand(hole, board) -> { label, made, draw, tone } or null when the
// hero's two cards are not both known. tone is one of 'strong' (two pair or
// better that uses a hole card), 'made' (a pair that uses a hole card),
// 'draw' (no pair yet, but a flush or straight draw) or 'none'.

const { evaluateHand, compareHands } = require('./pokerEvaluator');

const RANKS = '23456789TJQKA';
const SUIT_ALIASES = { s: '♠', h: '♥', d: '♦', c: '♣', S: '♠', H: '♥', D: '♦', C: '♣' };
const NAMES = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const BOARD_HANDS = { 2: 'Pair', 3: 'Two pair', 4: 'Trips' };
const PLURALS = ['Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens', 'Jacks', 'Queens', 'Kings', 'Aces'];

function cleanCard(card) {
  if (!card || card.hidden) return null;
  let rank = String(card.rank ?? '').toUpperCase();
  if (rank === '10') rank = 'T';
  const suit = SUIT_ALIASES[card.suit] || card.suit;
  if (rank.length !== 1 || !RANKS.includes(rank) || !'♠♥♦♣'.includes(suit) || !suit) return null;
  return { rank, suit, r: RANKS.indexOf(rank) };
}

const cleanList = (cards) => (Array.isArray(cards) ? cards.map(cleanCard).filter(Boolean) : []);

function preflopLabel([a, b]) {
  const [hi, lo] = a.r >= b.r ? [a, b] : [b, a];
  if (hi.r === lo.r) return { label: `Pocket ${PLURALS[hi.r]}`, made: 'pocket-pair', draw: null, tone: 'made' };
  const suited = hi.suit === lo.suit;
  return { label: `${NAMES[hi.r]}-${NAMES[lo.r]} ${suited ? 'suited' : 'offsuit'}`, made: 'high-card', draw: null, tone: 'none' };
}

// A straight draw counts only ranks that complete a straight using a hole card
// and that the board alone would not complete. 2+ such ranks is open-ended (or
// a double gutshot, which plays the same); 1 is a gutshot.
function straightOuts(hole, board) {
  const all = new Set([...hole, ...board].map((c) => c.r));
  const boardRanks = new Set(board.map((c) => c.r));
  const holeRanks = new Set(hole.map((c) => c.r));
  const makes = (ranks) => {
    const has = (r) => ranks.has(r === -1 ? 12 : r);
    for (let top = 12; top >= 3; top -= 1) {
      let run = true;
      for (let r = top; r > top - 5; r -= 1) if (!has(r)) { run = false; break; }
      if (run) return top;
    }
    return -1;
  };
  if (makes(all) >= 0) return 0;
  let outs = 0;
  for (let r = 0; r < 13; r += 1) {
    if (all.has(r)) continue;
    const top = makes(new Set([...all, r]));
    if (top < 0) continue;
    // The run must include one of the hero's ranks, or the board plays it for everyone.
    let usesHole = false;
    for (let x = top; x > top - 5; x -= 1) {
      const rank = x === -1 ? 12 : x;
      if (holeRanks.has(rank) && !boardRanks.has(rank)) { usesHole = true; break; }
    }
    if (usesHole) outs += 1;
  }
  return outs;
}

function flushDraw(hole, board) {
  for (const suit of '♠♥♦♣') {
    const held = hole.filter((c) => c.suit === suit).length;
    const total = held + board.filter((c) => c.suit === suit).length;
    if (held > 0 && total === 4) return true;
  }
  return false;
}

function kickerWords(pairRank, kicker) {
  const best = pairRank === 12 ? 11 : 12; // with top pair aces, a king is the top kicker
  if (kicker >= best) return 'top kicker';
  if (kicker >= 8) return 'good kicker'; // ten or better
  return 'weak kicker';
}

function pairLabel(hole, board, pairRank) {
  const boardRanks = [...new Set(board.map((c) => c.r))].sort((x, y) => y - x);
  const pocket = hole[0].r === hole[1].r;
  if (pocket) {
    if (pairRank > boardRanks[0]) return 'Overpair';
    return `Pocket ${PLURALS[pairRank]}`;
  }
  const other = hole.find((c) => c.r !== pairRank);
  const kicker = other ? other.r : -1;
  if (pairRank === boardRanks[0]) return `Top pair, ${kickerWords(pairRank, kicker)}`;
  if (pairRank === boardRanks[boardRanks.length - 1]) return 'Bottom pair';
  return 'Middle pair';
}

// The made hand the hero's cards build, as { words, strong }, or null when the
// hand is the board's alone (a board pair, board trips, board two pair).
function madeLabel(hole, board, made) {
  const holeRanks = hole.map((c) => c.r);
  const pocket = holeRanks[0] === holeRanks[1];
  const strong = (words) => ({ words, strong: true });
  const pair = (rank) => ({ words: pairLabel(hole, board, rank), strong: false });
  const boardPairs = board.map((c) => c.r).filter((r, i, all) => all.indexOf(r) !== i);
  switch (made.rank) {
    case 10: return strong('Royal flush');
    case 9: return strong('Straight flush');
    case 8: return strong('Four of a kind');
    case 7: return strong('Full house');
    case 6: return strong('Flush');
    case 5: return strong('Straight');
    case 4:
      if (pocket && holeRanks[0] === made.value) return strong(`Set of ${PLURALS[made.value]}`);
      if (holeRanks.includes(made.value)) return strong(`Trips, ${PLURALS[made.value]}`);
      return null;
    case 3: {
      const [high, low] = made.values || [];
      const onBoard = (rank) => boardPairs.includes(rank);
      const mine = [high, low].filter((rank) => !onBoard(rank));
      if (mine.length === 2) return strong(`Two pair, ${PLURALS[high]} and ${PLURALS[low]}`);
      if (mine.length === 1) return pair(mine[0]); // one pair of the hero's on a paired board
      // Board two pair: the hero's pair, if any, is a third pair the evaluator dropped.
      if (pocket) return pair(holeRanks[0]);
      const hit = hole.find((c) => board.some((b) => b.r === c.r));
      return hit ? pair(hit.r) : null;
    }
    case 2:
      return holeRanks.includes(made.value) ? pair(made.value) : null;
    default: return null;
  }
}

function describeHand(holeCards, boardCards = []) {
  const hole = cleanList(holeCards);
  if (hole.length !== 2) return null;
  const board = cleanList(boardCards).slice(0, 5);
  if (board.length < 3) return preflopLabel(hole);

  const made = evaluateHand([...hole, ...board]);
  const onRiver = board.length === 5;
  const boardHand = onRiver ? evaluateHand(board) : null;
  const playsBoard = onRiver && boardHand && compareHands(made, boardHand) === 0;

  const mine = playsBoard ? null : madeLabel(hole, board, made);
  const words = mine?.words || null;
  const tone = mine?.strong ? 'strong' : 'made';

  let draw = null;
  if (!onRiver && made.rank < 5) {
    const flush = flushDraw(hole, board);
    const outs = straightOuts(hole, board);
    const straight = outs >= 2 ? 'Open-ended straight draw' : outs === 1 ? 'Gutshot' : null;
    if (flush && straight) draw = outs >= 2 ? 'Flush and straight draw' : 'Flush draw and gutshot';
    else if (flush) draw = 'Flush draw';
    else if (straight) draw = straight;
  }

  if (words && draw) {
    const shortDraw = draw === 'Open-ended straight draw' ? 'straight draw' : draw.charAt(0).toLowerCase() + draw.slice(1);
    // Keep the pair short beside a draw: "Top pair + flush draw".
    return { label: `${words.replace(/, \w+ kicker$/, '')} + ${shortDraw}`, made: words, draw, tone };
  }
  if (words) return { label: words, made: words, draw: null, tone };
  if (draw) return { label: draw, made: null, draw, tone: 'draw' };
  if (playsBoard) return { label: 'Playing the board', made: null, draw: null, tone: 'none' };
  if (onRiver) {
    const high = Math.max(hole[0].r, hole[1].r);
    // The board holds the made hand and the hero's card only plays as its kicker:
    // "Two pair on board, ace kicker", never "Ace high".
    const onBoard = BOARD_HANDS[made.rank];
    if (onBoard) {
      return { label: `${onBoard} on board, ${NAMES[high].toLowerCase()} kicker`, made: null, draw: null, tone: 'none' };
    }
    return { label: `${NAMES[high]} high`, made: null, draw: null, tone: 'none' };
  }
  return { label: 'Nothing yet', made: null, draw: null, tone: 'none' };
}

module.exports = { describeHand };
