// Converted from ESM to CommonJS during extraction into poker-core (originally
// Poker.com/src/game/AIPlayer.js). Only the module boundaries changed: the
// `import { evaluateHand }` became a require, and `export default AIPlayer`
// became `module.exports = AIPlayer`. The engine body is untouched.
//
// poker-core uses this class as the shared INSIGHT ENGINE for Match Review and
// the in-game HUD (evaluateHandStrength / evaluateDrawingHands / hasFlushDraw /
// analyzeBoardTexture / countOvercards, plus evaluateHand exposed by callers).
// The decision code (makeDecision/decideAction/…) rides along unchanged.

const { evaluateHand } = require('../eval/pokerEvaluator');

class AIPlayer {
    constructor() {
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

    evaluateHandStrength(holeCards, communityCards = []) {
        if (!holeCards || holeCards.length !== 2) return 0;

        const [card1, card2] = holeCards;
        const ranks = '23456789TJQKA';

        let strength = 0;
        let handType = 'high-card';

        // Pre-flop hand strength evaluation with advanced ranges
        if (card1.rank === card2.rank) { // Pocket pair
            const rankIndex = ranks.indexOf(card1.rank);
            strength = 0.5 + (rankIndex / ranks.length) * 0.4;
            handType = 'pocket-pair';

            // Premium pairs get significant extra weight
            if (rankIndex >= ranks.indexOf('J')) {
                strength += 0.2;
                handType = 'premium-pair';
            } else if (rankIndex >= ranks.indexOf('T')) {
                strength += 0.15;
                handType = 'medium-pair';
            } else if (rankIndex >= ranks.indexOf('7')) {
                strength += 0.1;
                handType = 'small-pair';
            }
        } else {
            const rank1 = ranks.indexOf(card1.rank);
            const rank2 = ranks.indexOf(card2.rank);
            const isSuited = card1.suit === card2.suit;
            const gap = Math.abs(rank1 - rank2);

            // Base strength from card ranks
            strength = (rank1 + rank2) / (2 * ranks.length);

            // Suited cards bonus - larger bonus for suited connectors
            if (isSuited) {
                strength += gap <= 1 ? 0.15 : 0.1;
                handType = 'suited';
            }

            // Connected cards bonus
            if (gap === 1) {
                strength += 0.12;
                handType = isSuited ? 'suited-connector' : 'connector';
            } else if (gap === 2) {
                strength += 0.08; // One-gapper bonus
            } else if (gap === 3) {
                strength += 0.04; // Two-gapper bonus
            }

            // Broadway cards (T,J,Q,K,A) significant bonus
            if (rank1 >= ranks.indexOf('T') && rank2 >= ranks.indexOf('T')) {
                strength += 0.18;
                handType = 'broadway';
            }

            // Big Ace bonus
            if ((rank1 === ranks.indexOf('A') && rank2 >= ranks.indexOf('T')) ||
                (rank2 === ranks.indexOf('A') && rank1 >= ranks.indexOf('T'))) {
                strength += 0.12;
                handType = 'big-ace';
            }

            // High cards bonus
            if (rank1 >= ranks.indexOf('J') || rank2 >= ranks.indexOf('J')) {
                strength += 0.08;
            }
        }

        // Post-flop evaluation with community cards
        if (communityCards && communityCards.length >= 3) {
            const allCards = [...holeCards, ...communityCards];
            const handRank = evaluateHand(allCards);

            if (handRank) {
                // Adjust strength based on made hands using proper hand rankings
                switch (handRank.rank) {
                    case 10: // Royal Flush
                    case 9:  // Straight Flush
                        strength = 0.99;
                        break;
                    case 8: // Four of a Kind
                        strength = 0.95;
                        break;
                    case 7: // Full House
                        strength = 0.90;
                        break;
                    case 6: // Flush
                        strength = Math.max(strength, 0.80);
                        break;
                    case 5: // Straight
                        strength = Math.max(strength, 0.75);
                        break;
                    case 4: // Three of a Kind
                        strength = Math.max(strength, 0.70);
                        break;
                    case 3: // Two Pair
                        strength = Math.max(strength, 0.60);
                        break;
                    case 2: // One Pair
                        strength = Math.max(strength, 0.45);
                        break;
                    default: // High Card
                        // Use pre-flop strength adjusted for board texture
                        strength *= 0.7;
                        break;
                }
            }

            // Add drawing potential
            const drawingPotential = this.evaluateDrawingHands(allCards);
            strength += drawingPotential.totalValue;

            // Board texture adjustments
            const boardTexture = this.analyzeBoardTexture(communityCards);
            strength = this.adjustForBoardTexture(strength, boardTexture, holeCards);
        }

        return Math.min(Math.max(strength, 0), 1);
    }

    evaluateDrawingHands(cards) {
        let drawValue = 0;
        let flushOuts = 0;
        let straightOuts = 0;

        // Flush draw evaluation
        const flushDraw = this.hasFlushDraw(cards);
        if (flushDraw.isFlushDraw) {
            flushOuts = flushDraw.outs;
            drawValue += flushOuts * 0.021; // ~2.1% per out
        }

        // Straight draw evaluation
        const straightDraw = this.hasStraightDraw(cards);
        if (straightDraw.isStraightDraw) {
            straightOuts = straightDraw.outs;
            drawValue += straightOuts * 0.021;
        }

        // Combo draws are very strong
        if (flushDraw.isFlushDraw && straightDraw.isStraightDraw) {
            drawValue += 0.15; // Significant bonus for combo draws
        }

        // Overcards potential
        const overcards = this.countOvercards(cards);
        if (overcards > 0) {
            drawValue += overcards * 0.025; // Small bonus for overcards
        }

        return {
            totalValue: Math.min(drawValue, 0.35), // Cap draw value
            flushOuts,
            straightOuts,
            totalOuts: flushOuts + straightOuts
        };
    }

    hasFlushDraw(cards) {
        const suitCounts = cards.reduce((acc, card) => {
            acc[card.suit] = (acc[card.suit] || 0) + 1;
            return acc;
        }, {});

        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count === 4) {
                return { isFlushDraw: true, outs: 9, suit, type: 'flush-draw' };
            }
            if (count === 3) {
                return { isFlushDraw: true, outs: 10, suit, type: 'backdoor-flush' };
            }
        }

