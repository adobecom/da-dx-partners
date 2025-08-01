import { processPrimaryContact, processSalesAccess } from './personalizationUtils.js';
import {
  hasSalesCenterAccess,
  isAdminUser,
  isPartnerNewlyRegistered,
  isMember,
  partnerIsSignedIn,
  signedInNonMember,
  isSPPOnly,
  isTPPOnly,
  isSPPandTPP,
  getPartnerDataCookieValue
} from './utils.js';
import { PARTNER_LEVEL } from '../blocks/utils/dxConstants.js';

export const PERSONALIZATION_PLACEHOLDERS = {
  'spp-firstName': '//*[contains(text(), "$spp-firstName")]',
  'tpp-firstName': '//*[contains(text(), "$tpp-firstName")]',
  'spp-level': '//*[contains(text(), "$spp-level")]',
  'tpp-level': '//*[contains(text(), "$tpp-level")]',
  'spp-primaryJobRole': '//*[contains(text(), "$spp-primaryJobRole")]',
  'tpp-primaryJobRole': '//*[contains(text(), "$tpp-primaryJobRole")]',
  'spp-accountName': '//*[contains(text(), "$spp-accountName")]',
  'tpp-accountName': '//*[contains(text(), "$tpp-accountName")]',
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
  'partner-spp-member': isSPPOnly(),
  'partner-tpp-member': isTPPOnly(),
  'partner-spp-tpp-member': isSPPandTPP(),
  'partner-admin': isAdminUser(),
  'partner-primary': getPartnerDataCookieValue('primarycontact'),
  'partner-newly-registered': isPartnerNewlyRegistered(),
};

export const PROFILE_PERSONALIZATION_ACTIONS = {
  'partner-primary': processPrimaryContact,
  'partner-sales-access': processSalesAccess,
};
