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
  'firstName': '//*[contains(., "$firstName") and not(.//*[contains(., "$firstName")])]',
  'lastName': '//*[contains(., "$lastName") and not(.//*[contains(., "$lastName")])]',
  'purchasedPartnerLevel': '//*[contains(., "$purchasedPartnerLevel") and not(.//*[contains(., "$purchasedPartnerLevel")])]',
  'level': '//*[contains(., "$level") and not(.//*[contains(., "$level")])]',
  'primaryJobRole': '//*[contains(., "$primaryJobRole") and not(.//*[contains(., "$primaryJobRole")])]',
  'accountName': '//*[contains(., "$accountName") and not(.//*[contains(., "$accountName")])]',
  'company': '//*[contains(., "$company") and not(.//*[contains(., "$company")])]',
  'email': '//*[contains(., "$email") and not(.//*[contains(., "$email")])]',
  'bctqExpirationDays': '//*[contains(., "$bctqExpirationDays") and not(.//*[contains(., "$bctqExpirationDays")])]',
  // Special handlers that replace entire element - use text() to avoid matching parent elements
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
