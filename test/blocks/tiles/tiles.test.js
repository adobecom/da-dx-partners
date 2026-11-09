import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';
import {
  buildCompletedJourneyCardState,
  getCompletedJourneyCardIds,
  getVisibleJourneyCards,
  normalizeJourneyCardIds,
} from '../../../eds/blocks/tiles/utils.js';
import {
  getTilesSegment,
  handleUserAction,
  default as init,
} from '../../../eds/blocks/tiles/tiles.js';

describe('tiles block logic', () => {
  beforeEach(() => {
    setLibs('/libs');
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
    const cards = getVisibleJourneyCards({
      segment: 'demo',
      completedCardIds: [1],
      maxCards: 9,
      paths: {
        demo: [{ id: 1, condition: null }, { id: 2, condition: null }, { id: 3, condition: null }],
      },
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

  it('renders a journey board and handles toggle actions', async () => {
    const { default: renderBoard } = await import('../../../eds/blocks/tiles/TilesBoard.js');
    const onComplete = sinon.stub().callsFake(async (cardId, action) => {
      expect(cardId).to.equal(5);
      expect(action).to.equal('complete');
      return true;
    });
    const board = renderBoard([{ id: 5, title: 'Title', description: 'Description' }], onComplete);
    const card = board.querySelector('.journey-card');
    const button = card.querySelector('.journey-card-toggle');

    expect(card.getAttribute('data-card-id')).to.equal('5');
    expect(button.getAttribute('data-action')).to.equal('complete');

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onComplete.calledOnce).to.be.true;
    expect(button.dataset.action).to.equal('undo');
    expect(button.textContent.trim()).to.equal('Undo');
  });

  it('removes the host element when visible cards are empty and renders when cards exist', async () => {
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
    expect(document.querySelector('.journey-board')).to.exist;
  });
});
