import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs, getLibs } from '../../eds/scripts/utils.js';

setLibs('/libs');

const miloLibs = getLibs();
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({
  locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } },
  miloLibs,
});

await import('../../eds/components/SearchCard.js');

const localizedText = {
  '{{open-in}}': 'Open in',
  '{{last-modified}}': 'Last Modified',
  '{{size}}': 'Size',
};

function defaultData(overrides = {}) {
  return {
    id: 'search-card-test',
    cardDate: '2024-01-15',
    styles: {
      backgroundImage: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
      backgroundAltText: 'Preview image',
    },
    arbitrary: [
      { product: 'analytics' },
      { partnerlevel: 'platinum' },
      { solution: 'commerce' },
    ],
    contentArea: {
      title: 'Analytics guide',
      description: '<strong>Learn</strong><script>alert("xss")</script> more',
      type: 'pdf',
      contentType: 'asset',
      url: 'https://example.com/analytics.pdf',
      size: '2.5 MB',
    },
    ...overrides,
  };
}

function makeSearchCard({ data = defaultData(), allTagsFlatMap } = {}) {
  const searchCard = document.createElement('search-card');
  searchCard.data = data;
  searchCard.localizedText = localizedText;
  searchCard.ietf = 'en-US';
  searchCard.allTagsFlatMap = allTagsFlatMap || new Map([
    ['product/analytics', { title: 'Analytics <em>Cloud</em>' }],
    ['solution/commerce', { title: 'Commerce' }],
  ]);
  document.body.append(searchCard);
  return searchCard;
}

describe('SearchCard component', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('renders sanitized content, known tag titles, image, date, and file size for assets', async () => {
    const searchCard = makeSearchCard();
    await searchCard.updateComplete;

    expect(searchCard.querySelector('.file-icon').getAttribute('style')).to.include('/eds/img/icons/pdf.svg');
    expect(searchCard.querySelector('.card-title').textContent).to.equal('Analytics guide');
    expect(searchCard.querySelector('.card-img').getAttribute('style')).to.include('data:image/gif;base64');
    expect(searchCard.querySelector('.card-date').textContent).to.include('Last Modified: Jan 15, 2024');
    expect(searchCard.querySelector('.card-size').textContent).to.equal('Size: 2.5 MB');

    const description = searchCard.querySelector('.card-description');
    expect(description.innerHTML).to.include('<strong>Learn</strong>');
    expect(description.querySelector('script')).to.equal(null);

    const tags = [...searchCard.querySelectorAll('.card-tag')].map((tag) => tag.textContent);
    expect(tags).to.deep.equal(['Analytics Cloud', 'Commerce']);
  });

  it('omits partner level and unknown tags', async () => {
    const searchCard = makeSearchCard({
      allTagsFlatMap: new Map([
        ['product/analytics', { title: 'Analytics' }],
      ]),
    });
    await searchCard.updateComplete;

    const tags = [...searchCard.querySelectorAll('.card-tag')].map((tag) => tag.textContent);
    expect(tags).to.deep.equal(['Analytics']);
  });

  it('uses the default file icon for unsupported content types', async () => {
    const searchCard = makeSearchCard({
      data: defaultData({
        contentArea: {
          ...defaultData().contentArea,
          type: 'spreadsheet-preview',
          contentType: 'asset',
        },
      }),
    });
    await searchCard.updateComplete;

    expect(searchCard.querySelector('.file-icon').getAttribute('style')).to.include('/eds/img/icons/default.svg');
  });

  it('does not render file size for html pages', async () => {
    const searchCard = makeSearchCard({
      data: defaultData({
        contentArea: {
          ...defaultData().contentArea,
          type: 'html',
          contentType: 'page',
        },
      }),
    });
    await searchCard.updateComplete;

    expect(searchCard.querySelector('.card-size')).to.equal(null);
  });

  it('does not render tags for courses', async () => {
    const searchCard = makeSearchCard({
      data: defaultData({
        contentArea: {
          ...defaultData().contentArea,
          type: 'course',
          contentType: 'course',
        },
      }),
    });
    await searchCard.updateComplete;

    expect(searchCard.querySelector('.card-tags-wrapper')).to.equal(null);
  });

  it('hides card-metadata titles', async () => {
    const searchCard = makeSearchCard({
      data: defaultData({
        contentArea: {
          ...defaultData().contentArea,
          title: 'card-metadata',
        },
      }),
    });
    await searchCard.updateComplete;

    expect(searchCard.querySelector('.card-title').textContent).to.equal('');
    expect(searchCard.querySelector('.card-btn').getAttribute('daa-ll')).to.equal('');
  });

  it('dispatches link click analytics and does not toggle the card from the link click', async () => {
    const clock = sinon.useFakeTimers({ now: 1710000000000, toFake: ['Date'] });
    const eventSpy = sinon.spy();
    window.addEventListener('aep:TrackEvent', eventSpy);

    const searchCard = makeSearchCard();
    await searchCard.updateComplete;

    const card = searchCard.querySelector('.search-card');
    const button = searchCard.querySelector('.card-btn');
    button.click();

    expect(card.classList.contains('expanded')).to.be.false;
    expect(eventSpy.calledOnce).to.be.true;
    expect(eventSpy.firstCall.args[0].detail).to.deep.include({
      appName: 'experience-hub',
      eventType: 'linkClick',
      timestamp: clock.now,
    });
    expect(eventSpy.firstCall.args[0].detail.metadata).to.deep.equal({
      link: 'https://example.com/analytics.pdf',
      linkText: 'Analytics guide',
    });

    window.removeEventListener('aep:TrackEvent', eventSpy);
  });
});
