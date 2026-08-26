// Converted from ESM to CommonJS during extraction into poker-core (originally
// Poker.com/src/game/AIPlayer.js), then re-based on the server's HONEST evaluation
// internals (pokerServer/src/game/AIPlayer.js).
//
// poker-core uses this class as the shared INSIGHT ENGINE for Match Review and
// the in-game HUD (evaluateHandStrength / evaluateDrawingHands / hasFlushDraw /
// analyzeBoardTexture / countOvercards, plus evaluateHand exposed by callers).
//
// WHY THE EVALUATION WAS REWRITTEN. This engine's read is what the HUD quotes as
// "equity" and what Match Review grades the player's decisions against, while the
// opponent (the server bot) decides on the server's honest read. The two had
// drifted apart: here the post-flop switch assigned with Math.max against the
// accumulated PRE-FLOP heuristic and its high-card branch assigned nothing at
// all, so AK-high kept its ~0.85 pre-flop number on a 2-7-9 rainbow flop — total
// air read as 85% while a made pair of sevens read 0.60. Players were being
// graded on a scale where air outranked made hands. The evaluation internals
// below (madeHandStrength / onePairStrength / highCardStrength, the exact
// flush/straight out counting, and evaluateDrawingHands with board-subtraction
// and river-returns-0) are ported VERBATIM from pokerServer/src/game/AIPlayer.js
// so the two implementations cannot drift in meaning again — the differential
// test in test/honestRead.test.js compares them output-for-output.
//
// PRE-FLOP goes one step further than the server bot: it returns REAL equity vs
// a random hand from the generated table in ../data/preflopEquity.js (AA 0.8536,
// AKs 0.6719, 32o 0.3239). The server deliberately kept its crude pre-flop
// heuristic for the BOT because rewiring cost EV through its decision bands, but
// this is an insight engine — nothing here trades EV on the number, so display
// truth wins with no tradeoff.
//
// LEGACY DECISION CODE. makeDecision/decideAction and their helpers ride along
// unchanged, and their internal thresholds (0.85 all-in, 0.75 strong, 0.45
// medium, …) are LEGACY: they were tuned to the old inflated scale and are used
// in production by nothing except the server's dev-only match-simulator hero,
// which is deliberately a plain, middling player. Its behavior shifts with the
// new scale; that is accepted. Do not re-tune them here — real decision logic
// lives in the server's AIPlayer.

const { evaluateHand } = require('../eval/pokerEvaluator');
const { PREFLOP_EQUITY, canonicalKey } = require('../data/preflopEquity');

const RANK_ORDER = '23456789TJQKA';

// Same numbering as ../eval/pokerEvaluator.js HAND_RANKINGS and the server's
// PokerHand.HAND_RANKINGS (10 = royal flush … 1 = high card).
const HAND_RANKINGS = {
    ROYAL_FLUSH: 10,
    STRAIGHT_FLUSH: 9,
    FOUR_OF_A_KIND: 8,
    FULL_HOUSE: 7,
    FLUSH: 6,
    STRAIGHT: 5,
    THREE_OF_A_KIND: 4,
    TWO_PAIR: 3,
    ONE_PAIR: 2,
    HIGH_CARD: 1
};

// POST-FLOP DECISION BANDS, in the units evaluateHandStrength now reports post-flop.
// Ported VERBATIM from pokerServer/src/game/AIPlayer.js so consumers reading this
// scale (grading thresholds, HUD labels) share one written-down meaning with the
// opponent's decision gates. Post-flop the number is a read of the hand actually
// made: top pair is 0.50 and two pair is 0.66, so a threshold like 0.85 no longer
// means "a strong hand" — it means "a flush or better".
const POSTFLOP_BANDS = {
    continue: 0.30,   // call one bet: any pair, or a real draw
    medium:   0.30,
    value:    0.46,   // bet or raise for value: top pair and up
    strong:   0.60,   // two pair and up
    stackOff: 0.62,   // put the stack in
    slowplay: 0.76,   // trips and up is worth trapping with
    monster:  0.86,   // flush and up: size up rather than make a standard value bet
};

