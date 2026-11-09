import { expect } from '@esm-bundle/chai';
import {
  buildCompletedJourneyCardState,
  getCompletedJourneyCardIds,
  getVisibleJourneyCards,
  normalizeJourneyCardIds,
} from '../../../eds/blocks/tiles/utils.js';

describe('tiles block logic', () => {
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
});
