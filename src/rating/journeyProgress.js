// CommonJS, zero imports — copied verbatim from Poker.com/src/game/journeyProgress.js
// during extraction, with ONE small, backward-compatible change to tame a Date
// impurity: createReviewSeed and recordBotMatchResult now accept an OPTIONAL
// trailing `clock` param (default `() => new Date().toISOString()`). All existing
// 2-arg call sites behave identically; a caller can inject a fixed clock for
// deterministic output. See the note in poker-core/README.md.
//
// REMAINING IMPURITY (left as-is): buildConceptLessonLink stamps
// `learnNonce: String(Date.now())` — it's an exported helper the UI calls
// directly, so threading a clock there would change a public signature.

const DEFAULT_AI_RATING = 500;
const MAX_RECENT_RESULTS = 20;
const MAX_REVIEW_SEEDS = 30;
const MAX_PROCESSED_KEYS = 120;

const MASTERY_TARGET_BY_DIFFICULTY = Object.freeze({
  BEGINNER: 3,
  INTERMEDIATE: 5,
  ADVANCED: 7,
  EXPERT: 9,
});

// Player-type labels (mirror of botProfiles ARCHETYPE_META) so coach cards can flavor the result
// ("You beat the Maniac") without importing the profile module.
const ARCHETYPE_LABEL = Object.freeze({
  'calling-station': 'Calling Station',
  nit: 'Nit',
  tag: 'TAG',
  lag: 'Maniac',
  trapper: 'Trapper',
  shark: 'Shark',
  drawer: 'Gambler',
  balanced: 'All-Rounder',
});

// BOT <-> CONCEPT tie-in. Each opponent archetype routes to ONE concept-map node so a themed bot
// becomes "the concept you beat." Values are REAL: `id`/`lessonTag` come from the grounded concept
// map (T1-T5), `ring`/`topic`/`leakKey` only ever name a value that already ships
// (buildSkillScoreCards keys / PUZZLE_TOPICS / LEAK_DRILL_MAP keys), and `name` is the node label.
// Archetypes with no single atomic concept (balanced) are intentionally absent -> resolves to null.
const ARCHETYPE_LESSON_MAP = Object.freeze({
  // Calls everything -> the lesson that fixes loose calling is value betting / starting hands.
  'calling-station': { id: 't2-starting-hands', lessonTag: 'starting-hands', name: 'Starting Hands', ring: 'handSelection', topic: 'starting-hands', leakKey: 'leak-vpip' },
  // Ultra-tight -> learn to open the right range from each seat.
  nit: { id: 't2-rfi-by-position', lessonTag: 'rfi-by-position', name: 'RFI by Position', ring: 'handSelection', topic: 'starting-hands', leakKey: 'leak-vpip' },
  // Value-driven, position-aware -> board texture + c-betting is the postflop answer.
  tag: { id: 't3-board-texture', lessonTag: 'board-texture', name: 'Board Texture', ring: 'postflop', topic: 'postflop-cbet', leakKey: null },
  // Over-bluffs / max pressure -> learn bluffing AND how to defend (we lead with bluffing).
  lag: { id: 't4-bluffing', lessonTag: 'bluffing', name: 'Bluffing', ring: 'aggression', topic: 'bluffing', leakKey: 'leak-passive' },
  // Slowplays / check-raises / traps -> MDF & bluff-catching is the counter.
  trapper: { id: 't4-mdf-bluffcatch', lessonTag: 'mdf-bluffcatch', name: 'MDF & Bluff-Catching', ring: 'discipline', topic: 'hand-reading', leakKey: 'leak-station' },
  // Balanced & ruthless GTO -> player typing / hand-reading is how you keep up.
  shark: { id: 't5-player-typing', lessonTag: 'player-typing', name: 'Player Typing', ring: null, topic: 'hand-reading', leakKey: null },
  // Chases draws / overvalues equity -> equity & fold-equity semi-bluff math.
  drawer: { id: 't1-equity', lessonTag: 'equity', name: 'Equity', ring: 'pokerMath', topic: 'pot-odds', leakKey: 'leak-math' },
});

