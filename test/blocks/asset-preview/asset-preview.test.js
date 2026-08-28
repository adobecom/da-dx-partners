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
    container.appendChild(video);
    document.body.appendChild(container);

    const el = makeInstance();
    el.playVideo();
    expect(playStub.calledOnce).to.be.true;
  });

  it('does nothing when no video element exists in the DOM', () => {
    const el = makeInstance();
    expect(() => el.playVideo()).to.not.throw();
  });
});
