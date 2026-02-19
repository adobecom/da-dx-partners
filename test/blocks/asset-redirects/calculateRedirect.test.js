import { expect } from '@esm-bundle/chai';
import { calculateRedirect } from '../../../eds/blocks/asset-redirects/calculateRedirect.js';

function setWindowLocation(pathname) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  window.history.replaceState({}, '', pathname);
}

describe('calculateRedirect', () => {
  const baseOrigin = 'http://localhost:2000';
  const previewPath = '/digitalexperience/preview/';

  it('should return redirect URL when current path matches original URL', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`);
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/program-guide.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
    ];

    const result = calculateRedirect(redirectRules);
    expect(result.toString()).to.equal(
      `${baseOrigin}${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`
    );
  });

  it('should return null redirect URL when current path does not match any rule', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/999/nonexistent.pdf.html`);
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/program-guide.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
    ];

    const result = calculateRedirect(redirectRules);

    expect(result).to.be.null;
  });

  it('should detect redirect loops', () => {
    const currentAssetPath = `${baseOrigin}${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`;
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/program-guide.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
      [
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
    ];

    const result = calculateRedirect(currentAssetPath, redirectRules);

    expect(result).to.be.null;
  });

  it('should handle relative URLs', () => {
    setWindowLocation(`${baseOrigin}${previewPath}netstorage-assets/restricted/co/content-supply-chain-automotive.pptx.html`);
    const redirectRules = [
      [
        `${previewPath}netstorage-assets/restricted/co/content-supply-chain-automotive.pptx.html`,
        `${previewPath}restricted/1/program-guide.pdf.html`,
      ],
    ];

    const result = calculateRedirect(redirectRules);

    expect(result.toString()).to.equal(
      `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`
    );
  });

  it('should skip empty rules', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/in/1/Retail_Banking_Industry_POV.pptx.html`);
    const redirectRules = [
      ['', `http://localhost:2000${previewPath}restricted/in/1/Retail_Banking_Industry_POV.pptx.html`],
      [
        `http://localhost:2000${previewPath}restricted/in/1/credit-union-industry-pov.pptx.html`,
        `http://localhost:2000${previewPath}restricted/in/1/unique.pptx.html`,
      ],
    ];

    const result = calculateRedirect(redirectRules);

    expect(result).to.be.null; // First rule is skipped, second doesn't match
  });

  it('when more than one rule defined per domain, first defined will be used ', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`);
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/program-guide.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`,
      ],
      [
        `http://localhost:2000${previewPath}restricted/1/program-guide.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
    ];

    const result = calculateRedirect(redirectRules);
    // Should return the first matching redirect
    expect(result.toString()).to.equal(
      `${baseOrigin}${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`
    );
  });

  it('test redirect cross domain', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`);
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/nomatch.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
      [
        `http://localhost:2000${previewPath}restricted/1/program-guide.pdf.html`,
        `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`,
      ],
    ];

    const result = calculateRedirect(redirectRules);
    // Should return the first matching redirect
    expect(result.toString()).to.equal(
      `https://partners.adobe.com${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html`
    );
  });

  it('test redirect with params and hash from relative URL', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html?everything=true&nothing=false#evenwithahash`);
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/nomatch.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
      [
        `${previewPath}restricted/1/program-guide.pdf.html?everything=false&nothing=true`,
        `${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html?redirectWithparam=true`,
      ],
    ];

    const result = calculateRedirect(redirectRules);
    // Should return the first matching redirect
    expect(result.toString()).to.equal(
      `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-content-supply-chain-ai-world-portfolio-deepdive.mp4.html?redirectWithparam=true`
    );
  });


  it('test simple redirect loop', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`);
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/nomatch.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
      [
        `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`,
        `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html`,
      ],
    ];

    const result = calculateRedirect(redirectRules);
    // Should return the first matching redirect
    expect(result).to.be.null;
  });


  it('test redirect loop from relative URL', () => {
    setWindowLocation(`${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html?everything=true&nothing=false#evenwithahash`);
    const redirectRules = [
      [
        `http://localhost:2000${previewPath}restricted/1/nomatch.pdf.html`,
        `http://localhost:2000${previewPath}netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html`,
      ],
      [
        `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html?everything=false&nothing=true`,
        `${baseOrigin}${previewPath}restricted/1/program-guide.pdf.html?redirectWithparam=true`,
      ],
    ];

    const result = calculateRedirect(redirectRules);
    // Should return the first matching redirect
    expect(result).to.be.null;
  });


});