// Resolve a concept-map node for a beaten/selected bot. Prefers the bot's archetype (the durable
// join key); falls back to null when no atomic concept maps (e.g. 'balanced'). Never invents a node.
const resolveConceptForBot = (bot = {}, archetypeOverride = null) => {
  const archetype = archetypeOverride || bot?.archetype || null;
  const node = archetype ? ARCHETYPE_LESSON_MAP[archetype] : null;
  if (!node) return null;
  // Carry the bot's own learningTieIn copy through as the human-readable focus blurb when present,
  // so the surfaced hint stays consistent with the existing per-bot text the journey already shows.
  return {
    ...node,
    archetype,
    focus: bot?.learningTieIn || node.name,
  };
};

// Deep-link payload a UI spreads into router.push to open the matched lesson on the Learn tab.
// Shape mirrors the leak->drill route (statsPresentation buildLeakDrill) so both CTAs behave the
// same. Returns null when the bot has no mapped concept (honest: no link rather than a dead one).
const buildConceptLessonLink = (node) => {
  if (!node?.lessonTag) return null;
  return {
    id: `learn-${node.lessonTag}`,
    lessonTag: node.lessonTag,
    conceptId: node.id,
    conceptName: node.name,
    learnLabel: 'Learn it',
    pathname: '/(tabs)/learn',
    params: {
      learnTag: node.lessonTag,
      learnConceptId: node.id,
      learnNonce: String(Date.now()),
    },
  };
};

// AI-rating thresholds that trigger a "rank up" celebration when first crossed.
const RATING_TIERS = Object.freeze([
  { at: 600, name: 'Intermediate territory' },
  { at: 800, name: 'Advanced territory' },
  { at: 1000, name: 'Expert territory' },
  { at: 1200, name: 'Elite territory' },
]);

const titleCase = (value) => {
  const s = String(value || '').toLowerCase();
  return s ? s[0].toUpperCase() + s.slice(1) : s;
};

const emptyBotProgress = () => ({
  winsByBot: {},
  lossesByBot: {},
  winsByDifficulty: {},
  lossesByDifficulty: {},
  totalWins: 0,
  totalLosses: 0,
  masteredBots: [],
  completedLearningMilestones: [],
  puzzleAccuracy: 0,
});

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const asObject = (value) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);

const asArray = (value) => (Array.isArray(value) ? value : []);

const unique = (items) => Array.from(new Set(asArray(items).filter(Boolean)));

const normalizeDifficulty = (difficulty) => String(difficulty || 'BEGINNER').toUpperCase();

const mergeMaxMaps = (...maps) => {
  const merged = {};
  maps.forEach((map) => {
    Object.entries(asObject(map)).forEach(([key, value]) => {
      const normalizedKey = key === normalizeDifficulty(key) ? key : key;
      merged[normalizedKey] = Math.max(asNumber(merged[normalizedKey]), asNumber(value));
    });
  });
  return merged;
};

const mapSum = (map) => Object.values(asObject(map)).reduce((sum, value) => sum + asNumber(value), 0);

