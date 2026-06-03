import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';
import AssetPreview from '../../../eds/blocks/asset-preview/AssetPreview.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } }, miloLibs });

function makeInstance() {
  const el = new AssetPreview();
  el.blockData = {
    localizedText: { '{{Download}}': 'Download', '{{View}}': 'View' },
    tableData: [],
    pdfEmbedMode: '',
  };
  el.fileFormatTags = [];
  el.pdfPreviewUrl = '';
  el.url = '';
  el.webinarPresentation = '';
  return el;
}

describe('asset-preview block', () => {
  beforeEach(async () => {
    sinon.stub(window, 'fetch').resolves({ ok: false, json: async () => ({ data: [] }) });
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
  });

  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('replaces block with asset-preview custom element', async () => {
    const { default: init } = await import('../../../eds/blocks/asset-preview/asset-preview.js');
    const block = document.querySelector('.asset-preview');
    block.parentNode.setAttribute('data-idx', '0');
    const app = await init(block);
    expect(app.tagName.toLowerCase()).to.equal('asset-preview');
    expect(app.className).to.include('asset-preview-block');
  });

  it('sets data-idx attribute from parent section', async () => {
    const { default: init } = await import('../../../eds/blocks/asset-preview/asset-preview.js');
    const block = document.querySelector('.asset-preview');
    block.parentNode.setAttribute('data-idx', '3');
    const app = await init(block);
    expect(app.getAttribute('data-idx')).to.equal('3');
  });

  it('passes default localized text to blockData', async () => {
    const { default: init } = await import('../../../eds/blocks/asset-preview/asset-preview.js');
    const block = document.querySelector('.asset-preview');
    block.parentNode.setAttribute('data-idx', '0');
    const app = await init(block);
    expect(app.blockData.localizedText['{{Download}}']).to.be.a('string');
    expect(app.blockData.localizedText['{{View}}']).to.be.a('string');
  });
});

describe('AssetPreview - updated()', () => {
  afterEach(() => sinon.restore());

  it('calls loadPdfViewer when pdfPreviewUrl changes to a truthy value', () => {
    const el = makeInstance();
    const stub = sinon.stub(el, 'loadPdfViewer');
    el.pdfPreviewUrl = 'https://example.com/file.pdf';
    el.updated(new Map([['pdfPreviewUrl', '']]));
    expect(stub.calledOnce).to.be.true;
  });

  it('does not call loadPdfViewer when pdfPreviewUrl is empty', () => {
    const el = makeInstance();
    const stub = sinon.stub(el, 'loadPdfViewer');
    el.pdfPreviewUrl = '';
    el.updated(new Map([['pdfPreviewUrl', 'old-value']]));
    expect(stub.called).to.be.false;
  });

  it('does not call loadPdfViewer when pdfPreviewUrl is not in changedProperties', () => {
    const el = makeInstance();
    const stub = sinon.stub(el, 'loadPdfViewer');
    el.pdfPreviewUrl = 'https://example.com/file.pdf';
    el.updated(new Map([['title', '']]));
    expect(stub.called).to.be.false;
  });
});

describe('AssetPreview - loadPdfViewer()', () => {
  afterEach(() => sinon.restore());

  it('resets pdfPreviewUrl to empty string on error', async () => {
    const el = makeInstance();
    el.pdfPreviewUrl = 'https://example.com/file.pdf';
    el.title = 'Test Asset';
    sinon.stub(window, 'fetch').rejects(new Error('mock sdk error'));

    await el.loadPdfViewer();

    expect(el.pdfPreviewUrl).to.equal('');
  });

  it('logs error message on failure', async () => {
    const el = makeInstance();
    el.pdfPreviewUrl = 'https://example.com/file.pdf';
    el.title = 'Test Asset';
    sinon.stub(window, 'fetch').rejects(new Error('sdk failed'));
    const consoleStub = sinon.stub(console, 'log');

    await el.loadPdfViewer();

    expect(consoleStub.calledWithMatch('PDF viewer failed to load')).to.be.true;
  });
});

