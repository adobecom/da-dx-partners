import { getPartnerDataCookieValue} from '../../scripts/utils.js';

export const RT_SEARCH_ACTION_PATH = '/api/v1/web/da-dx-partners-runtime/search-apc/search-apc?';

export const DX_PROGRAM_TYPE = 'dxp';

export const PARTNER_LEVEL = getPartnerDataCookieValue('level', DX_PROGRAM_TYPE);

export const DIGITALEXPERIENCE_PREVIEW_PATH = '/digitalexperience/preview/';
export const DIGITALEXPERIENCE_ASSETS_PATH = '/digitalexperience-assets/';
export const PX_ASSETS_AEM_PATH = '/content/dam/dxp/';