class AIPlayer {
    constructor(opts = {}) {
        // Optional injected rng (server pattern: config.rng || Math.random). The
        // only non-deterministic read in this file is shouldBluff.
        this.rng = (opts && opts.rng) || Math.random;
        this.handStrength = 0;
        this.potOdds = 0;
        this.impliedOdds = 0;
        this.position = '';
        this.phase = '';
        this.allInThreshold = 0.85; // Threshold for considering all-in moves
        this.bluffFrequency = 0.15; // 15% chance to bluff in good spots
        this.aggressionLevel = 0.7; // How aggressive the AI is (0-1)
        this.tightness = 0.6; // How tight the AI plays (0-1)
        this.opponentModel = {
            foldToRaise: 0.5,
            callFrequency: 0.4,
            raiseFrequency: 0.3,
            bluffFrequency: 0.2,
            aggressionFactor: 1.0,
            recentActions: [],
            showdownHands: []
        };
        this.gameHistory = {
            handsPlayed: 0,
            vpip: 0, // Voluntarily put money in pot
            pfr: 0, // Pre-flop raise
            aggression: 1.0
        };
    }

    // Main decision making function
    makeDecision(gameState, playerId) {
        const player = gameState.players.find(p => p.id === playerId);
        const opponent = gameState.players.find(p => p.id !== playerId);

        if (!player || !player.cards) return { action: 'fold' };

        this.phase = gameState.currentPhase;
        this.position = gameState.dealer === playerId ? 'dealer' : 'non-dealer';

        // Update opponent model and game history
        this.updateOpponentModel(opponent, gameState);
        this.updateGameHistory(gameState);

        // Calculate pot odds and implied odds
        const callAmount = gameState.currentBet - player.bet;
        const totalPot = gameState.pot + gameState.players.reduce((sum, p) => sum + p.bet, 0);
        this.potOdds = callAmount > 0 ? callAmount / (totalPot + callAmount) : 0;

        // Calculate stack-to-pot ratio for stack management
        const spr = totalPot > 0 ? player.chips / totalPot : Infinity;

        // Evaluate hand strength with advanced poker evaluation
        this.handStrength = this.evaluateHandStrength(player.cards, gameState.communityCards);

        // Calculate implied odds based on hand potential and opponent tendencies
        this.impliedOdds = this.calculateImpliedOdds(
            player.cards,
            gameState.communityCards,
            opponent.chips,
            this.opponentModel
        );

        // Get available actions
        const actions = this.getAvailableActions(gameState, player);

        // Make decision based on comprehensive game state analysis
        return this.decideAction(actions, gameState, player, opponent, spr);
    }

    updateOpponentModel(opponent, gameState) {
        if (!opponent.lastAction) return;

        // Track recent actions
        this.opponentModel.recentActions.push({
            action: opponent.lastAction,
            phase: gameState.currentPhase,
            betSize: opponent.bet,
            potSize: gameState.pot
        });

        if (this.opponentModel.recentActions.length > 20) {
            this.opponentModel.recentActions.shift();
        }

        // Update frequencies based on recent actions
        const recentActions = this.opponentModel.recentActions;
        const totalActions = recentActions.length;

        if (totalActions > 0) {
            const folds = recentActions.filter(a => a.action === 'fold').length;
            const calls = recentActions.filter(a => a.action === 'call').length;
            const raises = recentActions.filter(a => a.action === 'raise' || a.action === 'all-in').length;

            this.opponentModel.foldToRaise = folds / totalActions;
            this.opponentModel.callFrequency = calls / totalActions;
            this.opponentModel.raiseFrequency = raises / totalActions;

            // Calculate aggression factor (bets + raises) / (calls)
            const aggressiveActions = raises;
            const passiveActions = calls;
            this.opponentModel.aggressionFactor = passiveActions > 0 ?
                aggressiveActions / passiveActions : aggressiveActions;
        }
    }

    updateGameHistory(gameState) {
        // Track game statistics for adaptive play
        this.gameHistory.handsPlayed++;

        // Adjust playing style based on game flow
        if (this.gameHistory.handsPlayed > 10) {
            // Become more aggressive if opponent is too passive
            if (this.opponentModel.foldToRaise > 0.7) {
                this.aggressionLevel = Math.min(1.0, this.aggressionLevel + 0.1);
                this.bluffFrequency = Math.min(0.3, this.bluffFrequency + 0.05);
            }

            // Become more selective if opponent is very aggressive
            if (this.opponentModel.aggressionFactor > 2.0) {
                this.tightness = Math.min(0.9, this.tightness + 0.1);
                this.bluffFrequency = Math.max(0.05, this.bluffFrequency - 0.05);
            }
        }
    }

