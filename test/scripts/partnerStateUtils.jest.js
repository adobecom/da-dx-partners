/**
 * @jest-environment jsdom
 */

import {
  refreshPartnerAccountState,
  updatePartnerAccountState,
  updatePartnerUserState,
} from '../../eds/scripts/partnerStateUtils.js';

jest.mock('../../eds/blocks/utils/utils.js', () => ({ getRuntimeActionUrl: jest.fn((path) => `https://runtime.com${path}`) }));

global.fetch = jest.fn();

describe('partnerStateUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
    document.cookie = 'partner_data={"DXP":{"email":"test@adobetest.com","status":"MEMBER"}}';
    window.history.pushState({}, '', '/digitalexperience/');
  });

  it('updates partner user state via runtime action', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    });

    const result = await updatePartnerUserState({ test: 'updated' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://runtime.com/api/v1/web/dx-partners-runtime/dxp-state-management',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          programType: 'DXP',
          action: 'updatePartnerUserState',
          email: 'test@adobetest.com',
          stateUpdates: { test: 'updated' },
        }),
      }),
    );
    expect(result.success).toBe(true);
  });

  it('updates partner account state via runtime action', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    });

    const result = await updatePartnerAccountState({ calendly: 'event-id' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://runtime.com/api/v1/web/dx-partners-runtime/dxp-state-management',
      expect.objectContaining({
        body: JSON.stringify({
          programType: 'DXP',
          action: 'updatePartnerAccountState',
          email: 'test@adobetest.com',
          stateUpdates: { calendly: 'event-id' },
        }),
      }),
    );
    expect(result.success).toBe(true);
  });

  it('returns status and errorText on 400', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request' }),
    });

    const result = await updatePartnerAccountState({ calendly: 'event-id' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 400,
      errorText: 'Bad request',
    });
  });

  it('returns status and errorText on 409', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: { error: 'dxpAccountState is not fresh' } }),
    });

    const result = await updatePartnerAccountState({ calendly: 'event-id' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 409,
      errorText: 'dxpAccountState is not fresh',
    });
  });

  it('refreshes partner account state cookie via runtime action', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    });

    const result = await refreshPartnerAccountState();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://runtime.com/api/v1/web/dx-partners-runtime/dxp-state-management',
      expect.objectContaining({
        body: JSON.stringify({
          programType: 'DXP',
          action: 'refreshPartnerAccountState',
          email: 'test@adobetest.com',
        }),
      }),
    );
    expect(result.success).toBe(true);
  });
});
