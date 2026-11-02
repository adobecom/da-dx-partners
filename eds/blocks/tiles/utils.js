/* eslint-disable import/extensions */
import { getPartnerUserState } from '../../scripts/utils.js';
import allCards from './data/allCards.json' with { type: 'json' };
import segmentPaths from './data/segmentPaths.json' with { type: 'json' };

export const MAX_VISIBLE_JOURNEY_CARDS = 9;
export const JOURNEY_CARD_DETAILS = allCards;
export const JOURNEY_PATHS = segmentPaths;
// todo evalueate if this is needed since we
//  dont expect duplicates and we dont expect nothing than array
export function normalizeJourneyCardIds(value) {
  if (!value) return [];
  const cardIds = Array.isArray(value) ? value : [value];

  return [...new Set(cardIds
    .flatMap((cardId) => (Array.isArray(cardId) ? cardId : [cardId]))
    .map((cardId) => {
      if (cardId === null || cardId === undefined) return null;
      if (typeof cardId === 'number') return Number.isFinite(cardId) ? cardId : null;
      if (typeof cardId === 'string') {
        const trimmed = cardId.trim();
        if (!trimmed) return null;
        const numericValue = Number(trimmed);
        return Number.isFinite(numericValue) ? numericValue : null;
      }
      const numericValue = Number(cardId);
      return Number.isFinite(numericValue) ? numericValue : null;
    })
    .filter((cardId) => cardId !== null))];
}

export function getJourneyPathForSegment(segment, paths = JOURNEY_PATHS) {
  if (paths[segment]) return paths[segment];
  const [fallbackSegment] = Object.keys(paths || {});
  return fallbackSegment ? paths[fallbackSegment] : [];
}

export function getCompletedJourneyCardIds(userState = getPartnerUserState()) {
  if (!userState) return [];

  const { completedCards } = userState || {};
  let normalizedCompletedCards = [];

  if (Array.isArray(completedCards)) {
    normalizedCompletedCards = completedCards;
  } else if (completedCards) {
    normalizedCompletedCards = [completedCards];
  }

  return normalizeJourneyCardIds(normalizedCompletedCards);
}

export function getVisibleJourneyCards({
  segment,
  completedCardIds = getCompletedJourneyCardIds(),
  maxCards = MAX_VISIBLE_JOURNEY_CARDS,
  paths = JOURNEY_PATHS,
  cardDetails = JOURNEY_CARD_DETAILS,
} = {}) {
  const path = getJourneyPathForSegment(segment, paths);
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
  completedCardIds = getCompletedJourneyCardIds(),
  completed = true,
) {
  const normalizedCardId = Number(cardId);
  const normalizedCompletedCards = normalizeJourneyCardIds(completedCardIds);

  if (completed) {
    return normalizeJourneyCardIds([...normalizedCompletedCards, normalizedCardId]);
  }

  return normalizedCompletedCards.filter((id) => id !== normalizedCardId);
}
