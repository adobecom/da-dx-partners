import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';
import AssetPreview from '../../../eds/blocks/asset-preview/AssetPreview.js';
import VideoPlayer from '../../../eds/components/VideoPlayer.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
const { render } = await import(`${miloLibs}/deps/lit-all.min.js`);
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

  it('keeps authored fragment links in the replacement component', async () => {
    const { default: init } = await import('../../../eds/blocks/asset-preview/asset-preview.js');
    const block = document.querySelector('.asset-preview');
    const fragmentLink = block.querySelector('a[href="/fragments/restricted-fragment"]');
    block.parentNode.setAttribute('data-idx', '0');

    const app = await init(block);

    expect(app.querySelector('a[href="/fragments/restricted-fragment"]')).to.equal(fragmentLink);
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
    sinon.stub(window, 'fetch').rejects(new Error('metadata unavailable'));

    await el.getAssetMetadata();

    expect(el.isLoading).to.be.false;
  });

  it('does not fetch metadata when no real asset URL can be built', async () => {
    const el = makeInstance();
    el.getRealAssetUrl = () => null;
    const fetchStub = sinon.stub(window, 'fetch');

    await el.getAssetMetadata();

    expect(fetchStub.called).to.be.false;
  });

  it('fetches metadata without chapter parameters and restores the chapter on the client', async () => {
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

      const player = new VideoPlayer();
      player.chapters = el.chapters;
      player.willUpdate(new Map([['chapters', []]]));
      expect(player.selectedChapterIndex).to.equal(1);
      expect(player.currentTime).to.equal(35);
      const video = document.createElement('video');
      player.handleVideoLoadedMetadata({ currentTarget: video });
      expect(video.currentTime).to.equal(35);
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

  it('renders chapter titles, summaries and ranges from metadata', async () => {
    const el = makeInstance();
    const chapters = [{
      title: 'API chapter',
      summary: 'API summary',
      timerange: '00:00:10.000 - 00:00:20.000',
    }];
    await el.setData({ title: 'Test', url: 'https://example.com/video.mp4', chapters });
    expect(el.chapters).to.deep.equal(chapters);

    const player = new VideoPlayer();
    player.chapters = el.chapters;
    const container = document.createElement('div');
    render(player.renderChapters(), container);
    expect(container.querySelectorAll('.chapter')).to.have.lengthOf(1);
    expect(container.textContent).to.include('API chapter');
    expect(container.textContent).to.include('API summary');
    expect(container.textContent).to.include('00:10');
    expect(container.textContent).to.include('00:20');
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
      const player = new VideoPlayer();
      player.chapters = el.chapters;
      const container = document.createElement('div');
      render(player.renderChapters(), container);
      expect(container.querySelectorAll('.chapter')).to.have.lengthOf(0);
      player.handleVideoTimeUpdate({ currentTarget: { currentTime: 10, paused: false } });
      expect(player.currentTime).to.equal(10);
    }
  });

  it('renders a playable video and clears its spinner without optional chapters', async () => {
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
        fileType: 'video/mp4',
        tags: ['caas:file-format/video'],
        partnerLevel: ['public'],
        chapters,
      });
      el.isLoading = false;
      const container = document.createElement('div');
      document.body.appendChild(container);
      render(el.render(), container);
      const player = container.querySelector('video-player');
      await player.updateComplete;
      const video = container.querySelector('video');
      expect(video).to.exist;
      expect(video.controls).to.be.false;
      expect(container.querySelector('.player-progress')).to.exist;
      expect(video.querySelector('source').getAttribute('src')).to.equal('https://example.com/video.mp4');
      expect(container.querySelector('.video-chapters')).to.equal(null);

      video.dispatchEvent(new Event('loadstart'));
      await player.updateComplete;
      expect(container.querySelector('.video-loading-overlay')).to.exist;
      video.dispatchEvent(new Event('canplay'));
      await player.updateComplete;
      expect(container.querySelector('.video-loading-overlay')).to.equal(null);
      video.dispatchEvent(new Event('waiting'));
      video.dispatchEvent(new Event('playing'));
      await player.updateComplete;
      expect(el.isVideoLoading).to.be.false;
      video.dispatchEvent(new Event('loadstart'));
      video.dispatchEvent(new Event('error'));
      await player.updateComplete;
      expect(el.isVideoLoading).to.be.false;
      container.remove();
    }
  });

  it('restores chapter links only after metadata arrives', async () => {
    const originalUrl = window.location.href;
    try {
      window.history.replaceState(null, '', '?chapter=2&t=35');
      const el = new AssetPreview();
      el.blockData = {};
      const chapters = [
        { title: 'First', summary: 'First summary', timerange: '00:00:00.000 - 00:00:30.000' },
        { title: 'Second', summary: 'Second summary', timerange: '00:00:30.000 - 00:01:00.000' },
      ];
      const player = new VideoPlayer();
      expect(player.selectedChapterIndex).to.equal(0);
      expect(player.currentTime).to.equal(0);
      await el.setData({ title: 'Test', url: 'https://example.com/video.mp4', chapters });
      player.chapters = el.chapters;
      player.willUpdate(new Map([['chapters', []]]));
      expect(player.selectedChapterIndex).to.equal(1);
      expect(player.currentTime).to.equal(35);
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
    const img = document.createElement('img');
    document.body.appendChild(img);
    el._handleImgError({ currentTarget: img });
    expect(img.src).to.include('sample-default.png');
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

  it('removes client-only chapter parameters while preserving other query parameters', () => {
    const originalUrl = window.location.href;
    try {
      ['chapter=1&t=1.001', 'chapter=1', 't=1.001'].forEach((query) => {
        window.history.replaceState(null, '', `/digitalexperience/preview/video.html?${query}&asset=example`);
        const metadataUrl = new AssetPreview().getRealAssetUrl();

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

// ---------------------------------------------------------------------------
describe('AssetPreview - video component integration', () => {
  afterEach(() => {
    document.body.replaceChildren();
    sinon.restore();
  });

  it('passes metadata and synchronizes the Watch Video button with player loading', async () => {
    const el = makeInstance();
    el.assetHasData = true;
    el.isLoading = false;
    el.isVideo = true;
    el.url = 'data:video/mp4;base64,';
    el.fileType = 'video/mp4';
    sinon.stub(el, 'setBlockData');
    sinon.stub(el, 'getAssetMetadata').resolves();
    sinon.stub(window, 'fetch').resolves({ ok: true, json: async () => ({}) });
    document.body.appendChild(el);
    await el.updateComplete;
    const player = el.querySelector('video-player');
    await player.updateComplete;

    expect(player.src).to.equal(el.url);
    expect(player.fileType).to.equal(el.fileType);
    expect(player.chapters).to.equal(el.chapters);
    const video = player.querySelector('video');
    video.dispatchEvent(new Event('waiting'));
    await player.updateComplete;
    await el.updateComplete;
    expect(el.isVideoLoading).to.be.true;
    expect(el.querySelector('.asset-preview-block-actions button.filled').disabled).to.be.true;

    video.dispatchEvent(new Event('canplay'));
    await player.updateComplete;
    await el.updateComplete;
    const button = el.querySelector('.asset-preview-block-actions button.filled');
    expect(el.isVideoLoading).to.be.false;
    expect(button.disabled).to.be.false;
    const play = sinon.stub(player, 'play').resolves();
    sinon.stub(window, 'scrollTo');
    button.click();
    expect(play.calledOnce).to.be.true;
    expect(el.querySelector('video-player')).to.equal(player);
    expect(player.querySelector('video')).to.equal(video);
  });

  it('does not render the player for restricted assets or non-video assets', () => {
    const el = makeInstance();
    el.assetHasData = true;
    el.isLoading = false;
    el.isVideo = true;
    el.assetPartnerLevel = ['gold'];
    const container = document.createElement('div');
    render(el.render(), container);
    expect(container.querySelector('video-player')).to.equal(null);

    el.assetPartnerLevel = [];
    el.isVideo = false;
    render(el.render(), container);
    expect(container.querySelector('video-player')).to.equal(null);
  });
});

describe('AssetPreview - playVideo()', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('plays and scrolls to its own video component', async () => {
    const el = makeInstance();
    const player = new VideoPlayer();
    const playStub = sinon.stub(player, 'play').resolves();
    const scrollStub = sinon.stub(window, 'scrollTo');
    sinon.stub(player, 'offsetTop').get(() => 240);
    el.appendChild(player);

    await el.playVideo();
    expect(playStub.calledOnce).to.be.true;
    expect(scrollStub.calledOnceWithExactly({ top: 240, behavior: 'smooth' })).to.be.true;
  });

  it('does not control videos outside the asset preview', async () => {
    const video = document.createElement('video');
    const play = sinon.stub(video, 'play');
    document.body.appendChild(video);
    const el = makeInstance();
    await el.playVideo();
    expect(play.called).to.be.false;
  });

  it('reports a rejected play request', async () => {
    const el = makeInstance();
    const player = new VideoPlayer();
    const error = new Error('Playback rejected');
    sinon.stub(player, 'play').rejects(error);
    const logError = sinon.stub(console, 'error');
    sinon.stub(window, 'scrollTo');
    el.appendChild(player);

    await el.playVideo();

    expect(logError.calledOnceWithExactly('Failed to play video:', error)).to.be.true;
  });
});
