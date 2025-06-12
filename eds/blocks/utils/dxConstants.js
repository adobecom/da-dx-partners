import { getCurrentProgramType, getPartnerDataCookieValue } from '../../scripts/utils.js';

export const RT_SEARCH_ACTION_PATH = '/api/v1/web/da-dx-partners-runtime/search-apc/search-apc?';

export const PROGRAM_TYPES = ['spp', 'tpp'];

export const PROGRAM = getCurrentProgramType();
export const PARTNER_LEVEL = getPartnerDataCookieValue(PROGRAM, 'level');
