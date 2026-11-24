import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';
import {
  buildCompletedJourneyCardState,
  getCompletedJourneyCardIds,
  getCurrentJourneyToDoCards,
  normalizeJourneyCardIds,
} from '../../../eds/blocks/tiles/utils.js';

// tiles.js (via JourneyCards.js) resolves miloLibs-relative imports at module
// load time, so setLibs must run before the static import below executes.
const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ locales: { '': { ietf: 'en-US' } }, miloLibs });
const {
  getTilesSegment,
  handleUserAction,
  default: init,
} = await import('../../../eds/blocks/tiles/tiles.js');

describe('tiles block logic', () => {
  beforeEach(() => {
    document.cookie = 'partner_data=; Path=/; Max-Age=0;';
    document.cookie = 'partner_info=; Path=/; Max-Age=0;';
    document.cookie = 'partner_user_state=; Path=/; Max-Age=0;';
    document.body.innerHTML = '';
  });

  it('validates completed journey card ids from partner user state', () => {
    expect(() => getCompletedJourneyCardIds({ completedCards: '1' })).to.throw('Invalid partner_user_state.completedCards');
    expect(() => normalizeJourneyCardIds([1, '2', 2])).to.throw('Journey card ids must be numbers');
  });

  it('returns only the visible journey cards for the current path', () => {
    const cards = getCurrentJourneyToDoCards({
      segment: 'demo',
      completedCardIds: new Set([1]),
      maxCards: 9,
      paths: { demo: [{ id: 1, condition: null }, { id: 2, condition: null }, { id: 3, condition: null }] },
      cardDetails: {
        1: { id: 1 },
        2: { id: 2 },
        3: { id: 3 },
      },
    });

    expect(cards.map((card) => Number(card.id))).to.deep.equal([2, 3]);
  });

  it('coerces DOM card ids to numbers when updating journey state', () => {
    expect(buildCompletedJourneyCardState('3', [1, 2], 'complete')).to.deep.equal([1, 2, 3]);
    expect(buildCompletedJourneyCardState('2', [1, 2, 3], 'remove')).to.deep.equal([1, 3]);
  });

  it('builds the correct segment from partner cookies', () => {
    document.cookie = `partner_data=${encodeURIComponent(JSON.stringify({ DXP: { level: 'gold', primarybusiness: 'dxp', accesstype: 'user' } }))}; Path=/`;
    expect(getTilesSegment()).to.equal('user-dxp');
  });

  it('submits card state updates with a numeric card id and creates firstAction when needed', async () => {
    const updateState = sinon.stub().resolves({ success: true });
    const result = await handleUserAction('7', 'complete', {
      getCompletedCardIds: () => [1, 2],
      buildState: (cardId, completedCardIds, action) => {
        expect(Number(cardId)).to.equal(7);
        expect(completedCardIds).to.deep.equal([1, 2]);
        expect(action).to.equal('complete');
        return [1, 2, 7];
      },
      hasFirstAction: () => false,
      updateState,
    });

    expect(result).to.be.true;
    expect(updateState.calledOnce).to.be.true;
    expect(updateState.firstCall.args[0].completedCards).to.deep.equal([1, 2, 7]);
    expect(updateState.firstCall.args[0].firstAction).to.be.a('string');
  });

  it('renders the journey-cards component with the computed visible cards', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    await init(host, {
      segment: 'user-dxp',
      getCompletedCardIds: () => [],
      getVisibleCards: () => [],
    });
    expect(host.isConnected).to.be.false;

    const nextHost = document.createElement('div');
    document.body.appendChild(nextHost);
    await init(nextHost, {
      segment: 'user-dxp',
      getCompletedCardIds: () => [],
      getVisibleCards: () => [{ id: 2, title: 'Visible card', description: 'Example' }],
    });
    expect(nextHost.isConnected).to.be.false;

    const app = document.querySelector('journey-cards');
    expect(app).to.exist;
    expect(app.toDoCards).to.deep.equal([{ id: 2, title: 'Visible card', description: 'Example' }]);
    expect(app.actionHandler).to.equal(handleUserAction);
    await app.updateComplete;
    expect(app.querySelector('.journey-card')).to.exist;
  });
});