    // Absolute hand strength in 0..1.
    //
    // PRE-FLOP (board < 3): real equity vs a random hand, from the generated table.
    // POST-FLOP: a reading of the hand actually made plus honest draw value —
    // never blended with the pre-flop number. Both halves match the server's
    // scale; the post-flop half matches it to the last bit (see the header).
    evaluateHandStrength(holeCards, communityCards = []) {
        if (!holeCards || holeCards.length !== 2) return 0;

        if (!communityCards || communityCards.length < 3) {
            const equity = PREFLOP_EQUITY[canonicalKey(holeCards[0], holeCards[1], RANK_ORDER)];
            return typeof equity === 'number' ? equity : 0.5;
        }

        const allCards = [...holeCards, ...communityCards];
        const handEval = evaluateHand(allCards);
        if (!handEval) return 0;

        let strength = this.madeHandStrength(handEval, holeCards, communityCards);
        strength += this.evaluateDrawingHands(
            allCards, communityCards, 5 - communityCards.length).totalValue;

        return Math.min(Math.max(strength, 0), 1);
    }

    // Post-flop made-hand strength. Category sets the band; position WITHIN the band comes from how
    // the hole cards relate to the board, which is what separates top pair from a pair sitting on
    // the board that the opponent shares. (Verbatim from the server.)
    madeHandStrength(handEval, holeCards, communityCards) {
        const R = HAND_RANKINGS;
        const ri = (c) => RANK_ORDER.indexOf(c.rank);
        const hole = holeCards.map(ri);
        const board = communityCards.map(ri);
        const boardSorted = [...new Set(board)].sort((a, b) => b - a);
        const topBoard = boardSorted[0];
        const hi = Math.max(hole[0], hole[1]);
        const isPocket = hole[0] === hole[1];
        const holePairsBoard = hole.filter((h) => board.includes(h)).length;

        switch (handEval.rank) {
            case R.ROYAL_FLUSH:
            case R.STRAIGHT_FLUSH:
                return 0.99;
            case R.FOUR_OF_A_KIND:
                return 0.97;
            case R.FULL_HOUSE:
                return 0.93;
            case R.FLUSH:
                return 0.86 + (hi / 12) * 0.04;
            case R.STRAIGHT:
                return 0.80 + (hi / 12) * 0.04;
            case R.THREE_OF_A_KIND:
                // A set (pocket pair plus one on the board) is disguised and beats trips, where the
                // board shows the pair and the opponent may be holding the same card.
                return isPocket ? 0.78 : 0.72;
            case R.TWO_PAIR:
                if (holePairsBoard === 2) return 0.66;  // both hole cards paired, the real thing
                if (isPocket) return 0.62;              // pocket pair alongside a paired board
                if (holePairsBoard === 1) return 0.52;  // one pair mine, one shared with the board
                return 0.30;                            // both pairs on the board, playing a kicker
            case R.ONE_PAIR:
                return this.onePairStrength(hole, board, boardSorted, topBoard, isPocket);
            default:
                return this.highCardStrength(hole, topBoard);
        }
    }

    onePairStrength(hole, board, boardSorted, topBoard, isPocket) {
        if (isPocket) {
            const p = hole[0];
            if (p > topBoard) return 0.58;                                   // overpair
            if (boardSorted.length > 1 && p > boardSorted[1]) return 0.44;   // under the top card only
            return 0.36;                                                     // buried underpair
        }

        const paired = hole.filter((h) => board.includes(h));
        if (paired.length === 0) {
            // The pair is entirely on the board. Both players hold it, so this is really a
            // high-card hand and must not be priced like a pair.
            return 0.24 + (Math.max(hole[0], hole[1]) / 12) * 0.06;
        }

        const p = paired[0];
        const kicker = hole[0] === p ? hole[1] : hole[0];
        const kickerBonus = (kicker / 12) * 0.06;

        if (p === topBoard) return 0.50 + kickerBonus;
        if (boardSorted.length > 1 && p === boardSorted[1]) return 0.42 + kickerBonus * 0.5;
        return 0.34 + kickerBonus * 0.5;
    }

    highCardStrength(hole, topBoard) {
        const hi = Math.max(hole[0], hole[1]);
        const overcards = hole.filter((h) => h > topBoard).length;
        return 0.06 + (hi / 12) * 0.09 + overcards * 0.025;
    }

