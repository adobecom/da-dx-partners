/* eslint-disable */

/**
 * @jest-environment jsdom
 */

import { personalizePlaceholders } from '../../eds/scripts/personalization.js';

describe('Test personalization', () => {
  beforeEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = '';
  });

  afterEach(() => {
    document.cookie = '';
  });

  describe('personalizePlaceholders', () => {
    test('should replace firstName placeholder', () => {
      const cookieObject = {
        DX: {
          firstName: 'John',
          company: 'Adobe',
          level: 'platinum',
          status: 'MEMBER',
        },
      };

      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.body.innerHTML = `<div>Hello $firstName</div>`;
      
      const placeholders = { firstName: '//*[contains(text(), "$firstName")]' };
      personalizePlaceholders(placeholders);
      
      const placeholderElementAfter = document.querySelector('div');
      expect(placeholderElementAfter.textContent.includes(cookieObject.DX.firstName)).toBe(true);
    });

    test('should replace company placeholder', () => {
      const cookieObject = {
        DX: {
          firstName: 'John',
          company: 'Adobe',
          level: 'platinum',
          status: 'MEMBER',
        },
      };

      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.body.innerHTML = `<div>Company: $company</div>`;
      
      const placeholders = { company: '//*[contains(text(), "$company")]' };
      personalizePlaceholders(placeholders);
      
      const placeholderElementAfter = document.querySelector('div');
      expect(placeholderElementAfter.textContent.includes(cookieObject.DX.company)).toBe(true);
    });

    test('should replace level placeholder', () => {
      const cookieObject = {
        DX: {
          firstName: 'John',
          company: 'Adobe',
          level: 'platinum',
          status: 'MEMBER',
        },
      };

      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.body.innerHTML = `<div>Level: $level</div>`;
      
      const placeholders = { level: '//*[contains(text(), "$level")]' };
      personalizePlaceholders(placeholders);
      
      const placeholderElementAfter = document.querySelector('div');
      expect(placeholderElementAfter.textContent.includes(cookieObject.DX.level)).toBe(true);
    });
  });
});
