import { updatePartnerUserState } from '../../scripts/partnerStateUtils.js';
import {
  buildCompletedJourneyCardState,
  getCompletedJourneyCardIds,
  getVisibleJourneyCards,
} from './utils.js';
import { getPartnerCookieValue, hasPartnerUserStateProperty, partnerCookieContainsValue } from '../../scripts/utils.js';
import { DX_ACCESS_TYPE, DX_PROGRAM_TYPE } from '../utils/dxConstants.js';
import renderBoard from './TilesBoard.js';

export function getTilesSegment() {
  const isAdmin = partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN);
  const partnerLevel = getPartnerCookieValue('level', DX_PROGRAM_TYPE);
  const programType = getPartnerCookieValue('primarybusiness', DX_PROGRAM_TYPE);
  if (!partnerLevel || (partnerLevel !== 'community' && !programType)) {
    return null;
  }
  return `${isAdmin ? 'admin' : 'user'}-${partnerLevel === 'community' ? 'community' : programType}`;
}

export async function handleUserAction(cardId, action, deps = {}) {
  const {
    getCompletedCardIds = getCompletedJourneyCardIds,
    buildState = buildCompletedJourneyCardState,
    hasFirstAction = hasPartnerUserStateProperty,
    updateState = updatePartnerUserState,
  } = deps;

  const completedCardIds = getCompletedCardIds();
  const nextCompletedCardIds = buildState(
    cardId,
    completedCardIds,
    action,
  );
  // on first user action (if there is no firstAction in the state) set the date
  const firstUserAction = !hasFirstAction('firstAction');
  const stateUpdates = { completedCards: nextCompletedCardIds };
  if (firstUserAction) {
    stateUpdates.firstAction = new Date().toISOString();
  }
  try {
    const result = await updateState(stateUpdates);
    if (!result?.success) return false;
  } catch (error) {
    return false;
  }
  return true;
}

export default async function init(el, deps = {}) {
  try {
    const {
      segment = getTilesSegment(),
      getCompletedCardIds = getCompletedJourneyCardIds,
      getVisibleCards = getVisibleJourneyCards,
      renderJourneyBoard = renderBoard,
    } = deps;

    const visibleCards = getVisibleCards({
      segment,
      completedCardIds: getCompletedCardIds(),
    });
    if (!visibleCards || visibleCards.length === 0) {
      el.remove();
      return;
    }
    const tilesBoard = renderJourneyBoard(visibleCards, handleUserAction);
    const root = document.createElement('div');
    root.className = 'tiles-block';
    root.appendChild(tilesBoard);
    el.replaceWith(tilesBoard);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to render journey cards:', error);
    el.remove();
  }
}