    // Draw equity, counted only when the draw actually belongs to this hand and there is still a
    // card to come. Previously any four-flush or near-run of ranks on the board was credited to the
    // bot even when it held none of the relevant cards, and draws were still being added on the
    // river where nothing can improve.
    //
    // The arithmetic is the server's, verbatim. The RETURN SHAPE is poker-core's
    // legacy object ({ totalValue, flushOuts, straightOuts, totalOuts }) because the
    // HUD and Match Review read the out counts off it; the server returns the bare
    // totalValue number. Legacy one-argument calls (cards = [hole0, hole1, ...board],
    // the same convention countOvercards uses) get the board and cards-to-come
    // inferred, so they too are board-subtracted and go dead on the river.
    evaluateDrawingHands(cards, boardCards = undefined, cardsToCome = undefined) {
        if (boardCards === undefined) boardCards = cards.length > 2 ? cards.slice(2) : [];
        if (cardsToCome === undefined) cardsToCome = Math.max(0, 5 - (boardCards ? boardCards.length : 0));

        if (cardsToCome <= 0) return { totalValue: 0, flushOuts: 0, straightOuts: 0, totalOuts: 0 };

        const mine = this.rawDrawOuts(cards);
        const board = boardCards ? this.rawDrawOuts(boardCards) : { flush: 0, straight: 0 };

        // Subtracting the outs the board already had is what makes this the bot's own draw. A draw
        // sitting on the board is available to whoever holds the right cards, which on any given
        // hand is just as likely to be the opponent.
        const flushOuts = Math.max(0, mine.flush - board.flush);
        const straightOuts = Math.max(0, mine.straight - board.straight);

        // Rule of 4 and 2, discounted: two cards to come is worth roughly 3.5% per out once you
        // account for the draws that get charged off before the river.
        const perOut = cardsToCome >= 2 ? 0.035 : 0.02;
        let value = (flushOuts + straightOuts) * perOut;
        if (flushOuts > 0 && straightOuts > 0) value += 0.08;

        return {
            totalValue: Math.min(value, 0.3),
            flushOuts,
            straightOuts,
            totalOuts: flushOuts + straightOuts
        };
    }

    rawDrawOuts(cards) {
        return { flush: this.flushOuts(cards), straight: this.straightOuts(cards) };
    }

    flushOuts(cards) {
        const counts = {};
        for (const card of cards) counts[card.suit] = (counts[card.suit] || 0) + 1;
        for (const suit of Object.keys(counts)) {
            if (counts[suit] >= 5) return 0;   // already made, not a draw
            if (counts[suit] === 4) return 9;
        }
        return 0;
    }

    // Exact: count the CARDS that would complete a straight. This yields 8 for an open-ender, 4 for
    // a gutshot and 8 for a double-gutshot without special-casing any of them. The old version
    // reported a gutshot whenever any THREE ranks spanned 3 or 4, which fires on hands needing two
    // more cards. 7-2 on a 4-8-J board was credited with a draw it does not have.
    straightOuts(cards) {
        const present = new Set(cards.map((c) => RANK_ORDER.indexOf(c.rank)));
        if (this.makesStraight(present)) return 0;   // already made

        let outs = 0;
        for (let x = 0; x < 13; x++) {
            if (present.has(x)) continue;
            const test = new Set(present);
            test.add(x);
            // Four cards of that rank are live: x is absent from the known cards by construction.
            if (this.makesStraight(test)) outs += 4;
        }
        return outs;
    }

    makesStraight(rankSet) {
        const s = new Set(rankSet);
        if (s.has(12)) s.add(-1);   // the ace plays low for the wheel
        for (let start = -1; start <= 8; start++) {
            let run = true;
            for (let k = 0; k < 5; k++) {
                if (!s.has(start + k)) { run = false; break; }
            }
            if (run) return true;
        }
        return false;
    }

    // Honest flush-draw read (only a genuine 4-card draw counts; a made flush is
    // not a draw) with the LEGACY return shape the HUD reads: { isFlushDraw, outs,
    // suit, type }. The 3-card "backdoor flush" the old engine reported as 10 outs
    // no longer exists.
    hasFlushDraw(cards) {
        const counts = {};
        for (const card of cards) counts[card.suit] = (counts[card.suit] || 0) + 1;
        for (const suit of Object.keys(counts)) {
            if (counts[suit] >= 5) return { isFlushDraw: false, outs: 0 };   // already made
            if (counts[suit] === 4) return { isFlushDraw: true, outs: 9, suit, type: 'flush-draw' };
        }
        return { isFlushDraw: false, outs: 0 };
    }

