import {
  buildCompletedJourneyCardState,
  getCompletedJourneyCardIds,
  getCurrentJourneyCompletedCards,
  getCurrentJourneyToDoCards,
  getJourneyPathForSegment,
  JOURNEY_PATHS,
  normalizeJourneyCardIds,
} from './utils.js';
import {
  getLibs,
  getPartnerCookieValue,
  hasPartnerUserStateProperty,
  partnerCookieContainsValue,
} from '../../scripts/utils.js';
import { DX_ACCESS_TYPE, DX_PROGRAM_TYPE } from '../utils/dxConstants.js';
import JourneyCards from './JourneyCards.js';
import { getConfig, localizationPromises, populateLocalizedTextFromListItems } from '../utils/utils.js';
import { updatePartnerUserState } from '../../scripts/partnerStateUtils.js';

const miloLibs = getLibs();
const localizedText = {
  '{{to-do}}': 'To Do',
  '{{completed}}': 'Completed',
  '{{suggested-next}}': 'Suggested next',
  '{{open}}': 'Open',
  '{{mark-complete}}': 'Mark complete',
  '{{undo}}': 'Undo',
  '{{revisit-task}}': 'Revisit task',
};
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
  const now = new Date().toISOString();
  if (firstUserAction) {
    stateUpdates.firstAction = now;
  }
  stateUpdates.lastAction = now;
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
      getVisibleCards = getCurrentJourneyToDoCards,
    } = deps;

    const completedCardIds = getCompletedCardIds();
    const normalizedCompletedCards = normalizeJourneyCardIds(completedCardIds);
    const completedCardSet = new Set(normalizedCompletedCards);

    const toDoCards = getVisibleCards({
      segment,
      completedCardIds: completedCardSet,
    });
    if (!toDoCards || toDoCards.length === 0) {
      el.remove();
      return;
    }
    const completedCards = getCurrentJourneyCompletedCards({
      segment,
      completedCardIds: completedCardSet,
    });

    declareJourneyCards();
    populateLocalizedTextFromListItems(el, localizedText);
    const config = getConfig();
    const blockDeps = await Promise.all([
      localizationPromises(localizedText, config),
      import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
      import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
      import(`${miloLibs}/features/spectrum-web-components/dist/button-group.js`),
    ]);
    await blockDeps;
    const blockData = { localizedText };
    const app = document.createElement('journey-cards');
    app.blockData = blockData;
    app.className = 'journey-board-block';
    app.toDoCards = toDoCards;
    app.completedCards = completedCards;
    app.segment = segment;
    app.segmentTotalCards = getJourneyPathForSegment(segment, JOURNEY_PATHS)?.length;
    app.actionHandler = handleUserAction;
    el.replaceWith(app);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to render journey cards:', error);
    el.remove();
  }
}