        return { isFlushDraw: false, outs: 0 };
    }

    hasStraightDraw(cards) {
        const ranks = '23456789TJQKA';
        const uniqueRanks = [...new Set(cards.map(card => ranks.indexOf(card.rank)))].sort((a, b) => a - b);

        // Check for open-ended straight draws
        for (let i = 0; i < uniqueRanks.length - 3; i++) {
            const span = uniqueRanks[i + 3] - uniqueRanks[i];
            if (span === 3) { // Four cards in a row, missing one end
                return { isStraightDraw: true, outs: 8, type: 'open-ended' };
            }
        }

        // Check for gutshot draws
        for (let i = 0; i < uniqueRanks.length - 2; i++) {
            const span = uniqueRanks[i + 2] - uniqueRanks[i];
            if (span === 3 || span === 4) { // Potential gutshot
                return { isStraightDraw: true, outs: 4, type: 'gutshot' };
            }
        }

        // Check for double gutshot (similar to open-ended)
        if (uniqueRanks.length >= 4) {
            const gaps = [];
            for (let i = 0; i < uniqueRanks.length - 1; i++) {
                gaps.push(uniqueRanks[i + 1] - uniqueRanks[i]);
            }

            // Look for patterns like 1,2,1 or 2,1,1 which create double gutshots
            if (gaps.filter(g => g === 1).length >= 2 && gaps.filter(g => g === 2).length >= 1) {
                return { isStraightDraw: true, outs: 8, type: 'double-gutshot' };
            }
        }

        return { isStraightDraw: false, outs: 0 };
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

        const drawingPotential = this.evaluateDrawingHands([...holeCards, ...communityCards]);

        if (drawingPotential.totalOuts === 0) return 0;

        // Estimate how much we can win if we hit our draw
        const opponentCallProbability = opponentModel.callFrequency || 0.4;
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
        const randomFactor = Math.random() < this.bluffFrequency * this.aggressionLevel;
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

module.exports = AIPlayer;
