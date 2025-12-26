import { processPrimaryContact, processSalesAccess } from './personalizationUtils.js';
import {
  hasSalesCenterAccess,
  isAdminUser,
  isPartnerNewlyRegistered,
  isMember,
  partnerIsSignedIn,
  signedInNonMember,
  getPartnerCookieValue,
  partnerCookieContainsValue,
  isReturningUser, isAccountLocked, isBctqExpiring
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
  'lastName': '//*[contains(text(), "$lastName")]',
  'level': '//*[contains(text(), "$level")]',
  'primaryJobRole': '//*[contains(text(), "$primaryJobRole")]',
  'accountName': '//*[contains(text(), "$accountName")]',
  'company': '//*[contains(text(), "$company")]',
  'email': '//*[contains(text(), "$email")]',
  'bctqExpirationDays': '//*[contains(text(), "$bctqExpirationDays")]',
  'profileImage': '//*[contains(text(), "$profileImage")]',
  'companyLogoUrl': '//*[contains(text(), "$companyLogoUrl")]'
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
  'partner-primary': getPartnerCookieValue('primarycontact'),
  'partner-primary-business-solution': partnerCookieContainsValue('primarybusiness', DX_PRIMARY_BUSINESS.SOLUTION),
  'partner-primary-business-technology': partnerCookieContainsValue('primarybusiness', DX_PRIMARY_BUSINESS.TECHNOLOGY),
  'partner-new-user-segment': isPartnerNewlyRegistered(),
  'partner-returning-user-60d': isReturningUser(60),
  'partner-returning-user-90d': isReturningUser(90),
  'partner-billing-admin': partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.BILLING_ADMIN),
  'partner-salescenter-admin': partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.SALES_CENTER_ADMIN),
  'partner-admin': partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN),
  'partner-user': !(partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN) ||
      partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.BILLING_ADMIN) ||
      partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.SALES_CENTER_ADMIN)),
  'partner-designation-legal': partnerCookieContainsValue('designationtype', DX_DESIGNATION_TYPE.LEGAL_AND_COMPLIANCE),
  'partner-designation-learning': partnerCookieContainsValue('designationtype', DX_DESIGNATION_TYPE.LEARNING_AND_DEVELOPMENT),
  'partner-locked-compliance': isAccountLocked() && getPartnerCookieValue('compliancestatus') === DX_COMPLIANCE_STATUS.NOT_COMPLETED.toLowerCase(),
  'partner-locked-payment': isAccountLocked() && getPartnerCookieValue('compliancestatus') === DX_COMPLIANCE_STATUS.COMPLETED.toLowerCase(),
  'partner-locked-compliance-past': getPartnerCookieValue('specialstate') === DX_SPECIAL_STATE.LOCKED_COMPLIANCE_PAST,
  'partner-locked-payment-future': getPartnerCookieValue('specialstate') === DX_SPECIAL_STATE.LOCKED_PAYMENT_FUTURE,
  'partner-submitted-in-review': getPartnerCookieValue('specialstate') === DX_SPECIAL_STATE.SUBMITTED_IN_REVIEW,
  'partner-bctq-expiring-90d': isBctqExpiring(90),
};

export const PROFILE_PERSONALIZATION_ACTIONS = {
  'partner-primary': processPrimaryContact,
  'partner-sales-access': processSalesAccess,
};
