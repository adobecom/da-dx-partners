import { processPrimaryContact, processSalesAccess } from './personalizationUtils.js';
import {
  hasSalesCenterAccess,
  isAdminUser,
  isPartnerNewlyRegistered,
  isMember,
  partnerIsSignedIn,
  signedInNonMember,
  getPartnerDataCookieValue,
  getPrimaryBusiness,
  getAccessType,
  getDesignationType,
  getComplianceStatus,
  getAccountStatus,
  isReturningUser60d,
  isReturningUser90d,
  isComplianceExpirationInPast,
  isComplianceExpirationInFuture
} from './utils.js';
import { PARTNER_LEVEL } from '../blocks/utils/dxConstants.js';

export const PERSONALIZATION_PLACEHOLDERS = {
  'firstName': '//*[contains(text(), "$firstName")]',
  'level': '//*[contains(text(), "$level")]',
  'primaryJobRole': '//*[contains(text(), "$primaryJobRole")]',
  'accountName': '//*[contains(text(), "$accountName")]',
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
  'partner-admin': isAdminUser(),
  'partner-primary': getPartnerDataCookieValue('primarycontact'),
  'partner-newly-registered': isPartnerNewlyRegistered(),
  'partner-primary-business-solution': getPrimaryBusiness() === 'solution',
  'partner-primary-business-technology': getPrimaryBusiness() === 'technology',
  'returning-user-60d': isReturningUser60d(),
  'returning-user-90d': isReturningUser90d(),
  'partner-billing-admin': getAccessType() === 'billing admin',
  'partner-salescenter-admin': getAccessType() === 'sales center admin',
  'partner-user': getAccessType() === '/',
  'designation-Legal': getDesignationType() === 'legal and compliance',
  'designation-Learning': getDesignationType() === 'learning & development',
  'Locked-compliance': getAccountStatus() === 'locked' && getComplianceStatus() === 'not completed',
  'Locked-payment': getAccountStatus() === 'locked' && getComplianceStatus() === 'completed',
  'Locked-compliance-past': getAccountStatus() === 'locked' && isComplianceExpirationInPast(),
  'Locked-payment-future': getAccountStatus() === 'locked' && isComplianceExpirationInFuture(),
  'Submitted-in-review': getAccountStatus() === 'submitted in review',
};

export const PROFILE_PERSONALIZATION_ACTIONS = {
  'partner-primary': processPrimaryContact,
  'partner-sales-access': processSalesAccess,
};
