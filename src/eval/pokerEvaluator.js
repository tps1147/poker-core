// Converted from ESM to CommonJS during extraction into poker-core
// (originally Poker.com/src/utils/pokerEvaluator.js). Only the two `export
// function` keywords were changed to plain `function` and a module.exports
// added at the end — the evaluation logic is byte-for-byte identical.

const RANKS = '23456789TJQKA';
const SUITS = '♠♥♦♣';

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

function evaluateHand(cards) {
    if (!cards || cards.length < 5) return null;

    // Sort cards by rank for easier evaluation
    const sortedCards = [...cards].sort((a, b) =>
        RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank)
    );

    // Check each hand type in descending order
    if (hasRoyalFlush(sortedCards)) {
        return { rank: HAND_RANKINGS.ROYAL_FLUSH, name: 'Royal Flush' };
    }

    const straightFlush = hasStraightFlush(sortedCards);
    if (straightFlush) {
        return { rank: HAND_RANKINGS.STRAIGHT_FLUSH, name: 'Straight Flush', highCard: straightFlush };
    }

    const fourOfAKind = hasFourOfAKind(sortedCards);
    if (fourOfAKind) {
        return { rank: HAND_RANKINGS.FOUR_OF_A_KIND, name: 'Four of a Kind', value: fourOfAKind };
    }

    const fullHouse = hasFullHouse(sortedCards);
    if (fullHouse) {
        return { rank: HAND_RANKINGS.FULL_HOUSE, name: 'Full House', value: fullHouse };
    }

    const flush = hasFlush(sortedCards);
    if (flush) {
        return { rank: HAND_RANKINGS.FLUSH, name: 'Flush', cards: flush };
    }

    const straight = hasStraight(sortedCards);
    if (straight) {
        return { rank: HAND_RANKINGS.STRAIGHT, name: 'Straight', highCard: straight };
    }

    const threeOfAKind = hasThreeOfAKind(sortedCards);
    if (threeOfAKind) {
        return { rank: HAND_RANKINGS.THREE_OF_A_KIND, name: 'Three of a Kind', value: threeOfAKind };
    }

    const twoPair = hasTwoPair(sortedCards);
    if (twoPair) {
        return { rank: HAND_RANKINGS.TWO_PAIR, name: 'Two Pair', values: twoPair };
    }

    const pair = hasOnePair(sortedCards);
    if (pair) {
        return { rank: HAND_RANKINGS.ONE_PAIR, name: 'One Pair', value: pair };
    }

    return {
        rank: HAND_RANKINGS.HIGH_CARD,
        name: 'High Card',
        value: RANKS.indexOf(sortedCards[0].rank)
    };
}

function hasRoyalFlush(cards) {
    const flush = hasFlush(cards);
    if (!flush) return false;

    const ranks = flush.map(card => card.rank).join('');
    return ranks.includes('TJQKA');
}

function hasStraightFlush(cards) {
    const flush = hasFlush(cards);
    if (!flush) return false;

    const straight = hasStraight(flush);
    return straight;
}

function hasFourOfAKind(cards) {
    for (let i = 0; i <= cards.length - 4; i++) {
        const rank = cards[i].rank;
        if (cards.slice(i, i + 4).every(card => card.rank === rank)) {
            return RANKS.indexOf(rank);
        }
    }
    return false;
}

function hasFullHouse(cards) {
    const three = hasThreeOfAKind(cards);
    if (!three) return false;

    const remainingCards = cards.filter(card => RANKS.indexOf(card.rank) !== three);
    const pair = hasOnePair(remainingCards);

    if (pair) {
        return { three, pair };
    }
    return false;
}

function hasFlush(cards) {
    for (let suit of SUITS) {
        const flushCards = cards.filter(card => card.suit === suit);
        if (flushCards.length >= 5) {
            return flushCards.slice(0, 5);
        }
    }
    return false;
}

function hasStraight(cards) {
    const ranks = [...new Set(cards.map(card => RANKS.indexOf(card.rank)))].sort((a, b) => b - a);

    // Check for Ace-low straight
    if (ranks.includes(12)) { // If we have an Ace
        const lowStraight = [12, 0, 1, 2, 3];
        if (lowStraight.every(rank => ranks.includes(rank))) {
            return 3; // Return the high card (5 in this case)
        }
    }

    // Check for regular straights
    for (let i = 0; i < ranks.length - 4; i++) {
        if (ranks[i] - ranks[i + 4] === 4) {
            return ranks[i];
        }
    }
    return false;
}

function hasThreeOfAKind(cards) {
    for (let i = 0; i <= cards.length - 3; i++) {
        const rank = cards[i].rank;
        if (cards.slice(i, i + 3).every(card => card.rank === rank)) {
            return RANKS.indexOf(rank);
        }
    }
    return false;
}

function hasTwoPair(cards) {
    const pairs = [];
    let i = 0;

    while (i < cards.length - 1 && pairs.length < 2) {
        if (cards[i].rank === cards[i + 1].rank) {
            pairs.push(RANKS.indexOf(cards[i].rank));
            i += 2;
        } else {
            i++;
        }
    }

    return pairs.length === 2 ? pairs : false;
}

function hasOnePair(cards) {
    for (let i = 0; i < cards.length - 1; i++) {
        if (cards[i].rank === cards[i + 1].rank) {
            return RANKS.indexOf(cards[i].rank);
        }
    }
    return false;
}

function compareHands(hand1, hand2) {
    if (hand1.rank !== hand2.rank) {
        return hand1.rank - hand2.rank;
    }

    // Compare hands of the same rank
    switch (hand1.rank) {
        case HAND_RANKINGS.ROYAL_FLUSH:
            return 0; // All royal flushes are equal

        case HAND_RANKINGS.STRAIGHT_FLUSH:
        case HAND_RANKINGS.STRAIGHT:
            return hand1.highCard - hand2.highCard;

        case HAND_RANKINGS.FOUR_OF_A_KIND:
        case HAND_RANKINGS.THREE_OF_A_KIND:
        case HAND_RANKINGS.ONE_PAIR:
            return hand1.value - hand2.value;

        case HAND_RANKINGS.FULL_HOUSE:
            if (hand1.value.three !== hand2.value.three) {
                return hand1.value.three - hand2.value.three;
            }
            return hand1.value.pair - hand2.value.pair;

        case HAND_RANKINGS.FLUSH:
            // Compare each card in the flush
            for (let i = 0; i < 5; i++) {
                const rank1 = RANKS.indexOf(hand1.cards[i].rank);
                const rank2 = RANKS.indexOf(hand2.cards[i].rank);
                if (rank1 !== rank2) return rank1 - rank2;
            }
            return 0;

        case HAND_RANKINGS.TWO_PAIR:
            // Compare higher pair first
            if (hand1.values[0] !== hand2.values[0]) {
                return hand1.values[0] - hand2.values[0];
            }
            // Then compare lower pair
            return hand1.values[1] - hand2.values[1];

        case HAND_RANKINGS.HIGH_CARD:
            return hand1.value - hand2.value;

        default:
            return 0;
    }
}

module.exports = { evaluateHand, compareHands };
