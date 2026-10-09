import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';
import AssetPreview from '../../../eds/blocks/asset-preview/AssetPreview.js';

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
});

// ---------------------------------------------------------------------------
describe('AssetPreview - shareChapter()', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('replaces the clicked share icon with a green check for two seconds', async () => {
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const writeText = sinon.stub(navigator.clipboard, 'writeText').resolves();
    const el = makeInstance();
    const container = document.createElement('div');
    const iconStyles = document.createElement('style');
    iconStyles.textContent = '.share-button svg { stroke: #707070; }';
    document.body.append(iconStyles, container);
    render(el.renderChapters(), container);
    const button = container.querySelector('.share-button');
    const sharePath = button.querySelector('path').getAttribute('d');
    expect(button.querySelector('svg').getAttribute('slot')).to.equal('icon');
    expect(button.querySelector('path').namespaceURI).to.equal('http://www.w3.org/2000/svg');

    button.click();
    await Promise.resolve();
    render(el.renderChapters(), container);

    expect(writeText.calledOnceWithExactly(el.createChapterUrl(0))).to.be.true;
    expect(button.getAttribute('label')).to.equal('Chapter link copied');
    expect(button.querySelector('svg').getAttribute('stroke')).to.equal('#268e6c');
    expect(getComputedStyle(button.querySelector('svg')).stroke).to.equal('rgb(38, 142, 108)');
    expect(button.querySelector('path').getAttribute('d')).to.equal('M5 12l4 4L19 6');
    expect(button.querySelector('svg').getAttribute('slot')).to.equal('icon');
    expect(button.querySelector('path').namespaceURI).to.equal('http://www.w3.org/2000/svg');
    expect(container.querySelectorAll('.share-button')[1].querySelector('svg').getAttribute('stroke')).to.equal('#707070');

    clock.tick(1999);
    expect(el.sharedChapterIndex).to.equal(0);
    clock.tick(1);
    render(el.renderChapters(), container);

    expect(button.getAttribute('label')).to.equal('Share chapter');
    expect(button.querySelector('svg').getAttribute('stroke')).to.equal('#707070');
    expect(getComputedStyle(button.querySelector('svg')).stroke).to.equal('rgb(112, 112, 112)');
    expect(button.querySelector('path').getAttribute('d')).to.equal(sharePath);
  });

  it('stops propagation and leaves the selected chapter unchanged when sharing', async () => {
    const el = makeInstance();
    const writeText = sinon.stub(navigator.clipboard, 'writeText').resolves();
    const markShared = sinon.stub(el, 'markChapterShared');
    const stopPropagation = sinon.spy();

    await el.shareChapter(2, { stopPropagation });

    expect(stopPropagation.calledOnce).to.be.true;
    expect(writeText.calledOnceWithExactly(el.createChapterUrl(2))).to.be.true;
    expect(markShared.calledOnceWithExactly(2)).to.be.true;
    expect(el.selectedChapterIndex).to.equal(0);
  });

  it('logs clipboard failures without showing a copied state', async () => {
    const el = makeInstance();
    const error = new Error('Clipboard permission denied');
    sinon.stub(navigator.clipboard, 'writeText').rejects(error);
    const logError = sinon.stub(console, 'error');
    const markShared = sinon.stub(el, 'markChapterShared');

    await el.shareChapter(2, { stopPropagation: sinon.spy() });

    expect(logError.calledOnceWithExactly('Failed to copy chapter URL:', error)).to.be.true;
    expect(markShared.called).to.be.false;
    expect(el.sharedChapterIndex).to.equal(-1);
    expect(el.shareResetTimer).to.equal(null);
  });
});

describe('AssetPreview - chapter time helpers', () => {
  it('converts hours, minutes and fractional seconds to seconds', () => {
    expect(makeInstance().timecodeToSeconds('01:02:03.456')).to.be.closeTo(3723.456, 0.001);
  });

  it('extracts the unchanged start time from a chapter range', () => {
    expect(makeInstance().getStartTime('00:01:31.625 - 00:02:22.906')).to.equal('00:01:31.625');
  });

  it('formats timecodes with zero padding and discards fractional seconds', () => {
    const el = makeInstance();
    expect(el.formatTimecode('00:00:01.999')).to.equal('00:01');
    expect(el.formatTimecode('00:05:09.123')).to.equal('05:09');
    expect(el.formatTimecode('01:02:03.456')).to.equal('62:03');
  });
});