describe('AssetPreview - setData() pdfPreviewUrl', () => {
  afterEach(() => sinon.restore());

  it('sets pdfPreviewUrl from assetMetadata', async () => {
    const el = makeInstance();
    sinon.stub(el, 'loadPdfViewer');
    await el.setData({
      title: 'Test',
      url: 'https://example.com/file.pdf',
      pdfPreviewUrl: 'https://example.com/rendition.pdf',
      tags: [],
    });
    expect(el.pdfPreviewUrl).to.equal('https://example.com/rendition.pdf');
  });

  it('defaults pdfEmbedMode to sized-container when not set', async () => {
    const el = makeInstance();
    sinon.stub(el, 'loadPdfViewer');
    await el.setData({ title: 'Test', url: 'https://example.com/file.pdf', tags: [] });
    expect(el.blockData.pdfEmbedMode).to.equal('sized-container');
  });

  it('keeps existing pdfEmbedMode when already set in blockData', async () => {
    const el = makeInstance();
    el.blockData.pdfEmbedMode = 'sized-container';
    sinon.stub(el, 'loadPdfViewer');
    await el.setData({ title: 'Test', url: 'https://example.com/file.pdf', tags: [] });
    expect(el.blockData.pdfEmbedMode).to.equal('sized-container');
  });
});

describe('AssetPreview - utility methods', () => {
  afterEach(() => sinon.restore());

  it('isPreviewEnabled returns true for PDF', () => {
    expect(makeInstance().isPreviewEnabled('PDF')).to.be.true;
  });

  it('isPreviewEnabled returns false for non-PDF', () => {
    expect(makeInstance().isPreviewEnabled('Video')).to.be.false;
  });

  it('getDownloadUrl returns url when set', () => {
    const el = makeInstance();
    el.url = 'https://example.com/file.pdf';
    expect(el.getDownloadUrl()).to.equal('https://example.com/file.pdf');
  });

  it('getDownloadUrl returns # when url is empty', () => {
    expect(makeInstance().getDownloadUrl()).to.equal('#');
  });

  it('getWebinarPresentationDownloadUrl returns webinarPresentation when set', () => {
    const el = makeInstance();
    el.webinarPresentation = 'https://example.com/webinar.pdf';
    expect(el.getWebinarPresentationDownloadUrl()).to.equal('https://example.com/webinar.pdf');
  });

  it('getWebinarPresentationDownloadUrl returns # when not set', () => {
    expect(makeInstance().getWebinarPresentationDownloadUrl()).to.equal('#');
  });

  it('isRestrictedAssetForUser returns false when no partner level', () => {
    const el = makeInstance();
    el.assetPartnerLevel = [];
    expect(el.isRestrictedAssetForUser()).to.be.false;
  });

  it('isRestrictedAssetForUser returns false for public asset', () => {
    const el = makeInstance();
    el.assetPartnerLevel = ['public'];
    expect(el.isRestrictedAssetForUser()).to.be.false;
  });

  it('isRestrictedAssetForUser returns true for restricted asset', () => {
    const el = makeInstance();
    el.assetPartnerLevel = ['gold'];
    expect(el.isRestrictedAssetForUser()).to.be.true;
  });

  it('getTagsTitlesString joins tag titles with comma', () => {
    const el = makeInstance();
    const result = el.getTagsTitlesString([{ title: 'Adobe' }, { title: 'Analytics' }]);
    expect(result).to.equal('Adobe, Analytics');
  });

  it('getTagsTitlesString returns undefined for empty array', () => {
    expect(makeInstance().getTagsTitlesString([])).to.equal('');
  });

  it('getLabelBasedOnFileExtension returns correct label for pdf', () => {
    const el = makeInstance();
    expect(el.getLabelBasedOnFileExtension('https://example.com/file.pdf')).to.equal('Download PDF');
  });

  it('getLabelBasedOnFileExtension returns Download for unknown extension', () => {
    const el = makeInstance();
    expect(el.getLabelBasedOnFileExtension('https://example.com/file.xyz')).to.equal('Download');
  });

  it('getLabelBasedOnFileExtension returns Download for invalid url', () => {
    expect(makeInstance().getLabelBasedOnFileExtension('not-a-url')).to.equal('Download');
  });

  it('get _video returns video element from DOM', () => {
    const video = document.createElement('video');
    document.body.appendChild(video);
    expect(makeInstance()._video).to.equal(video);
    document.body.removeChild(video);
  });

  it('_handleImgError sets fallback image src', () => {
    const el = makeInstance();
    const img = document.createElement('img');
    document.body.appendChild(img);
    el._handleImgError({ currentTarget: img });
    expect(img.src).to.include('sample-default.png');
    document.body.removeChild(img);
  });
});
