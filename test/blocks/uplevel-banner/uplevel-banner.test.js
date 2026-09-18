import { expect } from '@esm-bundle/chai';
import { getTargetLevel } from '../../../eds/blocks/uplevel-banner/uplevel-banner.js';

describe('uplevel-banner', () => {
  it('maps completed silver and gold tracks to the next level', () => {
    const data = {
      level: 'Silver',
      solution: [{
        level: 'gold',
        credentials: { percentage: 100 },
        customerDeployments: { percentage: 100 },
        specializations: { percentage: 100 },
      }],
    };

    expect(getTargetLevel(data)).to.equal('gold');
  });

  it('returns null for incomplete or terminal levels', () => {
    expect(getTargetLevel({ level: 'Platinum' })).to.equal(null);
    expect(getTargetLevel({ level: 'Gold', solution: [] })).to.equal(null);
  });
});
