import { expect } from '@esm-bundle/chai';
import { processPrimaryContact, processSalesAccess, PERSONALIZATION_HIDE } from '../../eds/scripts/personalizationUtils.js';

describe('personalizationUtils', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('replaces a primary contact placeholder', () => {
    document.cookie = 'partner_data={"DXP":{"primaryContact":true}}';
    const element = document.createElement('div');
    element.textContent = 'Primary contact';
    document.body.appendChild(element);

    processPrimaryContact(element);

    expect(document.querySelector('.primary-contact-wrapper')).to.exist;
  });

  it('hides the parent when sales access is unavailable', () => {
    document.cookie = 'partner_data={"DXP":{"salesCenterAccess":false}}';
    const parent = document.createElement('div');
    const element = document.createElement('a');
    parent.appendChild(element);
    document.body.appendChild(parent);

    processSalesAccess(element);

    expect(parent.classList.contains(PERSONALIZATION_HIDE)).to.equal(true);
  });
});
