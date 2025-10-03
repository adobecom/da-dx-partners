import { processPrimaryContact, processSalesAccess } from './personalizationUtils.js';
import {
  hasSalesCenterAccess,
  isAdminUser,
  isPartnerNewlyRegistered,
  isMember,
  partnerIsSignedIn,
  signedInNonMember,
  // isSPPOnly,
  // isTPPOnly,
  // isSPPandTPP,
  getPartnerDataCookieValue
} from './utils.js';
import { PARTNER_LEVEL } from '../blocks/utils/dxConstants.js';

export const PERSONALIZATION_PLACEHOLDERS = {
  'dxp-firstName': '//*[contains(text(), "$dxp-firstName")]',
  'dxp-level': '//*[contains(text(), "$dxp-level")]',
  'dxp-primaryJobRole': '//*[contains(text(), "$dxp-primaryJobRole")]',
  'dxp-accountName': '//*[contains(text(), "$dxp-accountName")]',
};

export const LEVEL_CONDITION = 'partner-level';
export const PERSONALIZATION_MARKER = 'partner-personalization';
export const PROCESSED_MARKER = '-processed';

export const PERSONALIZATION_CONDITIONS = {
  'partner-not-member': signedInNonMember(),
  'partner-not-signed-in': !partnerIsSignedIn(),
  'partner-member': isMember(),
  'partner-sales-access': hasSalesCenterAccess(),
  'partner-level': (level) => PARTNER_LEVEL === level,
  // 'partner-spp-member': isSPPOnly(),
  // 'partner-tpp-member': isTPPOnly(),
  // 'partner-spp-tpp-member': isSPPandTPP(),
  'partner-admin': isAdminUser(),
  'partner-primary': getPartnerDataCookieValue('primarycontact'),
  'partner-newly-registered': isPartnerNewlyRegistered(),
};

export const PROFILE_PERSONALIZATION_ACTIONS = {
  'partner-primary': processPrimaryContact,
  'partner-sales-access': processSalesAccess,
};
