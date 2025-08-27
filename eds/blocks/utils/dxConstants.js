import { getPartnerDataCookieValue} from '../../scripts/utils.js';

export const RT_SEARCH_ACTION_PATH = '/api/v1/web/da-dx-partners-runtime/search-apc/search-apc?';

export const DX_PROGRAM_TYPE = 'spp';

export const PARTNER_LEVEL = getPartnerDataCookieValue('level', DX_PROGRAM_TYPE);

export const PX_PARTNER_LEVELS = Object.freeze({
  PUBLIC: 'caas:adobe-partners/px/partner-level/public',
  COMMUNITY: 'caas:adobe-partners/px/partner-level/community',
  SILVER: 'caas:adobe-partners/px/partner-level/silver',
  GOLD: 'caas:adobe-partners/px/partner-level/gold',
  PLATINUM: 'caas:adobe-partners/px/partner-level/platinum',
});
export const PX_PARTNER_LEVELS_ROOT = 'caas:adobe-partners/px/partner-level';
export const DIGITALEXPERIENCE_PREVIEW_PATH = '/digitalexperience/preview/';
export const DIGITALEXPERIENCE_ASSETS_PATH = '"/digitalexperience-assets/"';

