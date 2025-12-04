import { getPartnerDataCookieValue } from '../../scripts/utils.js';

export const RT_SEARCH_ACTION_PATH = '/api/v1/web/dx-partners-runtime/search-dxp?';

export const DX_PROGRAM_TYPE = 'dxp';

export const PARTNER_LEVEL = getPartnerDataCookieValue('level', DX_PROGRAM_TYPE);

export const DIGITALEXPERIENCE_PREVIEW_PATH = '/digitalexperience/preview/';
export const DIGITALEXPERIENCE_ASSETS_PATH = '/digitalexperience-assets/';
export const PX_ASSETS_PREVIEW_PATH = '/digitalexperience-assets/preview/';
export const FILE_EXTENSION_TO_DOWNLOAD_LABEL = {
  // PowerPoint
  ppt: 'Download PPT',
  pptx: 'Download PPT',

  // ZIP
  zip: 'Download ZIP',

  // Images
  jpg: 'Download Image',
  jpeg: 'Download Image',
  svg: 'Download Image',
  gif: 'Download Image',
  webp: 'Download Image',
  png: 'Download Image',

  // Word Documents
  doc: 'Download Word',
  docx: 'Download Word',

  // Videos
  mp4: 'Download Video',
  mov: 'Download Video',
  m4v: 'Download Video',

  // PDF
  pdf: 'Download PDF',

  // Excel
  xls: 'Download Excel',
  xlsx: 'Download Excel',
  xlsm: 'Download Excel',

  // Generic binary
  bin: 'Download File',
  exe: 'Download File',
  dll: 'Download File',
  dat: 'Download File',
};

export const DX_COMPLIANCE_STATUS = {
    COMPLETED: 'Completed',
    NOT_COMPLETED: 'Not Completed'
}

export const DX_SPECIAL_STATE = {
    LOCKED: 'locked',
    LOCKED_COMPLIANCE_PAST: 'locked-compliance-past',
    LOCKED_PAYMENT_FUTURE: 'locked-payment-future',
    SUBMITTED_IN_REVIEW: 'submitted-in-review',
}

export const DX_PRIMARY_BUSINESS = {
    SOLUTION: 'Solution',
    TECHNOLOGY: 'Technology',
}

export const DX_ACCESS_TYPE = {
    BILLING_ADMIN: 'Billing Admin',
    SALES_CENTER_ADMIN: 'Sales Center Admin',
    ADMIN: 'Admin'
}

export const DX_DESIGNATION_TYPE = {
    LEGAL_AND_COMPLIANCE: 'Legal and Compliance',
    LEARNING_AND_DEVELOPMENT: 'Learning & Development'
}