    // Honest straight-draw read on the exact out count, legacy shape preserved:
    // { isStraightDraw, outs, type }.
    hasStraightDraw(cards) {
        const outs = this.straightOuts(cards);
        return outs > 0
            ? { isStraightDraw: true, outs, type: outs >= 8 ? 'open-ended' : 'gutshot' }
            : { isStraightDraw: false, outs: 0 };
    }

    countOvercards(cards) {
        if (cards.length < 5) return 0;

        const holeCards = cards.slice(0, 2);
        const communityCards = cards.slice(2);
        const ranks = '23456789TJQKA';

        let overcards = 0;
        const maxCommunityRank = Math.max(...communityCards.map(c => ranks.indexOf(c.rank)));

        holeCards.forEach(card => {
            if (ranks.indexOf(card.rank) > maxCommunityRank) {
                overcards++;
            }
        });

        return overcards;
    }

    analyzeBoardTexture(communityCards) {
        if (!communityCards || communityCards.length < 3) {
            return {
                isDry: true,
                isWet: false,
                hasFlushDraw: false,
                hasStraightDraw: false,
                isPaired: false,
                isConnected: false
            };
        }

        const flushDraw = this.hasFlushDraw(communityCards);
        const straightDraw = this.hasStraightDraw(communityCards);

        // Check if board is paired
        const ranks = communityCards.map(c => c.rank);
        const isPaired = ranks.length !== new Set(ranks).size;

        // Check if board is connected
        const rankValues = ranks.map(r => '23456789TJQKA'.indexOf(r)).sort((a, b) => a - b);
        const isConnected = rankValues.some((val, i) =>
            i < rankValues.length - 1 && Math.abs(val - rankValues[i + 1]) <= 2
        );

        const isWet = flushDraw.isFlushDraw || straightDraw.isStraightDraw || isConnected;

        return {
            isDry: !isWet,
            isWet: isWet,
            hasFlushDraw: flushDraw.isFlushDraw,
            hasStraightDraw: straightDraw.isStraightDraw,
            isPaired: isPaired,
            isConnected: isConnected,
            texture: isWet ? (isPaired ? 'wet-paired' : 'wet') : (isPaired ? 'dry-paired' : 'dry')
        };
    }

    // LEGACY: no longer called by evaluateHandStrength (the honest read does not
    // re-adjust made-hand bands for texture). Kept because it is part of the class
    // surface the decision code was written against.
    adjustForBoardTexture(strength, boardTexture, holeCards) {
        // Adjust hand strength based on how it interacts with board texture
        let adjustment = 0;

        // On very wet boards, be more cautious with marginal hands
        if (boardTexture.isWet && strength < 0.7) {
            adjustment -= 0.1;
        }

        // On paired boards, be more cautious unless we have trips or better
        if (boardTexture.isPaired && strength < 0.8) {
            adjustment -= 0.05;
        }

        // Pocket pairs play better on dry boards
        if (holeCards[0].rank === holeCards[1].rank && boardTexture.isDry) {
            adjustment += 0.05;
        }

        return Math.max(0, strength + adjustment);
    }

    calculateImpliedOdds(holeCards, communityCards, opponentChips, opponentModel) {
        if (!communityCards || communityCards.length < 3) return 0;

        const drawingPotential = this.evaluateDrawingHands(
            [...holeCards, ...communityCards], communityCards, 5 - communityCards.length);

        if (drawingPotential.totalOuts === 0) return 0;

        // Estimate how much we can win if we hit our draw
        const opponentCallProbability = (opponentModel && opponentModel.callFrequency) || 0.4;
        const maxExtraction = Math.min(opponentChips * 0.6, 300); // Conservative estimate
        const expectedWinnings = maxExtraction * opponentCallProbability;

        // Calculate implied odds based on outs and potential winnings
        const hitProbability = drawingPotential.totalOuts * 0.021; // Rough approximation

        return hitProbability * (expectedWinnings / 100); // Normalize
    }

