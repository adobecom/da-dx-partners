import { expect } from '@esm-bundle/chai';
import {
  DEFAULT_SEGMENT,
  getVisibleCards,
  normalizeCardIds,
} from '../../../eds/blocks/tiles/tiles.js';

describe('tiles block logic', () => {
  it('normalizes numeric card ids from strings and duplicates', () => {
    expect(normalizeCardIds(['1', '1', '2'])).to.deep.equal([1, 2]);
  });

  it('returns the visible cards in path order for the selected segment', () => {
    const cards = getVisibleCards({
      segment: DEFAULT_SEGMENT,
      completedCardIds: [],
      maxCards: 9,
    });

    expect(cards.map((card) => Number(card.id))).to.deep.equal([1, 3, 4, 6, 7, 8, 10, 13, 15]);
  });

  it('treats numeric completed ids as completed without string mismatches', () => {
    const cards = getVisibleCards({
      segment: DEFAULT_SEGMENT,
      completedCardIds: [1],
      maxCards: 9,
    });

    expect(cards.map((card) => Number(card.id))).to.not.include(1);
  });
});
