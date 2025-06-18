import {processPrimaryContact, processSalesAccess, COOKIE_OBJECT, processProfileItem} from './personalizationUtils.js';
import {
  getPartnerDataCookieObject,
  hasSalesCenterAccess,
  isAdminUser,
  isPartnerNewlyRegistered,
  isMember,
  partnerIsSignedIn,
  signedInNonMember,
  isSPPOnly,
  isTPPOnly,
  isSPPandTPP,
} from './utils.js';
import { PARTNER_LEVEL, PROGRAM } from '../blocks/utils/dxConstants.js';

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
  'partner-spp-sales-access': hasSalesCenterAccess('spp'),
  'partner-tpp-sales-access': hasSalesCenterAccess('tpp'),
  'partner-level': (level, programType) => PARTNER_LEVEL === level && programType === PROGRAM,
  'partner-spp-member': isSPPOnly(),
  'partner-tpp-member': isTPPOnly(),
  'partner-spp-tpp-member': isSPPandTPP(),
  'partner-admin': isAdminUser(),
  'partner-primary': COOKIE_OBJECT.primaryContact,
  'partner-newly-registered': isPartnerNewlyRegistered(),
};

export const PROFILE_PERSONALIZATION_ACTIONS = {
  'partner-primary': processPrimaryContact,
  'partner-spp-sales-access': (el) => processSalesAccess(el, 'spp'),
  'partner-tpp-sales-access': (el) => processSalesAccess(el, 'tpp'),
  'partner-spp-account': (el) => processProfileItem(el, 'spp'),
  'partner-tpp-account': (el) => processProfileItem(el, 'tpp'),
};
