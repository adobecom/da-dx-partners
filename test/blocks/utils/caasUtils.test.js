import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../eds/scripts/utils.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
  },
  miloLibs,
  pathname: '/de/partners',
});

const { extractFilterData, rollingHash } = await import('../../../eds/blocks/utils/caasUtils.js');

const caasTags = {
  namespaces: {
    caas: {
      tags: {
        product: {
          tagID: 'caas:product',
          title: 'Product',
          'title.de': 'Produkt &amp; Dienste',
          tags: {
            'analytics-&-reporting': {
              tagID: 'caas:product/analytics-&-reporting',
              title: 'Analytics &amp; Reporting',
              'title.de': 'Analyse &amp; Reporting',
            },
            target: {
              tagID: 'caas:product/target',
              title: 'Target',
              'title.de': 'Ziel',
            },
          },
        },
        audience: {
          tagID: 'caas:audience',
          title: 'Audience',
          tags: {},
        },
      },
    },
  },
};

describe('caasUtils', () => {
  describe('rollingHash', () => {
    it('returns an empty string for missing input', () => {
      expect(rollingHash()).to.equal('');
      expect(rollingHash('')).to.equal('');
    });

    it('returns a stable base36 hash with configurable length', () => {
      expect(rollingHash('caas:product')).to.equal('ct1r');
      expect(rollingHash('caas:product', 4)).to.not.equal(rollingHash('caas:product'));
      expect(rollingHash('caas:product', 4)).to.match(/^[0-9a-z]+$/);
    });
  });

  describe('extractFilterData', () => {
    it('extracts localized parent and child tag data', () => {
      const result = extractFilterData('caas:product', caasTags);

      expect(result).to.deep.equal({
        key: 'product',
        value: 'Produkt & Dienste',
        tags: [
          {
            key: 'analytics-and-reporting',
            parentKey: 'product',
            checked: false,
            value: 'Analyse & Reporting',
            hash: `${rollingHash('caas:product')}/${rollingHash('analytics-&-reporting')}`,
          },
          {
            key: 'target',
            parentKey: 'product',
            checked: false,
            value: 'Ziel',
            hash: `${rollingHash('caas:product')}/${rollingHash('target')}`,
          },
        ],
      });
    });

    it('falls back to default titles when localized titles are unavailable', () => {
      const result = extractFilterData('caas:audience', caasTags);

      expect(result).to.deep.equal({
        key: 'audience',
        value: 'Audience',
        tags: [],
      });
    });

    it('returns null when a tag path cannot be resolved', () => {
      expect(extractFilterData('caas:product/missing', caasTags)).to.equal(null);
      expect(extractFilterData('caas:missing', caasTags)).to.equal(null);
    });
  });
});
