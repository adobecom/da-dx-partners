import { processPrimaryContact, processSalesAccess } from './personalizationUtils.js';
import {
  hasSalesCenterAccess,
  isAdminUser,
  isPartnerNewlyRegistered,
  isMember,
  partnerIsSignedIn,
  signedInNonMember,
  getPartnerDataCookieValue,
  partnerDataCookieContainsValue,
  isReturningUser, isAccountLocked
} from './utils.js';
import {
  DX_ACCESS_TYPE,
  DX_COMPLIANCE_STATUS, DX_DESIGNATION_TYPE,
  DX_PRIMARY_BUSINESS,
  DX_SPECIAL_STATE,
  PARTNER_LEVEL
} from '../blocks/utils/dxConstants.js';

export const PERSONALIZATION_PLACEHOLDERS = {
  'firstName': '//*[contains(text(), "$firstName")]',
  'level': '//*[contains(text(), "$level")]',
  'primaryJobRole': '//*[contains(text(), "$primaryJobRole")]',
  'accountName': '//*[contains(text(), "$accountName")]',
  'company': '//*[contains(text(), "$company")]',
  'email': '//*[contains(text(), "$email")]'
};

export const LEVEL_CONDITION = 'partner-level';
export const PERSONALIZATION_MARKER = 'partner-personalization';
export const PROCESSED_MARKER = '-processed';
export const NEGATION_PREFIX = 'partner-not-'

export const PERSONALIZATION_CONDITIONS = {
  'partner-signed-in': partnerIsSignedIn(),
  'partner-member': isMember(),
  'partner-sales-access': hasSalesCenterAccess(),
  'partner-level': (level) => PARTNER_LEVEL === level,
  'partner-primary': getPartnerDataCookieValue('primarycontact'),
  'partner-primary-business-solution': partnerDataCookieContainsValue('primarybusiness', DX_PRIMARY_BUSINESS.SOLUTION),
  'partner-primary-business-technology': partnerDataCookieContainsValue('primarybusiness', DX_PRIMARY_BUSINESS.TECHNOLOGY),
  'partner-new-user-segment': isPartnerNewlyRegistered(),
  'partner-returning-user-60d': isReturningUser(60),
  'partner-returning-user-90d': isReturningUser(90),
  'partner-billing-admin': partnerDataCookieContainsValue('accesstype', DX_ACCESS_TYPE.BILLING_ADMIN),
  'partner-salescenter-admin': partnerDataCookieContainsValue('accesstype', DX_ACCESS_TYPE.SALES_CENTER_ADMIN),
  'partner-admin': partnerDataCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN),
  'partner-user': !(partnerDataCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN) ||
      partnerDataCookieContainsValue('accesstype', DX_ACCESS_TYPE.BILLING_ADMIN) ||
      partnerDataCookieContainsValue('accesstype', DX_ACCESS_TYPE.SALES_CENTER_ADMIN)),
  'partner-designation-legal': partnerDataCookieContainsValue('designationtype', DX_DESIGNATION_TYPE.LEGAL_AND_COMPLIANCE),
  'partner-designation-learning': partnerDataCookieContainsValue('designationtype', DX_DESIGNATION_TYPE.LEARNING_AND_DEVELOPMENT),
  'partner-locked-compliance': isAccountLocked() && getPartnerDataCookieValue('compliancestatus') === DX_COMPLIANCE_STATUS.NOT_COMPLETED.toLowerCase(),
  'partner-locked-payment': isAccountLocked() && getPartnerDataCookieValue('compliancestatus') === DX_COMPLIANCE_STATUS.COMPLETED.toLowerCase(),
  'partner-locked-compliance-past': getPartnerDataCookieValue('specialstate') === DX_SPECIAL_STATE.LOCKED_COMPLIANCE_PAST,
  'partner-locked-payment-future': getPartnerDataCookieValue('specialstate') === DX_SPECIAL_STATE.LOCKED_PAYMENT_FUTURE,
  'partner-submitted-in-review': getPartnerDataCookieValue('specialstate') === DX_SPECIAL_STATE.SUBMITTED_IN_REVIEW,
};

export const PROFILE_PERSONALIZATION_ACTIONS = {
  'partner-primary': processPrimaryContact,
  'partner-sales-access': processSalesAccess,
};
