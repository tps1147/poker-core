// GAUNTLET ACCESS — the sequential-mastery rule the server enforces before a campaign
// challenge is allowed, extracted from pokerServer/src/services/journeyProgressionService.js
// so mobile can derive the SAME lock state from the server's progress instead of the
// legacy aggregate unlockCondition rule (which disagrees with the gate).
//
// Rule: the campaign advances in roster order. A bot is unlocked when EVERY earlier roster
// bot is mastered, where mastered = listed in botProgress.masteredBots OR
// winsByBot[id] >= MASTERY_TARGETS[id]. Legacy `beaten` stamps are never credentials.
//
// Pure, CommonJS, zero new deps. `../data/botRoster` is cycle-free from here because it
// imports `../rating/ratingBands` directly, not the rating barrel.

const { BOT_ROSTER } = require('../data/botRoster');
const { getBotMasteryTarget } = require('./journeyProgress');

const asArray = (value) => (Array.isArray(value) ? Array.from(value) : []);

// Byte-for-byte the server's MASTERY_TARGETS construction.
const buildMasteryTargets = (roster = BOT_ROSTER) => Object.freeze(Object.fromEntries(
  asArray(roster).map((bot) => [bot.id, getBotMasteryTarget(bot, roster)])
));

const MASTERY_TARGETS = buildMasteryTargets(BOT_ROSTER);

// Mastered = stored mastery OR at/over the target. NOTE: `wins >= undefined` is false, which
// is exactly the server's behaviour for an id with no target — keep it, no extra guard.
const isBotMasteredByProgress = (botId, progress = {}, masteryTargets = MASTERY_TARGETS) => {
  const botProgress = (progress && progress.botProgress) || {};
  const masteredBots = asArray(botProgress.masteredBots);
  const wins = Number(botProgress.winsByBot && botProgress.winsByBot[botId]);
  return masteredBots.includes(botId)
    || (Number.isFinite(wins) && wins >= masteryTargets[botId]);
};

// null for anything not on the roster (custom practice bots are outside the campaign).
const getGauntletAccess = (
  botId,
  progress = {},
  { roster = BOT_ROSTER, masteryTargets = MASTERY_TARGETS } = {}
) => {
  const list = asArray(roster);
  const botIndex = list.findIndex((bot) => bot.id === botId);
  if (botIndex < 0) return null;

  const remainingBots = list
    .slice(0, botIndex)
    .filter((bot) => !isBotMasteredByProgress(bot.id, progress, masteryTargets));

  return { isUnlocked: remainingBots.length === 0, remainingBots };
};

const buildGauntletAccessMap = (progress = {}, opts = {}) => {
  const roster = asArray(opts.roster || BOT_ROSTER);
  return Object.fromEntries(roster.map((bot) => [bot.id, getGauntletAccess(bot.id, progress, { ...opts, roster })]));
};

// The data behind "Master X (N wins)": the FIRST unmastered earlier bot and its target.
const getGauntletLockRequirement = (access, masteryTargets = MASTERY_TARGETS) => {
  const required = access && asArray(access.remainingBots)[0];
  if (!required) return null;
  return { botId: required.id, name: required.name, wins: masteryTargets[required.id] };
};

module.exports = {
  MASTERY_TARGETS,
  buildGauntletAccessMap,
  buildMasteryTargets,
  getGauntletAccess,
  getGauntletLockRequirement,
  isBotMasteredByProgress,
};
