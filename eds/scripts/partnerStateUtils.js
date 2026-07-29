import { getRuntimeActionUrl } from '../blocks/utils/utils.js';
import {
  getCurrentProgramType,
  getPartnerCookieValue,
} from './utils.js';
import { RT_DXP_STATE_MANAGEMENT_PATH } from '../blocks/utils/dxConstants.js';

function getErrorText(body) {
  const { error } = body || {};
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error.error === 'string') return error.error;
  if (typeof error.message === 'string') return error.message;
  return '';
}

function buildStateManagementBody(action, stateUpdates) {
  const body = {
    programType: getCurrentProgramType().toUpperCase(),
    action,
    email: getPartnerCookieValue('email'),
  };

  if (stateUpdates) {
    body.stateUpdates = stateUpdates;
  }

  return body;
}

async function callStateManagement(action, stateUpdates) {
  try {
    const url = getRuntimeActionUrl(RT_DXP_STATE_MANAGEMENT_PATH);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(buildStateManagementBody(action, stateUpdates)),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Partner state update failed, status: ${response.status}`);
      if (response.status === 400 || response.status === 409) {
        return { status: response.status, errorText: getErrorText(body) };
      }
      return { success: false, status: response.status, body };
    }

    return { success: true, status: response.status, body };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Partner state update error', error);
    return { success: false, error };
  }
}

export function updatePartnerUserState(stateUpdates) {
  return callStateManagement('updatePartnerUserState', stateUpdates);
}

export function updatePartnerAccountState(stateUpdates) {
  return callStateManagement('updatePartnerAccountState', stateUpdates);
}

export function refreshPartnerAccountState() {
  return callStateManagement('refreshPartnerAccountState');
}
