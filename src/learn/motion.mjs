// The table timings the scripted-hand driver schedules against (web: flop52web
// src/components/table/tableMotion.js, which the live table animates with). Values
// only; each client animates with its own renderer.
export const CHIP_STAGGER_S = 0.06;
export const STREAM_CHIPS = 3;
export const CHIP_TO_POT_MS = 980;
export const CHIP_TO_WINNER_MS = 1380;
export const FLIP_S = 0.8;
export const REVEAL_STAGGER_S = 0.25;
export const COMMUNITY_STAGGER = 0.15;
export const HOLE_STAGGER = 0.1;
export const POT_ROLL_MS = 720;
export const SPRING_SETTLE = 0.53;
export const MOVE = {
  deal: SPRING_SETTLE, dealStaggerBoard: COMMUNITY_STAGGER, dealStaggerHole: HOLE_STAGGER,
  flip: FLIP_S, flipDelay: 1.2, chipToPot: CHIP_TO_POT_MS / 1000, chipToWinner: CHIP_TO_WINNER_MS / 1000,
  chipStagger: CHIP_STAGGER_S, chipLiftOff: 0.12, chipSettle: 0.2, chipFade: 0.15, streamChips: STREAM_CHIPS,
  potRoll: POT_ROLL_MS / 1000, pillEnter: 0.19, pillSwap: 8 / 24, highlightRing: 0.32, highlightStagger: 0.5,
  dimOthers: 0.32, dimTo: 0.38, stageIn: 0.52, railAdvance: 0.32, verdict: 0.52, rewardFlash: 0.67,
  fold: 0.35, foldDrop: 24, foldRotate: 6, cardLift: 6, dockRise: 0.38,
};