describe('AssetPreview - markChapterShared() and disconnectedCallback()', () => {
  afterEach(() => sinon.restore());

  it('restarts the copied-state timer when another chapter is shared', () => {
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const el = makeInstance();
    el.markChapterShared(0);
    clock.tick(1000);
    el.markChapterShared(2);

    clock.tick(1000);
    expect(el.sharedChapterIndex).to.equal(2);
    clock.tick(999);
    expect(el.sharedChapterIndex).to.equal(2);
    clock.tick(1);
    expect(el.sharedChapterIndex).to.equal(-1);
    expect(el.shareResetTimer).to.equal(null);
  });

  it('cancels the pending copied-state timer when disconnected', () => {
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const el = makeInstance();
    el.markChapterShared(2);

    el.disconnectedCallback();
    clock.tick(2000);

    expect(el.sharedChapterIndex).to.equal(2);
    expect(clock.countTimers()).to.equal(0);
  });
});

describe('AssetPreview - handleVideoTimeUpdate()', () => {
  afterEach(() => sinon.restore());

  it('updates playback time without advancing before the chapter ends', () => {
    const el = makeInstance();
    const selectChapter = sinon.stub(el, 'selectChapter');

    el.handleVideoTimeUpdate({ currentTarget: { currentTime: 91.624, paused: false } });

    expect(el.currentTime).to.equal(91.624);
    expect(selectChapter.called).to.be.false;
  });

  it('advances to the next chapter at or after the end time', () => {
    const el = makeInstance();
    const selectChapter = sinon.stub(el, 'selectChapter');

    [91.625, 92].forEach((currentTime) => {
      el.handleVideoTimeUpdate({ currentTarget: { currentTime, paused: false } });
    });

    expect(selectChapter.calledTwice).to.be.true;
    expect(selectChapter.alwaysCalledWithExactly(1)).to.be.true;
    expect(el.currentTime).to.equal(92);
  });

  it('updates time but does not advance while paused', () => {
    const el = makeInstance();
    const selectChapter = sinon.stub(el, 'selectChapter');

    el.handleVideoTimeUpdate({ currentTarget: { currentTime: 100, paused: true } });

    expect(el.currentTime).to.equal(100);
    expect(selectChapter.called).to.be.false;
  });

  it('does not advance beyond the final chapter', () => {
    const el = makeInstance();
    const container = document.createElement('div');
    render(el.renderChapters(), container);
    el.selectedChapterIndex = container.querySelectorAll('.chapter').length - 1;
    const selectChapter = sinon.stub(el, 'selectChapter');

    el.handleVideoTimeUpdate({ currentTarget: { currentTime: 4000, paused: false } });

    expect(el.currentTime).to.equal(4000);
    expect(selectChapter.called).to.be.false;
  });
});

