import { getRuntimeActionUrl } from '../blocks/utils/utils.js';
import {
  getCurrentProgramType,
  getPartnerCookieValue,
} from './utils.js';
import { RT_DXP_STATE_MANAGEMENT_PATH } from '../blocks/utils/dxConstants.js';

async function updatePartnerState(action, stateUpdates) {
  try {
    const url = getRuntimeActionUrl(RT_DXP_STATE_MANAGEMENT_PATH);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        programType: getCurrentProgramType().toUpperCase(),
        action,
        email: getPartnerCookieValue('email'),
        stateUpdates,
      }),
    });

    if (!response.ok) {
      console.error(`Partner state update failed, status: ${response.status}`);
      return { success: false, status: response.status };
    }

    const body = await response.json();
    return { success: true, status: response.status, body };
  } catch (error) {
    console.error('Partner state update error', error);
    return { success: false, error };
  }
}

export function updatePartnerUserState(stateUpdates) {
  return updatePartnerState('updatePartnerUserState', stateUpdates);
}

export function updatePartnerAccountState(stateUpdates) {
  return updatePartnerState('updatePartnerAccountState', stateUpdates);
}
