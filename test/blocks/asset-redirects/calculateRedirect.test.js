import { expect } from '@esm-bundle/chai';
import { calculateRedirect } from '../../../eds/blocks/asset-redirects/calculateRedirect.js';

describe('calculateRedirect', () => {
  const baseOrigin = 'https://partners.stage.adobe.com';
  const previewPath = '/digitalexperience/preview/';

  it('should return redirect URL when current path matches original URL', () => {
    const currentAssetPath = `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`;
    const redirectRules = [
      [
        `https://partners.adobe.com${previewPath}restricted/1/program-guide.pdf.html`,
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
    ];

    const result = calculateRedirect(currentAssetPath, redirectRules);

    expect(result.hasLoop).to.be.false;
    expect(result.redirectUrl).to.equal(
      `${baseOrigin}${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`
    );
  });

  it('should return null redirect URL when current path does not match any rule', () => {
    const currentAssetPath = `${baseOrigin}${previewPath}restricted/999/nonexistent.pdf.html`;
    const redirectRules = [
      [
        `https://partners.adobe.com${previewPath}restricted/1/program-guide.pdf.html`,
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
    ];

    const result = calculateRedirect(currentAssetPath, redirectRules);

    expect(result.hasLoop).to.be.false;
    expect(result.redirectUrl).to.be.null;
  });

  it('should detect redirect loops', () => {
    const currentAssetPath = `${baseOrigin}${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`;
    const redirectRules = [
      [
        `https://partners.adobe.com${previewPath}restricted/1/program-guide.pdf.html`,
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
      [
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`,
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
    ];

    const result = calculateRedirect(currentAssetPath, redirectRules);

    expect(result.hasLoop).to.be.true;
    expect(result.redirectUrl).to.be.null;
  });

  it('should handle relative URLs', () => {
    const currentAssetPath = `${baseOrigin}${previewPath}netstorage-assets/restricted/co/content-supply-chain-automotive.pptx.html`;
    const redirectRules = [
      [
        `${previewPath}netstorage-assets/restricted/co/content-supply-chain-automotive.pptx.html`,
        `${previewPath}restricted/1/program-guide.pdf.html`,
      ],
    ];

    const result = calculateRedirect(currentAssetPath, redirectRules);

    expect(result.hasLoop).to.be.false;
    expect(result.redirectUrl).to.equal(
      `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`
    );
  });

  it('should skip empty rules', () => {
    const currentAssetPath = `${baseOrigin}${previewPath}restricted/in/1/Retail_Banking_Industry_POV.pptx.html`;
    const redirectRules = [
      ['', `https://partners.adobe.com${previewPath}restricted/in/1/Retail_Banking_Industry_POV.pptx.html`],
      [
        `https://partners.adobe.com${previewPath}restricted/in/1/credit-union-industry-pov.pptx.html`,
        `https://partners.adobe.com${previewPath}restricted/in/1/unique.pptx.html`,
      ],
    ];

    const result = calculateRedirect(currentAssetPath, redirectRules);

    expect(result.hasLoop).to.be.false;
    expect(result.redirectUrl).to.be.null; // First rule is skipped, second doesn't match
  });

  it('when more than one rule defined per domain, last defined will be used ', () => {
    const currentAssetPath = `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`;
    const redirectRules = [
      [
        `https://partners.adobe.com${previewPath}restricted/1/program-guide.pdf.html`,
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
      [
        `https://partners.adobe.com${previewPath}restricted/1/program-guide.pdf.html`,
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`,
      ],
    ];

    const result = calculateRedirect(currentAssetPath, redirectRules);

    expect(result.hasLoop).to.be.false;
    // Should return the first matching redirect
    expect(result.redirectUrl).to.equal(
      `${baseOrigin}${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`
    );
  });
});
