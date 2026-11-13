import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { CAAS_TAGS_URL, setLibs } from '../../../eds/scripts/utils.js';
import AssetPreview from '../../../eds/blocks/asset-preview/AssetPreview.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
const { render } = await import(`${miloLibs}/deps/lit-all.min.js`);
setConfig({ locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } }, miloLibs });

const mockPreviewImage = new URL('/eds/img/icons/star.svg', window.location.origin).href;

function makeInstance() {
  const el = new AssetPreview();
  el.blockData = {
    localizedText: { '{{Download}}': 'Download', '{{View}}': 'View' },
    tableData: [],
    pdfEmbedMode: '',
  };
  el.fileFormatTags = [];
  el.pdfPreviewUrl = '';
  el.previewImage = mockPreviewImage;
  el.url = '';
  el.webinarPresentation = '';
  el.chapters = [
    {
      title: 'Welcome And Speaker Introductions',
      summary: 'Welcome and introductions.',
      timerange: '00:00:01.001 - 00:01:31.625',
    },
    {
      title: 'Agenda And Session Goals',
      summary: 'Session agenda and goals.',
      timerange: '00:01:31.625 - 00:02:22.906',
    },
    {
      title: 'Why Partners Should Be Excited',
      summary: 'Partner opportunities.',
      timerange: '00:02:22.906 - 00:05:22.223',
    },
    {
      title: 'Market Headwinds And Loyalty Importance',
      summary: 'Market trends.',
      timerange: '00:05:22.959 - 00:07:12.258',
    },
  ];
  return el;
}

