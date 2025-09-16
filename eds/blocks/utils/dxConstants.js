import { getPartnerDataCookieValue} from '../../scripts/utils.js';

export const RT_SEARCH_ACTION_PATH = '/api/v1/web/dx-partners-runtime/search-dxp?';

export const DX_PROGRAM_TYPE = 'spp';

export const PARTNER_LEVEL = getPartnerDataCookieValue('level', DX_PROGRAM_TYPE);

export const DIGITALEXPERIENCE_PREVIEW_PATH = '/digitalexperience/preview/';
export const DIGITALEXPERIENCE_ASSETS_PATH = '/digitalexperience-assets/';
export const PX_ASSETS_AEM_PATH = '/content/dam/dxp/';
