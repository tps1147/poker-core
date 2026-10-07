'use strict';

const asId = (id) => (typeof id === 'string' || typeof id === 'number') && String(id).length
  ? String(id) : null;
function playerIds(player) {
  return [player?.id, player?._id, player?.playerId, player?.userId, player?.socketId,
    player?.user?.id, player?.user?._id].map(asId).filter(Boolean);
}

/** Occupied seats and explicit aliases only. Unknown or ambiguous senders never fall back. */
function resolveSeatKey(senderId, seats) {
  const id = asId(senderId);
  if (!id || !Array.isArray(seats)) return null;
  const matches = seats.filter((seat) => seat?.key && [seat.id, ...(seat.aliases || [])]
    .map(asId).includes(id));
  const keys = [...new Set(matches.map((seat) => seat.key))];
  return keys.length === 1 ? keys[0] : null;
}

function buildSocialContext({ gameId, players = [], seats, heroPlayerId, heroUserId,
  socketId, communication = {}, blockedSenderIds = [] } = {}) {
  players = Array.isArray(players) ? players : Object.values(players || {});
  let occupied = seats;
  if (!Array.isArray(occupied)) {
    const heroAliases = [heroPlayerId, heroUserId, socketId].map(asId).filter(Boolean);
    const heroMatches = players.filter((player) => player && playerIds(player).some((id) => heroAliases.includes(id)));
    const hero = heroMatches.length === 1 ? heroMatches[0] : null;
    const others = players.filter((player) => player !== hero);
    occupied = players.filter(Boolean).map((player) => {
      const ids = playerIds(player);
      const key = player === hero ? 'hero' : others.length === 1 ? 'opponent' : `seat:${ids[0] || ''}`;
      return { key, id: ids[0], aliases: [...ids, ...(player === hero ? heroAliases : [])],
        isBot: player.isAI === true || player.isBot === true || player.type === 'ai'
          || (ids[0] || '').startsWith('ai_') };
    }).filter((seat) => seat.id);
  }
  return { gameId: asId(gameId), seats: occupied.map((seat) => ({ ...seat,
    id: asId(seat.id), aliases: (seat.aliases || []).map(asId).filter(Boolean) })),
  enabled: { chat: communication?.chatEnabled !== false,
    reactions: communication?.emojiReactions !== false },
  blockedSenderIds: Array.from(blockedSenderIds || []).map(asId).filter(Boolean) };
}

module.exports = { buildSocialContext, resolveSeatKey };
