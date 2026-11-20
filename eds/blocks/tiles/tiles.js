import {
  buildCompletedJourneyCardState,
  getCompletedJourneyCardIds,
  getVisibleJourneyCards,
} from './utils.js';
import {
  getCookieValue,
  getCurrentProgramType,
  getPartnerCookieValue,
  hasPartnerUserStateProperty,
  partnerCookieContainsValue,
  PARTNER_USER_STATE_COOKIE,
} from '../../scripts/utils.js';
import { DX_ACCESS_TYPE, DX_PROGRAM_TYPE } from '../utils/dxConstants.js';
import JourneyCards from './JourneyCards.js';

function declareJourneyCards() {
  if (customElements.get('journey-cards')) return;
  customElements.define('journey-cards', JourneyCards);
}

export function getTilesSegment() {
  const isAdmin = partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN);
  const partnerLevel = getPartnerCookieValue('level', DX_PROGRAM_TYPE);
  const programType = getPartnerCookieValue('primarybusiness', DX_PROGRAM_TYPE);
  if (!partnerLevel || (partnerLevel !== 'community' && !programType)) {
    return null;
  }
  return `${isAdmin ? 'admin' : 'user'}-${partnerLevel === 'community' ? 'community' : programType}`;
}

// TODO: local-testing only - writes the completed cards directly into the
// partner_user_state cookie instead of calling the state-management API.
// Replace with updatePartnerUserState from partnerStateUtils.js before merging.
function updatePartnerUserStateCookie(stateUpdates) {
  const programType = getCurrentProgramType().toUpperCase();
  const existingCookie = getCookieValue(PARTNER_USER_STATE_COOKIE);
  const stateByProgram = existingCookie ? JSON.parse(decodeURIComponent(existingCookie)) : {};
  stateByProgram[programType] = { ...stateByProgram[programType], ...stateUpdates };
  document.cookie = `${PARTNER_USER_STATE_COOKIE}=${encodeURIComponent(JSON.stringify(stateByProgram))}; Path=/`;
  return { success: true };
}

export async function handleUserAction(cardId, action, deps = {}) {
  const {
    getCompletedCardIds = getCompletedJourneyCardIds,
    buildState = buildCompletedJourneyCardState,
    hasFirstAction = hasPartnerUserStateProperty,
    updateState = updatePartnerUserStateCookie,
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
    } = deps;

    const visibleCards = getVisibleCards({
      segment,
      completedCardIds: getCompletedCardIds(),
    });
    if (!visibleCards || visibleCards.length === 0) {
      el.remove();
      return;
    }

    declareJourneyCards();
    const app = document.createElement('journey-cards');
    app.className = 'tiles-block';
    app.cards = visibleCards;
    app.actionHandler = handleUserAction;
    el.replaceWith(app);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to render journey cards:', error);
    el.remove();
  }
}
