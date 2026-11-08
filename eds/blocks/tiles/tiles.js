import { updatePartnerUserState } from '../../scripts/partnerStateUtils.js';
import {
  buildCompletedJourneyCardState,
  getCompletedJourneyCardIds,
  getVisibleJourneyCards,
} from './utils.js';
import { getPartnerCookieValue, hasPartnerUserStateProperty, partnerCookieContainsValue } from '../../scripts/utils.js';
import { DX_ACCESS_TYPE, DX_PROGRAM_TYPE } from '../utils/dxConstants.js';
import renderBoard from './TilesBoard.js';

function getTilesSegment() {
  const isAdmin = partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN);
  const partnerLevel = getPartnerCookieValue('level', DX_PROGRAM_TYPE);
  const programType = getPartnerCookieValue('primarybusiness', DX_PROGRAM_TYPE);
  if (!partnerLevel || (partnerLevel !== 'community' && !programType)) {
    return null;
  }
  return `${isAdmin ? 'admin' : 'user'}-${partnerLevel === 'community' ? 'community' : programType}`;
}
async function handleUserAction(cardId, action) {
  const completedCardIds = getCompletedJourneyCardIds();
  const nextCompletedCardIds = buildCompletedJourneyCardState(
    cardId,
    completedCardIds,
    action,
  );
  // on first user action (if there is no firstAction in the state) set the date
  const firstUserAction = !hasPartnerUserStateProperty('firstAction');
  const stateUpdates = { completedCards: nextCompletedCardIds };
  if (firstUserAction) {
    stateUpdates.firstAction = new Date().toISOString();
  }
  try {
    const result = await updatePartnerUserState(stateUpdates);
    if (!result?.success) return false;
  } catch (error) {
    return false;
  }
  return true;
}
export default async function init(el) {
  const segment = getTilesSegment();
  const visibleCards = getVisibleJourneyCards({
    segment,
    completedCardIds: getCompletedJourneyCardIds(),
  });
  if (!visibleCards || visibleCards.length === 0) {
    el.remove();
    return;
  }
  const tilesBoard = renderBoard(visibleCards, handleUserAction);
  const root = document.createElement('div');
  root.className = 'tiles-block';
  root.appendChild(tilesBoard);
  el.replaceWith(tilesBoard);
}
