/* eslint-disable import/extensions */
import { getPartnerUserState } from '../../scripts/utils.js';
import allCards from './data/allCards.json' with { type: 'json' };
import segmentPaths from './data/segmentPaths.json' with { type: 'json' };

export const MAX_VISIBLE_JOURNEY_CARDS = 9;
export const JOURNEY_CARD_DETAILS = allCards;
export const JOURNEY_PATHS = segmentPaths;
export function normalizeJourneyCardIds(value) {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Invalid journey card ids provided: ${value}`);
  }

  return [...new Set(value.map((cardId) => {
    if (typeof cardId !== 'number' || !Number.isInteger(cardId)) {
      throw new Error(`Journey card ids must be numbers. Received: ${cardId}`);
    }
    return cardId;
  }))];
}

export function getJourneyPathForSegment(segment, paths = JOURNEY_PATHS) {
  if (paths[segment]) return paths[segment];
  return null;
}

export function getCompletedJourneyCardIds(userState = getPartnerUserState()) {
  if (!userState) return [];

  const { completedCards } = userState || {};
  if (completedCards === undefined || completedCards === null) return [];
  if (!Array.isArray(completedCards)) {
    throw new Error('Invalid partner_user_state.completedCards: expected an array of numbers.');
  }

  return normalizeJourneyCardIds(completedCards);
}

export function getVisibleJourneyCards({
  segment,
  completedCardIds = getCompletedJourneyCardIds(),
  maxCards = MAX_VISIBLE_JOURNEY_CARDS,
  paths = JOURNEY_PATHS,
  cardDetails = JOURNEY_CARD_DETAILS,
} = {}) {
  const path = getJourneyPathForSegment(segment, paths);
  if (!path) return [];
  const normalizedCompletedCardIds = normalizeJourneyCardIds(completedCardIds);
  const completedSet = new Set(normalizedCompletedCardIds.map(String));
  const visibleCards = [];
  const completedFallbackCards = [];

  path.forEach((journeyCard) => {
    const detail = cardDetails[journeyCard.id];
    if (!detail) return;

    const conditionKey = journeyCard.condition !== null && journeyCard.condition !== undefined
      ? Number(journeyCard.condition)
      : null;
    const conditionMet = !journeyCard.condition || completedSet.has(String(conditionKey));
    const cardCompleted = completedSet.has(String(journeyCard.id));

    if (journeyCard.neverCompletes && cardCompleted) {
      detail.neverCompletesCard = true;
      completedFallbackCards.push(detail);
      return;
    }

    if (conditionMet && !cardCompleted) {
      visibleCards.push(detail);
    }
  });

  return [...visibleCards, ...completedFallbackCards].slice(0, maxCards);
}

export function buildCompletedJourneyCardState(
  cardId,
  completedCardIds,
  action,
) {
  const normalizedCardId = Number(cardId);
  if (!Number.isInteger(normalizedCardId)) {
    throw new Error(`Invalid journey card id provided: ${cardId}`);
  }

  const normalizedCompletedCards = normalizeJourneyCardIds(completedCardIds);
  const completedCardSet = new Set(normalizedCompletedCards);

  if (action === 'complete') {
    completedCardSet.add(normalizedCardId);
    return [...completedCardSet];
  }

  completedCardSet.delete(normalizedCardId);
  return [...completedCardSet];
}
