/**
 * @jest-environment jsdom
 */

import {
  processPrimaryContact,
  processSalesAccess,
  PERSONALIZATION_HIDE,
} from '../../eds/scripts/personalizationUtils.js';
import { getPartnerCookieValue, hasSalesCenterAccess } from '../../eds/scripts/utils.js';

jest.mock('../../eds/scripts/utils.js', () => ({
  getPartnerCookieValue: jest.fn(),
  hasSalesCenterAccess: jest.fn(),
}));

describe('personalizationUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('hides the primary contact element when the user is not primary', () => {
    getPartnerCookieValue.mockReturnValue(false);
    const element = document.createElement('div');
    element.textContent = 'Primary contact';
    document.body.appendChild(element);

    processPrimaryContact(element);

    expect(element.classList.contains(PERSONALIZATION_HIDE)).toBe(true);
    expect(document.body.firstElementChild).toBe(element);
  });

  it('replaces the primary contact element for a primary user', () => {
    getPartnerCookieValue.mockReturnValue(true);
    const element = document.createElement('div');
    element.textContent = 'Primary contact';
    document.body.appendChild(element);

    processPrimaryContact(element);

    const wrapper = document.querySelector('.primary-contact-wrapper');
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelector('p').textContent).toBe('Primary contact');
    expect(element.isConnected).toBe(false);
  });

  it('hides the parent when sales center access is unavailable', () => {
    hasSalesCenterAccess.mockReturnValue(false);
    const parent = document.createElement('div');
    const element = document.createElement('a');
    parent.appendChild(element);
    document.body.appendChild(parent);

    processSalesAccess(element);

    expect(parent.classList.contains(PERSONALIZATION_HIDE)).toBe(true);
  });

  it('leaves the parent unchanged when sales center access is available', () => {
    hasSalesCenterAccess.mockReturnValue(true);
    const parent = document.createElement('div');
    const element = document.createElement('a');
    parent.appendChild(element);
    document.body.appendChild(parent);

    processSalesAccess(element);

    expect(parent.classList.contains(PERSONALIZATION_HIDE)).toBe(false);
  });
});
