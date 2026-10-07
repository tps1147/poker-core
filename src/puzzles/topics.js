'use strict';

// The generator's five topics (pokerServer PuzzleGeneratorService TOPICS, in the server's order),
// the spot each one deals, and the topic an open-stream seed plays.

const { PUZZLE_COPY } = require('./copy');
const { makeSeed, mulberry32 } = require('./seed');

const PUZZLE_TOPICS = Object.freeze(['starting-hands', 'pot-odds', 'postflop-cbet', 'bluffing', 'hand-reading']);
// The topic the server generates when a request names none.
const DEFAULT_PUZZLE_TOPIC = 'pot-odds';
const TOPIC_LABELS = PUZZLE_COPY.topics;
// initialState.action for each topic's spot: facing a raise or a bet (fold / call / raise), or an
// unopened pot (check / bet).
const TOPIC_SPOT = Object.freeze({
  'starting-hands': 'facing_raise',
  'pot-odds': 'facing_bet',
  'postflop-cbet': 'unopened_pot',
  bluffing: 'unopened_pot',
  'hand-reading': 'facing_bet',
});

const isPuzzleTopic = (topic) => typeof topic === 'string' && PUZZLE_TOPICS.includes(topic);

function topicLabel(topic) {
  return isPuzzleTopic(topic) ? TOPIC_LABELS[topic] : null;
}

// The topic an open-stream (or Rush) seed plays: derived from the seed, so one seed handed from a
// preview to the page is one puzzle.
function topicForSeed(seed) {
  const r = mulberry32(makeSeed('topic', 'pick', seed | 0))();
  return PUZZLE_TOPICS[Math.min(PUZZLE_TOPICS.length - 1, Math.floor(r * PUZZLE_TOPICS.length))];
}

module.exports = {
  PUZZLE_TOPICS,
  DEFAULT_PUZZLE_TOPIC,
  TOPIC_LABELS,
  TOPIC_SPOT,
  isPuzzleTopic,
  topicLabel,
  topicForSeed,
};