describe('AssetPreview - chapter progress', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('fills earlier tracks blue when clicking the third chapter', async () => {
    const el = makeInstance();
    const container = document.createElement('div');
    const styles = document.createElement('style');
    styles.textContent = await readFile({ path: '../../../eds/blocks/asset-preview/asset-preview.css' });
    document.body.append(styles, container);
    render(el.renderChapters(), container);

    container.querySelector('#chapter-3').click();
    render(el.renderChapters(), container);

    const fills = container.querySelectorAll('.progress-fill');
    [fills[0], fills[1]].forEach((fill) => {
      expect(fill.style.width).to.equal('100%');
      expect(getComputedStyle(fill).backgroundColor).to.equal('rgb(20, 115, 230)');
    });
    Array.from(fills).slice(2).forEach((fill) => {
      expect(fill.style.width).to.equal('0%');
    });
  });

  it('updates earlier tracks for keyboard selection and resets later tracks when going back', () => {
    const el = makeInstance();
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(el.renderChapters(), container);

    container.querySelector('#chapter-3').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    render(el.renderChapters(), container);
    expect(el.getChapterProgress(0)).to.equal(100);
    expect(el.getChapterProgress(1)).to.equal(100);

    container.querySelector('#chapter-2').click();
    render(el.renderChapters(), container);
    expect(el.getChapterProgress(0)).to.equal(100);
    expect(el.getChapterProgress(1)).to.equal(0);
    expect(el.getChapterProgress(2)).to.equal(0);
  });

  it('preserves partial progress for the active chapter and empty future tracks', () => {
    const el = makeInstance();
    el.selectChapter(2);
    el.currentTime = (142.906 + 322.223) / 2;

    expect(el.getChapterProgress(0)).to.equal(100);
    expect(el.getChapterProgress(1)).to.equal(100);
    expect(el.getChapterProgress(2)).to.be.closeTo(50, 0.001);
    expect(el.getChapterProgress(3)).to.equal(0);
  });

  it('clamps active chapter progress between zero and one hundred percent', () => {
    const el = makeInstance();
    el.selectChapter(2);
    el.currentTime = 0;
    expect(el.getChapterProgress(2)).to.equal(0);
    el.currentTime = 4000;
    expect(el.getChapterProgress(2)).to.equal(100);
  });

  it('selects a chapter with Space and ignores unrelated keys', () => {
    const el = makeInstance();
    const container = document.createElement('div');
    render(el.renderChapters(), container);
    const chapter = container.querySelector('#chapter-3');
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });

    chapter.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(el.selectedChapterIndex).to.equal(0);
    chapter.dispatchEvent(space);
    render(el.renderChapters(), container);

    expect(space.defaultPrevented).to.be.true;
    expect(el.selectedChapterIndex).to.equal(2);
    expect(chapter.getAttribute('aria-current')).to.equal('true');
    expect(container.querySelector('#chapter-1').getAttribute('aria-current')).to.equal('false');
  });
});

describe('AssetPreview - chapter URLs', () => {
  let originalUrl;

  beforeEach(() => {
    originalUrl = window.location.href;
  });

  afterEach(() => {
    window.history.replaceState(null, '', originalUrl);
    document.body.innerHTML = '';
  });

  it('restores the copied chapter and seeks after metadata loads', () => {
    const url = makeInstance().createChapterUrl(2);
    expect(new URL(url).searchParams.get('t')).to.equal('142.906');
    window.history.replaceState(null, '', url);

    const el = makeInstance();
    const container = document.createElement('div');
    document.body.appendChild(container);
    render(el.renderChapters(), container);
    expect(el.selectedChapterIndex).to.equal(2);
    expect(container.querySelector('.is-active').id).to.equal('chapter-3');
    expect(container.querySelector('#chapter-1 .progress-fill').style.width).to.equal('100%');
    expect(container.querySelector('#chapter-2 .progress-fill').style.width).to.equal('100%');

    const video = document.createElement('video');
    el.handleVideoLoadedMetadata({ currentTarget: video });
    expect(video.currentTime).to.equal(142.906);
  });

  it('selects a chapter from a timestamp-only URL', () => {
    window.history.replaceState(null, '', '?t=100');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(100);
  });

  it('preserves unrelated URL parameters and the hash when creating a chapter link', () => {
    window.history.replaceState(null, '', '?asset=example&chapter=1&t=0#details');
    const url = new URL(makeInstance().createChapterUrl(2));

    expect(url.searchParams.get('asset')).to.equal('example');
    expect(url.searchParams.get('chapter')).to.equal('3');
    expect(url.searchParams.get('t')).to.equal('142.906');
    expect(url.hash).to.equal('#details');
  });

  it('restores an in-range timestamp for an explicitly selected chapter', () => {
    window.history.replaceState(null, '', '?chapter=3&t=200');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(2);
    expect(el.currentTime).to.equal(200);
  });

  it('uses the next chapter at a shared timestamp boundary', () => {
    window.history.replaceState(null, '', '?t=91.625');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(91.625);
  });

  it('falls back to a valid timestamp when the chapter parameter is invalid', () => {
    window.history.replaceState(null, '', '?chapter=999&t=100');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(100);
  });

  it('uses the selected chapter start for an out-of-range timestamp', () => {
    window.history.replaceState(null, '', '?chapter=3&t=100');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(2);
    expect(el.currentTime).to.equal(142.906);
  });

  it('falls back to the chapter start for an invalid timestamp', () => {
    window.history.replaceState(null, '', '?chapter=2&t=invalid');
    const el = makeInstance();
    expect(el.selectedChapterIndex).to.equal(1);
    expect(el.currentTime).to.equal(91.625);
  });

  it('keeps the default chapter for invalid URL values', () => {
    ['?chapter=999&t=-1', '?chapter=1.5&t=Infinity', '?chapter=invalid&t='].forEach((query) => {
      window.history.replaceState(null, '', query);
      const el = makeInstance();
      expect(el.selectedChapterIndex).to.equal(0);
      expect(el.currentTime).to.equal(0);
    });
  });
});