const getNestedNumber = (source, paths, fallback = 0) => {
  for (const path of paths) {
    const value = path.split('.').reduce((cursor, key) => cursor?.[key], source);
    if (Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
};

const getNestedArray = (source, paths) => {
  for (const path of paths) {
    const value = path.split('.').reduce((cursor, key) => cursor?.[key], source);
    if (Array.isArray(value)) return value;
  }
  return [];
};

const extractProgressShape = (source = {}) => {
  const root = source.botProgress || source;
  const botProgression = asObject(source.botProgression);
  const practiceStats = asObject(source.practiceStats);
  const stats = asObject(source.stats);
  const statistics = asObject(source.statistics);

  const winsByBot = mergeMaxMaps(
    root.winsByBot,
    botProgression.winsByBot,
    practiceStats.botWins,
    stats.botWins
  );
  const lossesByBot = mergeMaxMaps(
    root.lossesByBot,
    botProgression.lossesByBot,
    practiceStats.botLosses,
    stats.botLosses
  );
  const winsByDifficulty = mergeMaxMaps(
    root.winsByDifficulty,
    botProgression.winsByDifficulty,
    practiceStats.difficultyWins,
    stats.difficultyWins
  );
  const lossesByDifficulty = mergeMaxMaps(
    root.lossesByDifficulty,
    botProgression.lossesByDifficulty,
    practiceStats.difficultyLosses,
    stats.difficultyLosses
  );

  const totalWins = Math.max(
    asNumber(root.totalWins),
    asNumber(botProgression.totalWins),
    asNumber(practiceStats.botWinsTotal),
    asNumber(statistics.practiceWins),
    asNumber(statistics.soloWins),
    mapSum(winsByBot),
    mapSum(winsByDifficulty)
  );
  const totalLosses = Math.max(
    asNumber(root.totalLosses),
    asNumber(botProgression.totalLosses),
    asNumber(practiceStats.botLossesTotal),
    asNumber(statistics.practiceLosses),
    asNumber(statistics.soloLosses),
    mapSum(lossesByBot),
    mapSum(lossesByDifficulty)
  );

  return {
    winsByBot,
    lossesByBot,
    winsByDifficulty,
    lossesByDifficulty,
    totalWins,
    totalLosses,
    masteredBots: unique([
      ...asArray(root.masteredBots),
      ...asArray(botProgression.masteredBots),
      ...asArray(practiceStats.masteredBots),
    ]),
    completedLearningMilestones: unique([
      ...asArray(root.completedLearningMilestones),
      ...getNestedArray(source, [
        'learningProgress.completedMilestones',
        'botProgression.completedLearningMilestones',
      ]),
    ]),
    puzzleAccuracy: Math.max(
      asNumber(root.puzzleAccuracy),
      getNestedNumber(source, [
        'learningProgress.puzzleAccuracy',
        'practiceStats.puzzleAccuracy',
        'statistics.puzzleAccuracy',
      ])
    ),
  };
};

const getAiRatingFrom = (source = {}) => {
  const root = source.botProgress || source;
  return getNestedNumber(
    {
      ...source,
      root,
    },
    [
      'aiRating',
      'root.aiRating',
      'botProgression.aiRating',
      'practiceStats.aiRating',
      'stats.aiRating',
    ],
    DEFAULT_AI_RATING
  );
};

const hasAiRating = (source = {}) => {
  const root = source.botProgress || source;
  return [
    source.aiRating,
    root.aiRating,
    source.botProgression?.aiRating,
    source.practiceStats?.aiRating,
    source.stats?.aiRating,
  ].some((value) => Number.isFinite(Number(value)));
};

const normalizeBotJourneyProgress = ({ user = {}, localProgress = {} } = {}) => {
  const serverProgress = extractProgressShape(user);
  const localShape = extractProgressShape(localProgress);
  const localRoot = localProgress || {};
  const localBotProgress = localRoot.botProgress || {};
  const aiRating = hasAiRating(localRoot) ? getAiRatingFrom(localRoot) : getAiRatingFrom(user);

  return {
    botProgress: {
      ...emptyBotProgress(),
      winsByBot: mergeMaxMaps(serverProgress.winsByBot, localShape.winsByBot),
      lossesByBot: mergeMaxMaps(serverProgress.lossesByBot, localShape.lossesByBot),
      winsByDifficulty: mergeMaxMaps(serverProgress.winsByDifficulty, localShape.winsByDifficulty),
      lossesByDifficulty: mergeMaxMaps(serverProgress.lossesByDifficulty, localShape.lossesByDifficulty),
      totalWins: Math.max(serverProgress.totalWins, localShape.totalWins),
      totalLosses: Math.max(serverProgress.totalLosses, localShape.totalLosses),
      masteredBots: unique([...serverProgress.masteredBots, ...localShape.masteredBots]),
      completedLearningMilestones: unique([
        ...serverProgress.completedLearningMilestones,
        ...localShape.completedLearningMilestones,
      ]),
      puzzleAccuracy: Math.max(serverProgress.puzzleAccuracy, localShape.puzzleAccuracy),
    },
    aiRating,
    winStreak: asNumber(localRoot.winStreak),
    recentResults: asArray(localRoot.recentResults),
    lastMilestone: localRoot.lastMilestone || null,
    lastResult: localRoot.lastResult || null,
    reviewSeeds: asArray(localRoot.reviewSeeds),
    processedResultKeys: unique(localRoot.processedResultKeys || localBotProgress.processedResultKeys),
  };
};

const getBotWins = (progress, botId) => asNumber(progress?.botProgress?.winsByBot?.[botId]);
const getBotLosses = (progress, botId) => asNumber(progress?.botProgress?.lossesByBot?.[botId]);
const getDifficultyWins = (progress, difficulty) => {
  const key = normalizeDifficulty(difficulty);
  return Math.max(
    asNumber(progress?.botProgress?.winsByDifficulty?.[key]),
    asNumber(progress?.botProgress?.winsByDifficulty?.[difficulty])
  );
};

const getBotMasteryTarget = (bot, allBots = []) => {
  const downstreamTargets = asArray(allBots)
    .map((candidate) => candidate?.unlockCondition)
    .filter((condition) => condition?.type === 'botWins' && condition.botId === bot?.id)
    .map((condition) => asNumber(condition.count))
    .filter((count) => count > 0);

  if (downstreamTargets.length > 0) {
    return Math.max(...downstreamTargets);
  }

  return MASTERY_TARGET_BY_DIFFICULTY[normalizeDifficulty(bot?.difficulty)] || 5;
};

const getUnlockProgress = (condition = {}, progress = {}) => {
  switch (condition.type) {
    case 'botWins':
      return {
        current: getBotWins(progress, condition.botId),
        target: asNumber(condition.count),
        label: 'wins vs required bot',
      };
    case 'practiceWins':
      return {
        current: asNumber(progress?.botProgress?.totalWins),
        target: asNumber(condition.count),
        label: 'total bot wins',
      };
    case 'difficultyWins':
      return {
        current: getDifficultyWins(progress, condition.difficulty),
        target: asNumber(condition.count),
        label: `${normalizeDifficulty(condition.difficulty)} wins`,
      };
    case 'puzzleAccuracy':
      return {
        current: asNumber(progress?.botProgress?.puzzleAccuracy),
        target: asNumber(condition.percent),
        label: 'puzzle accuracy',
      };
    case 'learningMilestone': {
      const hasMilestone = asArray(progress?.botProgress?.completedLearningMilestones).includes(condition.id);
      return {
        current: hasMilestone ? 1 : 0,
        target: 1,
        label: 'learning milestone',
      };
    }
    case 'default':
    default:
      return { current: 1, target: 1, label: 'available' };
  }
};

const isBotUnlockedByProgress = (bot, progress) => {
  if (bot?.isUnlocked || !bot?.unlockCondition || bot.unlockCondition.type === 'default') {
    return true;
  }

  const unlockProgress = getUnlockProgress(bot.unlockCondition, progress);
  return unlockProgress.target > 0 && unlockProgress.current >= unlockProgress.target;
};

const buildBotJourney = (botProfiles = [], progressInput = {}) => {
  const progress = normalizeBotJourneyProgress({ localProgress: progressInput });
  const bots = asArray(botProfiles).map((bot, index) => {
    const masteryTarget = getBotMasteryTarget(bot, botProfiles);
    const wins = getBotWins(progress, bot.id);
    const losses = getBotLosses(progress, bot.id);
    const isMastered = wins >= masteryTarget || asArray(progress.botProgress.masteredBots).includes(bot.id);
    const unlockProgress = getUnlockProgress(bot.unlockCondition || { type: 'default' }, progress);
    const isUnlocked = isBotUnlockedByProgress(bot, progress);

    return {
      ...bot,
      ladderIndex: index,
      wins,
      losses,
      record: `${wins}-${losses}`,
      isUnlocked,
      isMastered,
      masteryTarget,
      masteryProgress: {
        current: Math.min(wins, masteryTarget),
        target: masteryTarget,
        percent: masteryTarget > 0 ? Math.min(1, wins / masteryTarget) : 1,
      },
      unlockProgress: {
        ...unlockProgress,
        current: Math.min(unlockProgress.current, unlockProgress.target || unlockProgress.current),
        percent: unlockProgress.target > 0 ? Math.min(1, unlockProgress.current / unlockProgress.target) : 1,
      },
    };
  });

  const currentBot = bots.find((bot) => bot.isUnlocked && !bot.isMastered)
    || bots.find((bot) => bot.isUnlocked)
    || bots[0]
    || null;
  const nextLockedBot = bots.find((bot) => !bot.isUnlocked) || null;

  const masteredCount = bots.filter((bot) => bot.isMastered).length;

  return {
    bots,
    currentBot,
    nextLockedBot,
    aiRating: progress.aiRating,
    totalWins: progress.botProgress.totalWins,
    totalLosses: progress.botProgress.totalLosses,
    masteredCount,
    allMastered: masteredCount > 0 && masteredCount === bots.length,
  };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateAiRatingDelta = ({ userRating = DEFAULT_AI_RATING, botRating = DEFAULT_AI_RATING, won = false } = {}) => {
  const expected = 1 / (1 + (10 ** ((asNumber(botRating, DEFAULT_AI_RATING) - asNumber(userRating, DEFAULT_AI_RATING)) / 400)));
  const rawDelta = Math.round(32 * ((won ? 1 : 0) - expected));
  if (rawDelta === 0) return won ? 1 : -1;
  return clamp(rawDelta, -32, 32);
};

const getFinalChipsSignature = (finalChips = {}) => (
  Object.entries(asObject(finalChips))
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([id, chips]) => `${id}=${asNumber(chips)}`)
    .join('|') || 'no-stacks'
);

const getBotResultKey = (result = {}) => {
  const gameId = result.gameId || result.id || 'local';
  const botId = result.botId || result.bot?.id || 'bot';
  const winner = result.winner || result.outcome || (result.won ? 'hero' : 'bot') || 'unknown';
  const terminalKey = result.endedAt || result.timestamp || getFinalChipsSignature(result.finalChips);
  return `${gameId}:${botId}:${winner}:${terminalKey}`;
};

// `clock` (optional) → the ISO timestamp used when the result carries no
// endedAt/timestamp; defaults to wall-clock now. Injecting it makes the seed
// deterministic. This is the only change from the mobile original.
const createReviewSeed = (result, resultKey, ratingDelta, newAiRating, clock = () => new Date().toISOString()) => ({
  id: resultKey,
  gameId: result.gameId || result.id || null,
  mode: result.mode || 'bot_practice',
  botId: result.botId || result.bot?.id || null,
  botName: result.botName || result.bot?.name || 'Bot',
  outcome: result.won ? 'win' : 'loss',
  finalChips: asObject(result.finalChips),
  stats: asObject(result.stats),
  ratingDelta,
  newAiRating,
  handId: result.handId || result.currentHandId || null,
  actionIds: asArray(result.actionIds),
  timestamp: result.endedAt || result.timestamp || clock(),
});

// `clock` (optional) is threaded to createReviewSeed for deterministic seeds;
// omit it for the original wall-clock behavior.
const recordBotMatchResult = (progressInput = {}, resultInput = {}, clock = () => new Date().toISOString()) => {
  const progress = normalizeBotJourneyProgress({ localProgress: progressInput });
  const resultKey = resultInput.resultKey || getBotResultKey(resultInput);

  if (progress.processedResultKeys.includes(resultKey)) {
    return {
      ...progress,
      lastRecordIgnored: true,
    };
  }

  const botId = resultInput.botId || resultInput.bot?.id;
  if (!botId) {
    return {
      ...progress,
      lastRecordIgnored: true,
    };
  }

  const won = typeof resultInput.won === 'boolean'
    ? resultInput.won
    : resultInput.winner === resultInput.heroPlayerId || resultInput.outcome === 'win';
  const botDifficulty = normalizeDifficulty(resultInput.botDifficulty || resultInput.bot?.difficulty);
  const beforeWins = getBotWins(progress, botId);
  const beforeMasteredBots = asArray(progress.botProgress.masteredBots);
  const ratingDelta = asNumber(
    resultInput.ratingDelta,
    calculateAiRatingDelta({
      userRating: progress.aiRating,
      botRating: resultInput.botRating || resultInput.bot?.rating || DEFAULT_AI_RATING,
      won,
    })
  );
  const newAiRating = clamp(progress.aiRating + ratingDelta, 100, 3000);
  const botProfile = resultInput.bot || {
    id: botId,
    name: resultInput.botName || 'Bot',
    difficulty: botDifficulty,
    rating: resultInput.botRating,
  };
  const allBots = asArray(resultInput.allBots);
  const masteryTarget = getBotMasteryTarget(botProfile, allBots);

  const botProgress = {
    ...progress.botProgress,
    winsByBot: { ...progress.botProgress.winsByBot },
    lossesByBot: { ...progress.botProgress.lossesByBot },
    winsByDifficulty: { ...progress.botProgress.winsByDifficulty },
    lossesByDifficulty: { ...progress.botProgress.lossesByDifficulty },
    masteredBots: [...beforeMasteredBots],
    completedLearningMilestones: [...asArray(progress.botProgress.completedLearningMilestones)],
  };

  // BOT <-> CONCEPT: which concept-map node this opponent embodies (archetype-keyed). Used both to
  // award the milestone on a win and to flavor the post-game "Learn it" coach card below.
  const conceptNode = resolveConceptForBot(botProfile, resultInput.archetype);

  if (won) {
    botProgress.winsByBot[botId] = beforeWins + 1;
    botProgress.winsByDifficulty[botDifficulty] = asNumber(botProgress.winsByDifficulty[botDifficulty]) + 1;
    botProgress.totalWins = asNumber(botProgress.totalWins) + 1;
    // Bot missions COUNT toward node mastery: beating a themed bot marks its concept done in the
    // EXISTING completedLearningMilestones channel that learningMilestone unlocks already read.
    if (conceptNode?.id) {
      botProgress.completedLearningMilestones = unique([
        ...botProgress.completedLearningMilestones,
        conceptNode.id,
      ]);
    }
  } else {
    botProgress.lossesByBot[botId] = getBotLosses(progress, botId) + 1;
    botProgress.lossesByDifficulty[botDifficulty] = asNumber(botProgress.lossesByDifficulty[botDifficulty]) + 1;
    botProgress.totalLosses = asNumber(botProgress.totalLosses) + 1;
  }

  const afterWins = asNumber(botProgress.winsByBot[botId]);
  const justMastered = won && beforeWins < masteryTarget && afterWins >= masteryTarget;
  if (justMastered && !botProgress.masteredBots.includes(botId)) {
    botProgress.masteredBots.push(botId);
  }

  const normalizedAfter = {
    ...progress,
    botProgress,
    aiRating: newAiRating,
  };
  const newlyUnlockedBots = allBots.filter((bot) => {
    if (!bot || bot.id === botId || bot.isUnlocked) return false;
    const wasUnlocked = isBotUnlockedByProgress(bot, progress);
    const isUnlocked = isBotUnlockedByProgress(bot, normalizedAfter);
    return !wasUnlocked && isUnlocked;
  });

  // Win streak (consecutive wins, any bot) — resets on a loss.
  const winStreak = won ? asNumber(progress.winStreak) + 1 : 0;
  // Room cleared = every bot of this difficulty is now mastered.
  const tierBots = allBots.filter((b) => normalizeDifficulty(b?.difficulty) === botDifficulty);
  const roomCleared = justMastered && tierBots.length > 0
    && tierBots.every((b) => botProgress.masteredBots.includes(b.id));
  // Journey complete = every bot on the ladder is now mastered (the final-boss beat).
  const journeyComplete = justMastered && allBots.length > 0
    && allBots.every((b) => botProgress.masteredBots.includes(b.id));
  // First rating tier crossed by this result (for a one-shot "rank up" card).
  const ratingTierCrossed = RATING_TIERS.find((t) => progress.aiRating < t.at && newAiRating >= t.at) || null;

  // Milestone priority: finishing the whole journey is the biggest beat, then a full room clear,
  // then a fresh unlock, then mastery.
  const lastMilestone = journeyComplete
    ? {
        type: 'journey_complete',
        botName: resultInput.botName || botProfile.name,
        message: 'The Gauntlet is conquered — you mastered them all!',
      }
    : roomCleared
    ? {
        type: 'room_cleared',
        difficulty: botDifficulty,
        botName: resultInput.botName || botProfile.name,
        message: `${titleCase(botDifficulty)} room cleared!`,
      }
    : newlyUnlockedBots.length > 0
      ? {
          type: 'bot_unlocked',
          botId: newlyUnlockedBots[0].id,
          botName: newlyUnlockedBots[0].name,
          message: `${newlyUnlockedBots[0].name} unlocked`,
        }
      : justMastered
        ? {
            type: 'bot_mastered',
            botId,
            botName: resultInput.botName || botProfile.name,
            message: `${resultInput.botName || botProfile.name} mastered`,
          }
        : null;

  const lastResult = {
    ...resultInput,
    botId,
    botName: resultInput.botName || botProfile.name,
    botDifficulty,
    won,
    outcome: won ? 'win' : 'loss',
    resultKey,
    ratingDelta,
    previousAiRating: progress.aiRating,
    newAiRating,
    wins: asNumber(botProgress.winsByBot[botId]),
    losses: asNumber(botProgress.lossesByBot[botId]),
    masteryTarget,
    winStreak,
    ratingTierCrossed,
    archetype: resultInput.archetype || botProfile.archetype || null,
    // BOT <-> CONCEPT tie-in surfaced on the result so the post-game card can deep-link to the lesson.
    conceptNode: conceptNode || null,
    conceptLesson: buildConceptLessonLink(conceptNode),
    conceptMilestoneAwarded: !!(won && conceptNode?.id),
    milestone: lastMilestone,
  };
  const reviewSeed = createReviewSeed(lastResult, resultKey, ratingDelta, newAiRating, clock);

  return {
    ...normalizedAfter,
    winStreak,
    recentResults: [lastResult, ...progress.recentResults].slice(0, MAX_RECENT_RESULTS),
    lastMilestone,
    lastResult,
    reviewSeeds: [reviewSeed, ...progress.reviewSeeds].slice(0, MAX_REVIEW_SEEDS),
    processedResultKeys: [resultKey, ...progress.processedResultKeys].slice(0, MAX_PROCESSED_KEYS),
    lastRecordIgnored: false,
  };
};

const makeCoachCard = (title, body, icon = 'lightbulb-outline', tone = 'neutral') => ({
  title,
  body,
  icon,
  tone,
});

const buildPostGameCoachCards = ({ mode, result = {}, bot = null, progress = {}, stats = {} } = {}) => {
  const cards = [];
  const isBotMode = mode === 'bot_practice' || result.mode === 'bot_practice' || !!bot || !!result.botId;
  const isPuzzleMode = mode === 'puzzle' || mode === 'learning_puzzle' || result.type === 'puzzle';

  if (isPuzzleMode) {
    cards.push(makeCoachCard(
      result.isCorrect ? 'Good Read' : 'Review The Spot',
      result.isCorrect
        ? 'Your selected line matched the recommended decision.'
        : 'Compare your action with the optimal line before moving on.',
      result.isCorrect ? 'check-circle-outline' : 'cards-outline',
      result.isCorrect ? 'teal' : 'danger'
    ));
    if (Number.isFinite(Number(result.ratingDelta))) {
      const sign = result.ratingDelta >= 0 ? '+' : '';
      cards.push(makeCoachCard('Puzzle Rating', `${sign}${result.ratingDelta} rating from this attempt.`, 'chart-line', 'gold'));
    }
    cards.push(makeCoachCard(
      'Practice Next',
      result.nextRecommendation || result.category || 'Focus on the decision point that made this hand close.',
      'school-outline',
      'blue'
    ));
    return cards.slice(0, 3);
  }

  if (isBotMode) {
    const won = result.won || result.outcome === 'win';
    const botName = result.botName || bot?.name || 'the bot';
    const ratingDelta = asNumber(result.ratingDelta);
    const sign = ratingDelta >= 0 ? '+' : '';
    const archLabel = ARCHETYPE_LABEL[result.archetype || bot?.archetype];
    const archPhrase = archLabel ? ` (a ${archLabel})` : '';
    cards.push(makeCoachCard(
      won ? 'Win Logged' : 'Match Logged',
      `${won ? 'You beat' : 'You lost to'} ${botName}${archPhrase}. AI Rating ${sign}${ratingDelta} to ${result.newAiRating || progress.aiRating || DEFAULT_AI_RATING}.`,
      won ? 'trophy-outline' : 'chart-line',
      won ? 'gold' : 'danger'
    ));

    // Headline secondary card, highest-impact first.
    const streak = asNumber(result.winStreak);
    if (result.milestone?.type === 'room_cleared') {
      cards.push(makeCoachCard('Room Cleared!', 'You mastered every opponent here — the next area is open.', 'flag-checkered', 'gold'));
    } else if (result.milestone?.type === 'bot_unlocked') {
      cards.push(makeCoachCard('Unlocked', `${result.milestone.botName} is ready on the ladder.`, 'robot-excited-outline', 'teal'));
    } else if (won && streak >= 3) {
      cards.push(makeCoachCard(`${streak}-Win Streak`, `You're heating up — ${streak} in a row. Keep it going.`, 'fire', 'gold'));
    } else if (result.ratingTierCrossed) {
      cards.push(makeCoachCard('Rank Up', `You crossed ${result.ratingTierCrossed.at} AI Rating — ${result.ratingTierCrossed.name}.`, 'arrow-up-bold', 'teal'));
    } else if (result.milestone?.type === 'bot_mastered') {
      cards.push(makeCoachCard('Next Ladder Step', `${botName} mastery complete. Move to the next ladder node.`, 'medal-outline', 'gold'));
    } else if (Number.isFinite(Number(result.masteryTarget))) {
      cards.push(makeCoachCard(
        'Next Ladder Step',
        `${Math.min(result.wins || 0, result.masteryTarget)}/${result.masteryTarget} wins toward mastery.`,
        'map-marker-path',
        'blue'
      ));
    }

    // BOT <-> CONCEPT post-match nudge: prefer the matched concept node (carries a "Learn it"
    // deep-link); fall back to a leak-based note, then the bot's own learningTieIn copy.
    const conceptNode = result.conceptNode || resolveConceptForBot(bot || {}, result.archetype || bot?.archetype);
    const conceptLesson = result.conceptLesson || buildConceptLessonLink(conceptNode);
    const vpip = asNumber(stats.vpip);
    const pfr = asNumber(stats.pfr);
    let focus;
    if (vpip > 35 && pfr < 15) {
      focus = 'You are entering many pots but raising less often. Try attacking better starting hands before the flop.';
    } else if (conceptNode) {
      // "You faced a Maniac -> brush up: Bluffing."
      focus = archLabel
        ? `You faced ${archLabel === 'TAG' ? 'a TAG' : `a ${archLabel}`} — brush up: ${conceptNode.name}.`
        : `Brush up: ${conceptNode.name}.`;
    } else if (bot?.learningTieIn) {
      focus = `Focus area: ${bot.learningTieIn}.`;
    } else {
      focus = 'Review the biggest pot and ask what range your opponent was representing.';
    }
    const coachNote = makeCoachCard('Coach Note', focus, 'lightbulb-outline', 'violet');
    if (conceptLesson) {
      // Make the card "Learn it" tappable: a UI spreads card.lesson.pathname/params into router.push.
      coachNote.lesson = conceptLesson;
      coachNote.learnLabel = conceptLesson.learnLabel;
      coachNote.lessonTag = conceptLesson.lessonTag;
    }
    cards.push(coachNote);

    return cards.slice(0, 3);
  }

  cards.push(makeCoachCard('Review Ready', 'This result has been saved for future replay review.', 'clipboard-text-outline', 'neutral'));
  return cards;
};

module.exports = {
  DEFAULT_AI_RATING,
  MASTERY_TARGET_BY_DIFFICULTY,
  ARCHETYPE_LESSON_MAP,
  RATING_TIERS,
  buildBotJourney,
  buildConceptLessonLink,
  buildPostGameCoachCards,
  calculateAiRatingDelta,
  getBotMasteryTarget,
  getBotResultKey,
  normalizeBotJourneyProgress,
  recordBotMatchResult,
  resolveConceptForBot,
};