    getAvailableActions(gameState, player) {
        const actions = {
            canCheck: false,
            canCall: false,
            canRaise: false,
            canFold: false,
            minRaise: 0,
            maxRaise: 0
        };

        const callAmount = gameState.currentBet - player.bet;

        actions.canCheck = callAmount === 0;
        actions.canCall = player.chips >= callAmount && callAmount > 0;
        actions.canFold = callAmount > 0;

        if (player.chips > callAmount) {
            const minRaise = Math.max(gameState.lastRaiseAmount || gameState.blinds.big, gameState.blinds.big);
            actions.canRaise = player.chips >= (callAmount + minRaise);
            actions.minRaise = gameState.currentBet + minRaise;
            actions.maxRaise = player.chips + player.bet;
        }

        return actions;
    }

    decideAction(actions, gameState, player, opponent, stackToPotRatio) {
        // Calculate key metrics for decision making
        const effectiveStack = Math.min(player.chips, opponent.chips);
        const totalPot = gameState.pot + gameState.players.reduce((sum, p) => sum + p.bet, 0);
        const isShortStacked = stackToPotRatio < 6;
        const isDeepStacked = stackToPotRatio > 25;
        const isPremiumHand = this.handStrength > this.allInThreshold;
        const isStrongHand = this.handStrength > 0.75;
        const isMediumHand = this.handStrength > 0.45 && this.handStrength <= 0.75;
        const isWeakHand = this.handStrength <= 0.45;

        // Analyze board and position
        const boardTexture = this.analyzeBoardTexture(gameState.communityCards);
        const bluffSpot = this.isGoodBluffSpot(gameState, boardTexture);

        // Phase-specific and position adjustments
        const phaseMultiplier = this.getPhaseMultiplier(gameState.currentPhase);
        const positionAdjustment = this.getPositionAdjustment();
        const finalHandStrength = Math.min(
            this.handStrength * phaseMultiplier + positionAdjustment,
            1.0
        );

        // Stack management - all-in with premium hands when short
        if (isShortStacked && isPremiumHand) {
            if (actions.canRaise) {
                return { action: 'raise', amount: actions.maxRaise };
            }
            if (actions.canCall) return { action: 'call' };
        }

        // Very strong hands - maximize value
        if (finalHandStrength > 0.85) {
            if (actions.canRaise) {
                let raiseSize = this.calculateValueBetSize(gameState, finalHandStrength, isShortStacked);
                return { action: 'raise', amount: Math.max(raiseSize, actions.minRaise) };
            }
            if (actions.canCall) return { action: 'call' };
            if (actions.canCheck) return { action: 'check' };
        }

        // Strong hands - bet for value, consider opponent tendencies
        if (finalHandStrength > 0.7) {
            if (this.shouldValueBet(gameState, finalHandStrength)) {
                const raiseSize = this.calculateValueBetSize(gameState, finalHandStrength, false);
                return { action: 'raise', amount: raiseSize };
            }
            if (actions.canCall) return { action: 'call' };
            if (actions.canCheck) return { action: 'check' };
        }

        // Medium hands - pot control and cautious play
        if (isMediumHand) {
            return this.handleMediumHand(actions, gameState, finalHandStrength);
        }

        // Bluffing opportunities
        if (bluffSpot && this.shouldBluff(gameState, boardTexture)) {
            const bluffSize = this.calculateBluffSize(gameState);
            if (actions.canRaise && bluffSize >= actions.minRaise) {
                return { action: 'raise', amount: bluffSize };
            }
        }

        // Drawing hands - check pot odds and implied odds
        if (this.impliedOdds > 0) {
            const totalOdds = this.potOdds + this.impliedOdds;
            if (totalOdds > 0.25 && actions.canCall) {
                return { action: 'call' };
            }
        }

        // Weak hands - fold or check
        if (isWeakHand) {
            if (actions.canCheck) return { action: 'check' };
            return { action: 'fold' };
        }

        // Default conservative action
        if (actions.canCheck) return { action: 'check' };
        if (actions.canCall && this.potOdds < finalHandStrength * 0.8) {
            return { action: 'call' };
        }

        return { action: 'fold' };
    }

    getPhaseMultiplier(phase) {
        // Adjust hand strength based on game phase
        switch (phase) {
            case 'preflop': return 1.0;
            case 'flop': return 0.95;
            case 'turn': return 0.9;
            case 'river': return 0.85;
            default: return 1.0;
        }
    }