describe('AssetPreview - selectChapter()', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('preserves the seek time when selecting before the video exists', () => {
    const el = makeInstance();
    el.selectChapter(1);
    const video = document.createElement('video');
    el.handleVideoLoadedMetadata({ currentTarget: video });
    expect(video.currentTime).to.equal(91.625);
  });

  it('seeks and requests playback immediately when metadata is ready', () => {
    const video = document.createElement('video');
    sinon.stub(video, 'readyState').get(() => 1);
    const playStub = sinon.stub(video, 'play').resolves();
    document.body.appendChild(video);
    const el = makeInstance();

    el.selectChapter(1);

    expect(el.selectedChapterIndex).to.equal(1);
    expect(video.currentTime).to.equal(91.625);
    expect(playStub.calledOnce).to.be.true;
  });

  it('requests playback immediately and seeks to the latest selection once metadata loads', () => {
    const video = document.createElement('video');
    sinon.stub(video, 'readyState').get(() => 0);
    const playStub = sinon.stub(video, 'play').resolves();
    document.body.appendChild(video);
    const el = makeInstance();

    el.selectChapter(1);
    expect(playStub.calledOnce).to.be.true;
    expect(video.currentTime).to.equal(0);

    el.selectChapter(2);
    el.handleVideoLoadedMetadata({ currentTarget: video });

    expect(playStub.calledTwice).to.be.true;
    expect(video.currentTime).to.equal(142.906);
    expect(el.currentTime).to.equal(142.906);
  });

  it('ignores invalid chapter indices without changing playback', () => {
    const video = document.createElement('video');
    const playStub = sinon.stub(video, 'play').resolves();
    document.body.appendChild(video);
    const el = makeInstance();
    el.currentTime = 20;

    [-1, 999].forEach((index) => el.selectChapter(index));

    expect(el.selectedChapterIndex).to.equal(0);
    expect(el.currentTime).to.equal(20);
    expect(video.currentTime).to.equal(0);
    expect(playStub.called).to.be.false;
  });

  it('keeps the selection and seek time when playback is rejected', async () => {
    const video = document.createElement('video');
    sinon.stub(video, 'readyState').get(() => 1);
    const playStub = sinon.stub(video, 'play').rejects(new Error('Playback requires interaction'));
    document.body.appendChild(video);
    const el = makeInstance();

    el.selectChapter(2);
    await Promise.resolve();

    expect(playStub.calledOnce).to.be.true;
    expect(el.selectedChapterIndex).to.equal(2);
    expect(el.currentTime).to.equal(142.906);
    expect(video.currentTime).to.equal(142.906);
  });
});

describe('AssetPreview - playVideo()', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('plays and scrolls to the video when a video element is present in the DOM', () => {
    const container = document.createElement('div');
    container.className = 'asset-preview-block-video';
    const video = document.createElement('video');
    const playStub = sinon.stub(video, 'play');
    const scrollStub = sinon.stub(window, 'scrollTo');
    sinon.stub(container, 'offsetTop').get(() => 240);
    container.appendChild(video);
    document.body.appendChild(container);

    const el = makeInstance();
    el.playVideo();
    expect(playStub.calledOnce).to.be.true;
    expect(scrollStub.calledOnceWithExactly({ top: 240, behavior: 'smooth' })).to.be.true;
  });

  it('does nothing when no video element exists in the DOM', () => {
    const el = makeInstance();
    expect(() => el.playVideo()).to.not.throw();
  });
});
