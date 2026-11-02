import { expect } from '@esm-bundle/chai';
import {
  PERSONALIZATION_PLACEHOLDERS,
  PERSONALIZATION_CONDITIONS,
  PROFILE_PERSONALIZATION_ACTIONS,
} from '../../eds/scripts/personalizationConfigDX.js';
import {
  DX_ACCOUNT_NAME_CONDITION_PREFIX,
  DX_ACCOUNT_NAME_MAPPING,
} from '../../eds/blocks/utils/dxConstants.js';

describe('personalizationConfigDX', () => {
  it('defines the supported placeholder selectors', () => {
    expect(PERSONALIZATION_PLACEHOLDERS.firstName).to.contain('$firstName');
    expect(PERSONALIZATION_PLACEHOLDERS.profileImage).to.contain('$profileImage');
  });

  it('defines personalization conditions and profile actions', () => {
    expect(PERSONALIZATION_CONDITIONS).to.have.property('partner-member');
    expect(PERSONALIZATION_CONDITIONS).to.have.property('partner-adobe-account');
    expect(PROFILE_PERSONALIZATION_ACTIONS).to.have.property('partner-primary');
    expect(PROFILE_PERSONALIZATION_ACTIONS).to.have.property('partner-sales-access');
  });

  it('defines a condition for each account name mapping key', () => {
    Object.keys(DX_ACCOUNT_NAME_MAPPING).forEach((key) => {
      expect(PERSONALIZATION_CONDITIONS).to.have.property(`${DX_ACCOUNT_NAME_CONDITION_PREFIX}${key}`);
    });
  });
});