    getPositionAdjustment() {
        // Being in position (dealer) is an advantage
        const baseAdjustment = this.position === 'dealer' ? 0.08 : -0.03;

        // Adjust based on phase - position matters more post-flop
        const phaseMultiplier = this.phase === 'preflop' ? 0.5 : 1.0;

        return baseAdjustment * phaseMultiplier;
    }

    calculateValueBetSize(gameState, handStrength, isShortStacked) {
        const totalPot = gameState.pot + gameState.players.reduce((sum, p) => sum + p.bet, 0);

        if (isShortStacked) {
            return gameState.players.find(p => p.id !== gameState.currentTurn).chips;
        }

        // Size bet based on hand strength and opponent tendencies
        let sizingMultiplier;
        if (handStrength > 0.95) {
            sizingMultiplier = 1.2; // Large bet with monsters
        } else if (handStrength > 0.85) {
            sizingMultiplier = 0.8; // Standard value bet
        } else {
            sizingMultiplier = 0.6; // Smaller bet with marginal value hands
        }

        // Adjust for opponent calling frequency
        if (this.opponentModel.callFrequency > 0.6) {
            sizingMultiplier *= 1.2; // Bet larger against calling stations
        }

        return Math.min(totalPot * sizingMultiplier, gameState.players.find(p => p.id === gameState.currentTurn).chips);
    }

    shouldValueBet(gameState, handStrength) {
        // Decision logic for when to bet for value
        if (handStrength < 0.65) return false;

        // Bet more frequently against loose opponents
        if (this.opponentModel.callFrequency > 0.5) return true;

        // Consider position and board texture
        const inPosition = this.position === 'dealer';
        const boardTexture = this.analyzeBoardTexture(gameState.communityCards);

        return inPosition || boardTexture.isDry;
    }

    handleMediumHand(actions, gameState, handStrength) {
        const bigBet = gameState.currentBet > gameState.blinds.big * 3;

        // Be cautious facing large bets
        if (bigBet) {
            if (this.potOdds < handStrength * 0.7 && actions.canCall) {
                return { action: 'call' };
            }
            if (actions.canCheck) return { action: 'check' };
            return { action: 'fold' };
        }

        // Standard pot control
        if (actions.canCheck) return { action: 'check' };
        if (actions.canCall && this.potOdds < handStrength) {
            return { action: 'call' };
        }

        return { action: 'fold' };
    }

    shouldBluff(gameState, boardTexture) {
        // Enhanced bluffing logic
        const randomFactor = (this.rng ?? Math.random)() < this.bluffFrequency * this.aggressionLevel;
        const goodSpot = this.isGoodBluffSpot(gameState, boardTexture);
        const opponentWeakness = this.opponentModel.foldToRaise > 0.4;

        return randomFactor && goodSpot && opponentWeakness;
    }

    calculateBluffSize(gameState) {
        const totalPot = gameState.pot + gameState.players.reduce((sum, p) => sum + p.bet, 0);

        // Bluff sizing based on board texture and opponent tendencies
        let sizingMultiplier = 0.6; // Standard bluff size

        // Larger bluffs on scary boards
        const boardTexture = this.analyzeBoardTexture(gameState.communityCards);
        if (boardTexture.isWet) {
            sizingMultiplier = 0.8;
        }

        // Adjust for opponent fold frequency
        if (this.opponentModel.foldToRaise > 0.6) {
            sizingMultiplier = 0.5; // Smaller bluffs against tight opponents
        }

        return totalPot * sizingMultiplier;
    }

    isGoodBluffSpot(gameState, boardTexture) {
        // Comprehensive bluff spot analysis
        const inPosition = this.position === 'dealer';
        const dryBoard = boardTexture.isDry;
        const facingWeakness = gameState.currentBet === 0 || gameState.currentBet <= gameState.blinds.big;
        const lateStreet = gameState.currentPhase === 'turn' || gameState.currentPhase === 'river';

        // Good bluff spots: position + (dry board OR opponent weakness) + late street
        return inPosition &&
               (dryBoard || facingWeakness) &&
               this.opponentModel.foldToRaise > 0.3 &&
               (lateStreet || this.phase === 'flop');
    }
}

// The written-down meaning of the post-flop scale (see comment above the constant).
AIPlayer.POSTFLOP_BANDS = POSTFLOP_BANDS;

module.exports = AIPlayer;
