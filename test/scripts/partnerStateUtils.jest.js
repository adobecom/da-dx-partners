/**
 * @jest-environment jsdom
 */

jest.mock('../../eds/blocks/utils/utils.js', () => ({
  getRuntimeActionUrl: jest.fn((path) => `https://runtime.com${path}`),
}));

import {
  updatePartnerAccountState,
  updatePartnerUserState,
} from '../../eds/scripts/partnerStateUtils.js';

global.fetch = jest.fn();

describe('partnerStateUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
          hostUrl: 'https://partners.stage.adobe.com',
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

    const result = await updatePartnerAccountState({ calendly: 'scheduled' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://runtime.com/api/v1/web/dx-partners-runtime/dxp-state-management',
      expect.objectContaining({
        body: JSON.stringify({
          hostUrl: 'https://partners.stage.adobe.com',
          programType: 'DXP',
          action: 'updatePartnerAccountState',
          email: 'test@adobetest.com',
          stateUpdates: { calendly: 'scheduled' },
        }),
      }),
    );
    expect(result.success).toBe(true);
  });
});