describe('asset-preview block', () => {
  beforeEach(async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({ ok: false, json: async () => ({ data: [] }) });
    fetchStub.withArgs(CAAS_TAGS_URL).resolves({
      ok: true,
      status: 200,
      json: async () => ({ namespaces: { caas: { tags: {} } } }),
    });
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

  it('keeps authored fragment links in the replacement component', async () => {
    const { default: init } = await import('../../../eds/blocks/asset-preview/asset-preview.js');
    const block = document.querySelector('.asset-preview');
    const fragmentLink = block.querySelector('a[href="/fragments/restricted-fragment"]');
    block.parentNode.setAttribute('data-idx', '0');

    const app = await init(block);

    expect(app.querySelector('a[href="/fragments/restricted-fragment"]')).to.equal(fragmentLink);
  });
});

describe('AssetPreview - connectedCallback() errors', () => {
  afterEach(() => sinon.restore());

  it('logs a failed tags response and continues loading asset metadata', async () => {
    const el = makeInstance();
    const fetchStub = sinon.stub(window, 'fetch').resolves({ ok: false, status: 503 });
    const consoleStub = sinon.stub(console, 'log');
    const metadataStub = sinon.stub(el, 'getAssetMetadata').resolves();

    await el.connectedCallback();

    expect(fetchStub.calledOnceWithExactly(CAAS_TAGS_URL)).to.be.true;
    expect(consoleStub.calledOnce).to.be.true;
    expect(consoleStub.firstCall.args[0]).to.equal('error');
    expect(consoleStub.firstCall.args[1]).to.be.instanceOf(Error);
    expect(consoleStub.firstCall.args[1].message).to.equal('Get caas tags HTTP error! Status: 503');
    expect(metadataStub.calledOnce).to.be.true;
    expect(el.allCaaSTags).to.deep.equal([]);
    el.disconnectedCallback();
  });

  it('logs a rejected tags request and continues loading asset metadata', async () => {
    const el = makeInstance();
    const error = new Error('Tags unavailable');
    sinon.stub(window, 'fetch').rejects(error);
    const consoleStub = sinon.stub(console, 'log');
    const metadataStub = sinon.stub(el, 'getAssetMetadata').resolves();

    await el.connectedCallback();

    expect(consoleStub.calledOnceWithExactly('error', error)).to.be.true;
    expect(metadataStub.calledOnce).to.be.true;
    el.disconnectedCallback();
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
    const consoleStub = sinon.stub(console, 'log');

    await el.loadPdfViewer();

    expect(el.pdfPreviewUrl).to.equal('');
    expect(consoleStub.calledOnceWithExactly('PDF viewer failed to load, falling back to preview image: mock sdk error')).to.be.true;
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

  it('clears the preview URL when the HEAD response is not a PDF', async () => {
    const el = makeInstance();
    el.pdfPreviewUrl = 'https://example.com/file.pdf';
    sinon.stub(window, 'fetch').resolves({
      ok: true,
      headers: { get: () => 'text/html' },
    });

    await el.loadPdfViewer();

    expect(el.pdfPreviewUrl).to.equal('');
  });

  it('clears the preview URL when the HEAD response is not ok', async () => {
    const el = makeInstance();
    el.pdfPreviewUrl = 'https://example.com/file.pdf';
    sinon.stub(window, 'fetch').resolves({
      ok: false,
      headers: { get: () => 'application/pdf' },
    });

    await el.loadPdfViewer();

    expect(el.pdfPreviewUrl).to.equal('');
  });

  describe('AEM client id', () => {
    let viewStub;
    let savedAdobeDC;

    beforeEach(() => {
      savedAdobeDC = window.AdobeDC;
      viewStub = sinon.stub().returns({ previewFile: sinon.stub() });
      window.AdobeDC = { View: viewStub };
      setConfig({ pdfViewerClientId: 'config-client-id' });
      sinon.stub(window, 'fetch').resolves({
        ok: true,
        headers: { get: () => 'application/pdf' },
      });
    });

    afterEach(() => {
      window.AdobeDC = savedAdobeDC;
      document.head.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.remove());
    });

    const load = async (isAEM) => {
      const el = makeInstance();
      el.blockData.isAEM = isAEM;
      el.pdfPreviewUrl = 'https://example.com/file.pdf';
      el.title = 'Test Asset';
      await el.loadPdfViewer();
    };

    it('uses the config client id when isAEM is false', async () => {
      await load(false);

      expect(viewStub.firstCall.args[0].clientId).to.equal('config-client-id');
    });

    it('uses the config client id when isAEM is not set', async () => {
      await load(undefined);

      expect(viewStub.firstCall.args[0].clientId).to.equal('config-client-id');
    });

    it('falls back to the config client id when the AEM host is not mapped', async () => {
      await load(true);

      expect(window.location.hostname).to.equal('localhost');
      expect(viewStub.firstCall.args[0].clientId).to.equal('config-client-id');
    });
  });
});

describe('AssetPreview - getAssetMetadata()', () => {
  afterEach(() => sinon.restore());

  it('sets data and clears loading after a successful metadata response', async () => {
    const el = makeInstance();
    el.getRealAssetUrl = () => new URL('https://partners.stage.adobe.com/asset.json');
    const setDataStub = sinon.stub(el, 'setData').resolves();
    sinon.stub(window, 'fetch').resolves({
      status: 200,
      json: async () => ({ title: 'Asset' }),
    });

    await el.getAssetMetadata();

    expect(setDataStub.calledOnce).to.be.true;
    expect(el.isLoading).to.be.false;
  });

  it('clears loading when metadata fetching fails', async () => {
    const el = makeInstance();
    el.getRealAssetUrl = () => new URL('https://partners.stage.adobe.com/asset.json');
    const error = new Error('metadata unavailable');
    sinon.stub(window, 'fetch').rejects(error);
    const consoleStub = sinon.stub(console, 'log');

    await el.getAssetMetadata();

    expect(el.isLoading).to.be.false;
    expect(consoleStub.calledOnceWithExactly('Error on fetch of asset https://partners.stage.adobe.com/asset.json :', error)).to.be.true;
  });

  it('does not fetch metadata when no real asset URL can be built', async () => {
    const el = makeInstance();
    el.getRealAssetUrl = () => null;
    const fetchStub = sinon.stub(window, 'fetch');

    await el.getAssetMetadata();

    expect(fetchStub.called).to.be.false;
  });

  it('fetches metadata without chapter parameters and preserves chapters for the player', async () => {
    const originalUrl = window.location.href;
    try {
      window.history.replaceState(null, '', '/digitalexperience/preview/video.html?chapter=2&t=35');
      const el = new AssetPreview();
      el.blockData = {};
      const chapters = [
        { title: 'First', summary: 'First summary', timerange: '00:00:00.000 - 00:00:30.000' },
        { title: 'Second', summary: 'Second summary', timerange: '00:00:30.000 - 00:01:00.000' },
      ];
      const fetchStub = sinon.stub(window, 'fetch').resolves({
        status: 200,
        json: async () => ({ title: 'Video', url: 'https://example.com/video.mp4', chapters }),
      });

      expect(el.chapters).to.deep.equal([]);
      await el.getAssetMetadata();

      const metadataUrl = fetchStub.firstCall.args[0];
      expect(metadataUrl.pathname).to.equal('/digitalexperience-assets/preview/video/_jcr_content/metadata.assetmetadata.json');
      expect(metadataUrl.search).to.equal('');
      expect(window.location.search).to.equal('?chapter=2&t=35');
      expect(el.chapters).to.deep.equal(chapters);
      expect(el.isLoading).to.be.false;
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
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
  it('uses the connected PDF as the preview for video assets', async () => {
    const el = makeInstance();
    const loadPdfViewerStub = sinon.stub(el, 'loadPdfViewer');
    el.allCaaSTags = {
      namespaces: {
        caas: {
          tags: {
            'file-format': {
              tags: {video: { tagId: 'caas:file-format/video', title: 'Video' },
              },
            },
          },
        },
      },
    };
    el.assetPartnerLevel = ['public'];
    await el.setData({
      title: 'Webinar Video',
      url: 'https://example.com/video.mp4',
      webinarPresentation: 'https://example.com/connected-presentation.pdf',
      tags: ['caas:file-format/video'],
    });

    expect(el.isVideo).to.be.true;
    expect(el.webinarPresentation).to.equal('https://example.com/connected-presentation.pdf');
    expect(el.pdfPreviewUrl).to.equal('https://example.com/connected-presentation.pdf');
    el.assetPartnerLevel = ['public'];
    el.updated(new Map([['pdfPreviewUrl', '']]));
    expect(loadPdfViewerStub.calledOnce).to.be.true;
  });

  it('renders the thumbnail when the user is restricted', () => {
    const el = makeInstance();
    el.assetHasData = true;
    el.isLoading = false;
    el.assetPartnerLevel = ['partner'];
    el.pdfPreviewUrl = 'https://example.com/connected-presentation.pdf';
    el.isVideo = true;
    el.previewImage = 'https://example.com/preview.jpg';

    const container = document.createElement('div');
    render(el.render(), container);

    expect(container.querySelector('#adobe-dc-view')).to.equal(null);
    expect(container.querySelector('img')).to.exist;
  });
  it('defaults pdfEmbedMode to full-window when not set', async () => {
    const el = makeInstance();
    sinon.stub(el, 'loadPdfViewer');
    await el.setData({ title: 'Test', url: 'https://example.com/file.pdf', tags: [] });
    expect(el.blockData.pdfEmbedMode).to.equal('full-window');
  });

  it('keeps existing pdfEmbedMode when already set in blockData', async () => {
    const el = makeInstance();
    el.blockData.pdfEmbedMode = 'full-window';
    sinon.stub(el, 'loadPdfViewer');
    await el.setData({ title: 'Test', url: 'https://example.com/file.pdf', tags: [] });
    expect(el.blockData.pdfEmbedMode).to.equal('full-window');
  });

  it('falls back from missing summary to description and marks complete data', async () => {
    const el = makeInstance();
    await el.setData({
      title: 'Test',
      description: 'Description',
      url: 'https://example.com/file.pdf',
      size: 1000000,
      createdDate: '2025-01-15T00:00:00.000Z',
      partnerLevel: ['Gold'],
      tags: [],
    });

    expect(el.summary).to.equal('Description');
    expect(el.size).to.equal('1.0 MB');
    expect(el.createdDate).to.equal('1/15/2025');
    expect(el.assetPartnerLevel).to.deep.equal(['gold']);
    expect(el.assetHasData).to.be.true;
  });

  it('marks data incomplete when title or URL is missing', async () => {
    const el = makeInstance();
    await el.setData({ title: '', url: '', tags: [] });

    expect(el.assetHasData).to.be.false;
  });
});

describe('AssetPreview - render() metadata details', () => {
  [
    {
      property: 'createdDate',
      localizationKey: '{{Date}}',
      label: 'Published on',
      value: '1/15/2025',
      text: '1/15/2025',
      emptyValues: [undefined, null, ''],
    },
    {
      property: 'audienceTags',
      localizationKey: '{{Audience}}',
      label: 'For',
      value: [{ title: '<strong>Partners</strong>' }, { title: 'Developers' }],
      text: 'Partners, Developers',
      markupSelector: 'strong',
      emptyValues: [undefined, [], [{ title: '' }]],
    },
    {
      property: 'summary',
      localizationKey: '{{Summary}}',
      label: 'Overview',
      value: '<em>Asset summary</em>',
      text: 'Asset summary',
      markupSelector: 'em',
      emptyValues: [undefined, null, ''],
    },
  ].forEach((detail) => {
    let el;
    let container;

    beforeEach(() => {
      el = makeInstance();
      el.assetHasData = true;
      el.isLoading = false;
      el.blockData.localizedText[detail.localizationKey] = detail.label;
      container = document.createElement('div');
    });

    it(`renders ${detail.property} with its localized label when present`, () => {
      el[detail.property] = detail.value;
      render(el.render(), container);

      const rows = container.querySelectorAll('.asset-preview-block-details-left > p');
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].querySelector('.asset-preview-block-details-left-label').textContent.trim())
        .to.equal(`${detail.label}:`);
      expect(rows[0].textContent.replace(/\s+/g, ' ').trim())
        .to.equal(`${detail.label}: ${detail.text}`);
      if (detail.markupSelector) {
        expect(rows[0].querySelector(detail.markupSelector)).to.exist;
      }
    });

    it(`omits ${detail.property} and its label when empty`, () => {
      detail.emptyValues.forEach((value) => {
        el[detail.property] = value;
        render(el.render(), container);

        expect(container.querySelector('.asset-preview-block-details-left')).to.exist;
        expect(container.querySelectorAll('.asset-preview-block-details-left > p'))
          .to.have.lengthOf(0);
        expect(container.textContent).not.to.include(`${detail.label}:`);
      });
    });
  });
});

describe('AssetPreview - setData() chapters', () => {
  it('starts without chapters before metadata arrives', () => {
    expect(new AssetPreview().chapters).to.deep.equal([]);
  });

  it('passes chapter metadata and video properties to the player', async () => {
    const el = makeInstance();
    const chapters = [{
      title: 'API chapter',
      summary: 'API summary',
      timerange: '00:00:10.000 - 00:00:20.000',
    }];
    await el.setData({
      title: 'Test',
      url: 'https://example.com/video.mp4',
      previewImage: mockPreviewImage,
      chapters,
    });
    expect(el.chapters).to.deep.equal(chapters);
    el.isVideo = true;
    el.isLoading = false;
    el.fileType = 'video/mp4';

    const container = document.createElement('div');
    render(el.render(), container);
    const player = container.querySelector('asset-video-player');
    expect(player).to.exist;
    expect(player.chapters).to.deep.equal(chapters);
    expect(player.src).to.equal('https://example.com/video.mp4');
    expect(player.fileType).to.equal('video/mp4');
  });

  it('accepts a single chapter object from metadata', async () => {
    const el = makeInstance();
    const chapter = {
      title: 'Introduction',
      summary: 'Welcome.',
      timerange: '00:00:01.001 - 00:01:31.625',
    };
    await el.setData({ title: 'Test', url: 'https://example.com/video.mp4', chapters: chapter });
    expect(el.chapters).to.deep.equal([chapter]);
  });

  it('clears chapters when metadata has no chapters', async () => {
    const el = makeInstance();
    for (const chapters of [undefined, null, []]) {
      await el.setData({ title: 'Test', url: 'https://example.com/video.mp4', chapters });
      expect(el.chapters).to.deep.equal([]);
    }
  });

  it('renders a player without optional chapters and handles its loading events', async () => {
    const el = makeInstance();
    el.allCaaSTags = {
      namespaces: {
        // eslint-disable-next-line object-curly-newline
        caas: { tags: { 'file-format': { tags: { video: { title: 'Video' } } } } },
      },
    };
    for (const chapters of [undefined, null, []]) {
      await el.setData({
        title: 'Video without chapters',
        url: 'https://example.com/video.mp4',
        previewImage: mockPreviewImage,
        fileType: 'video/mp4',
        tags: ['caas:file-format/video'],
        partnerLevel: ['public'],
        chapters,
      });
      el.isLoading = false;
      const container = document.createElement('div');
      render(el.render(), container, { host: el });
      const player = container.querySelector('asset-video-player');
      expect(player).to.exist;
      expect(player.src).to.equal('https://example.com/video.mp4');
      expect(player.fileType).to.equal('video/mp4');
      expect(player.chapters).to.deep.equal([]);

      for (const loading of [true, false]) {
        player.dispatchEvent(new CustomEvent('loading-change', { detail: { loading } }));
        render(el.render(), container, { host: el });
        expect(el.isVideoLoading).to.equal(loading);
        expect(container.querySelector('button[disabled]') !== null).to.equal(loading);
      }
    }
  });

  it('preserves chapter links while setting chapter metadata', async () => {
    const originalUrl = window.location.href;
    try {
      window.history.replaceState(null, '', '?chapter=2&t=35');
      const el = new AssetPreview();
      el.blockData = {};
      const chapters = [
        { title: 'First', summary: 'First summary', timerange: '00:00:00.000 - 00:00:30.000' },
        { title: 'Second', summary: 'Second summary', timerange: '00:00:30.000 - 00:01:00.000' },
      ];
      expect(el.chapters).to.deep.equal([]);
      await el.setData({ title: 'Test', url: 'https://example.com/video.mp4', chapters });
      expect(el.chapters).to.deep.equal(chapters);
      expect(window.location.search).to.equal('?chapter=2&t=35');
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
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

  it('_handleImgError sets fallback image src', () => {
    const el = makeInstance();
    const consoleStub = sinon.stub(console, 'log');
    const img = document.createElement('img');
    document.body.appendChild(img);
    const event = { currentTarget: img };
    el._handleImgError(event);
    expect(img.src).to.include('sample-default.png');
    expect(consoleStub.calledOnceWithExactly('error', event)).to.be.true;
    document.body.removeChild(img);
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - getSizeInMb()', () => {
  it('returns size in MB when >= 1 MB', () => {
    const el = makeInstance();
    expect(el.getSizeInMb(2500000)).to.equal('2.5 MB');
  });

  it('returns size in KB when < 1 MB', () => {
    const el = makeInstance();
    expect(el.getSizeInMb(512000)).to.equal('512.0 KB');
  });

  it('returns exactly 1.0 MB at the 1 000 000-byte boundary', () => {
    const el = makeInstance();
    expect(el.getSizeInMb(1000000)).to.equal('1.0 MB');
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - getFileTypeFromTag()', () => {
  it('returns the title of the first file-format tag', () => {
    const el = makeInstance();
    el.fileFormatTags = [{ tagId: 'caas:file-format/pdf', title: 'PDF' }];
    expect(el.getFileTypeFromTag()).to.equal('PDF');
  });

  it('returns empty string when fileFormatTags is empty', () => {
    const el = makeInstance();
    el.fileFormatTags = [];
    expect(el.getFileTypeFromTag()).to.equal('');
  });

  it('returns empty string when fileFormatTags is undefined', () => {
    const el = makeInstance();
    el.fileFormatTags = undefined;
    expect(el.getFileTypeFromTag()).to.equal('');
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - findTagByPath()', () => {
  const mockCaasTags = {
    'file-format': {
      tags: {
        pdf: { tagId: 'caas:file-format/pdf', title: 'PDF' },
        video: { tagId: 'caas:file-format/video', title: 'Video' },
      },
    },
    audience: { tags: { enterprise: { tagId: 'caas:audience/enterprise', title: 'Enterprise' } } },
  };

  it('finds a shallow tag (one level deep)', () => {
    const el = makeInstance();
    const result = el.findTagByPath(mockCaasTags, 'caas:file-format');
    expect(result).to.deep.equal(mockCaasTags['file-format']);
  });

  it('finds a nested tag (two levels deep)', () => {
    const el = makeInstance();
    const result = el.findTagByPath(mockCaasTags, 'caas:file-format/pdf');
    expect(result).to.deep.equal({ tagId: 'caas:file-format/pdf', title: 'PDF' });
  });

  it('returns undefined for an unknown tag', () => {
    const el = makeInstance();
    const result = el.findTagByPath(mockCaasTags, 'caas:nonexistent/tag');
    expect(result).to.be.undefined;
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - getTagsDisplayValues()', () => {
  it('returns tag objects with title from allCaaSTags when found', () => {
    const el = makeInstance();
    el.allCaaSTags = {
      namespaces: {
        caas: {
          tags: {
            'file-format': {
              // eslint-disable-next-line object-curly-newline
              tags: { pdf: { tagId: 'caas:file-format/pdf', title: 'PDF' } },
            },
          },
        },
      },
    };
    const result = el.getTagsDisplayValues(el.allCaaSTags, ['caas:file-format/pdf']);
    expect(result).to.have.lengthOf(1);
    expect(result[0].title).to.equal('PDF');
    expect(result[0].tagId).to.equal('caas:file-format/pdf');
  });

  it('falls back to the raw tag id as title when tag is not found', () => {
    const el = makeInstance();
    el.allCaaSTags = { namespaces: { caas: { tags: {} } } };
    const result = el.getTagsDisplayValues(el.allCaaSTags, ['caas:unknown/tag']);
    expect(result[0].title).to.equal('caas:unknown/tag');
    expect(result[0].tagId).to.equal('caas:unknown/tag');
  });

  it('returns an empty array for an empty tags list', () => {
    const el = makeInstance();
    el.allCaaSTags = { namespaces: { caas: { tags: {} } } };
    expect(el.getTagsDisplayValues(el.allCaaSTags, [])).to.deep.equal([]);
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - getTagChildTagsObjects()', () => {
  it('filters and returns only tags starting with the rootTag', () => {
    const el = makeInstance();
    el.allCaaSTags = {
      namespaces: {
        caas: {
          tags: {
            'file-format': {
              // eslint-disable-next-line object-curly-newline
              tags: { pdf: { tagId: 'caas:file-format/pdf', title: 'PDF' } },
            },
          },
        },
      },
    };
    const result = el.getTagChildTagsObjects(
      ['caas:file-format/pdf', 'caas:audience/enterprise'],
      el.allCaaSTags,
      'caas:file-format',
    );
    expect(result).to.have.lengthOf(1);
    expect(result[0].tagId).to.equal('caas:file-format/pdf');
    expect(result[0].title).to.equal('PDF');
  });

  it('returns empty array for null tags argument', () => {
    const el = makeInstance();
    el.allCaaSTags = { namespaces: { caas: { tags: {} } } };
    expect(el.getTagChildTagsObjects(null, el.allCaaSTags, 'caas:file-format')).to.deep.equal([]);
  });

  it('returns empty array when no tags match rootTag', () => {
    const el = makeInstance();
    el.allCaaSTags = { namespaces: { caas: { tags: {} } } };
    const result = el.getTagChildTagsObjects(
      ['caas:audience/enterprise'],
      el.allCaaSTags,
      'caas:file-format',
    );
    expect(result).to.deep.equal([]);
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - addDynamicKeyForLocalization()', () => {
  it('adds a missing localization key with the key itself as its value', () => {
    const el = makeInstance();
    el.addDynamicKeyForLocalization('Search All Assets');
    expect(el.blockData.localizedText['{{Search All Assets}}']).to.equal('Search All Assets');
  });

  it('does not overwrite an already-set localization key', () => {
    const el = makeInstance();
    el.blockData.localizedText['{{Back to previous}}'] = 'Zurück';
    el.addDynamicKeyForLocalization('Back to previous');
    expect(el.blockData.localizedText['{{Back to previous}}']).to.equal('Zurück');
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - setBlockData()', () => {
  function makeRow(label, value) {
    const row = document.createElement('div');
    const labelCell = document.createElement('div');
    labelCell.innerText = label;
    const valueCell = document.createElement('div');
    valueCell.innerText = value;
    row.appendChild(labelCell);
    row.appendChild(valueCell);
    return row;
  }

  it('reads back-button-url from tableData', () => {
    const el = makeInstance();
    el.blockData.localizedText = {};
    el.blockData.tableData = [makeRow('Back button url', '/search/')];
    el.setBlockData();
    expect(el.blockData.backButtonUrl).to.equal('/search/');
  });

  it('reads back-button-label from tableData', () => {
    const el = makeInstance();
    el.blockData.localizedText = {};
    el.blockData.tableData = [makeRow('Back button label', 'Go Back')];
    el.setBlockData();
    expect(el.blockData.backButtonLabel).to.equal('Go Back');
  });

  it('reads pdf-embed-mode from tableData and normalises whitespace/case', () => {
    const el = makeInstance();
    el.blockData.localizedText = {};
    el.blockData.tableData = [makeRow('PDF embed mode', 'Sized Container')];
    el.setBlockData();
    expect(el.blockData.pdfEmbedMode).to.equal('sized-container');
  });

  it('ignores unknown row labels without throwing', () => {
    const el = makeInstance();
    el.blockData.localizedText = {};
    el.blockData.tableData = [makeRow('unknown row', 'some value')];
    expect(() => el.setBlockData()).to.not.throw();
  });
});

// ---------------------------------------------------------------------------
describe('AssetPreview - getRealAssetUrl()', () => {
  it('returns a URL object or null (never throws)', () => {
    const el = makeInstance();
    const result = el.getRealAssetUrl();
    expect(result === null || result instanceof URL).to.be.true;
  });

  it('builds the AEM metadata URL from the assetPath parameter', () => {
    const originalUrl = window.location.href;
    try {
      window.history.replaceState(null, '', '/content/asset-ai-dashboard.html?assetPath=/content/dam/dxp/qatest/dragana/shortexample.mp4');
      const el = new AssetPreview();
      el.blockData = { isAEM: true };

      const metadataUrl = el.getRealAssetUrl();

      expect(metadataUrl).to.be.instanceOf(URL);
      expect(metadataUrl.toString()).to.equal(`${window.location.origin}/content/dam/dxp/qatest/dragana/shortexample.mp4.assetmetadata.json`);
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  });

  it('returns null for non-DAM AEM asset paths', () => {
    const originalUrl = window.location.href;
    try {
      window.history.replaceState(null, '', '/content/asset-ai-dashboard.html?assetPath=/content/test/page');
      const el = new AssetPreview();
      el.blockData = { isAEM: true };

      expect(el.getRealAssetUrl()).to.equal(null);
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  });

  it('routes non-AEM preview URLs to the stage domain when not on prod', () => {
    const originalUrl = window.location.href;
    try {
      window.history.replaceState(null, '', '/digitalexperience/preview/video.html?asset=example');
      const metadataUrl = makeInstance().getRealAssetUrl();

      expect(metadataUrl.hostname).to.equal('partners.stage.adobe.com');
      expect(metadataUrl.pathname).to.include('/digitalexperience-assets/preview/video/_jcr_content/metadata.assetmetadata.json');
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  });

  it('removes client-only chapter parameters while preserving other query parameters', () => {
    const originalUrl = window.location.href;
    try {
      ['chapter=1&t=1.001', 'chapter=1', 't=1.001'].forEach((query) => {
        window.history.replaceState(null, '', `/digitalexperience/preview/video.html?${query}&asset=example`);
        const metadataUrl = makeInstance().getRealAssetUrl();

        expect(metadataUrl.searchParams.has('chapter')).to.be.false;
        expect(metadataUrl.searchParams.has('t')).to.be.false;
        expect(metadataUrl.searchParams.get('asset')).to.equal('example');
        expect(window.location.search).to.equal(`?${query}&asset=example`);
      });
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  });
});

describe('AssetPreview - playVideo()', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('plays and scrolls to its own player', async () => {
    const el = makeInstance();
    const player = document.createElement('asset-video-player');
    const playStub = sinon.stub(player, 'play').resolves();
    const scrollStub = sinon.stub(window, 'scrollTo');
    sinon.stub(player, 'offsetTop').get(() => 240);
    el.appendChild(player);

    await el.playVideo();
    expect(playStub.calledOnce).to.be.true;
    expect(scrollStub.calledOnceWithExactly({ top: 240, behavior: 'smooth' })).to.be.true;
  });

  it('ignores players outside the preview', async () => {
    const el = makeInstance();
    const player = document.createElement('asset-video-player');
    const playStub = sinon.stub(player, 'play').resolves();
    document.body.appendChild(player);

    await el.playVideo();

    expect(playStub.called).to.be.false;
  });

  it('logs playback failures', async () => {
    const el = makeInstance();
    const player = document.createElement('asset-video-player');
    const error = new Error('Playback unavailable');
    sinon.stub(player, 'play').rejects(error);
    sinon.stub(window, 'scrollTo');
    const consoleStub = sinon.stub(console, 'error');
    el.appendChild(player);

    await el.playVideo();

    expect(consoleStub.calledOnceWithExactly('Failed to play video:', error)).to.be.true;
  });
});
