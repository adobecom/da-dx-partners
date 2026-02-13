/* eslint-disable */
/**
 * @jest-environment jsdom
 */
import { readFile } from '@web/test-runner-commands';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const { default: init } = await import('../../../eds/blocks/asset-redirects/asset-redirects.js');
describe('Asset redirects', () => {

  const originalLocation = window.location;

  beforeAll(() => {
    delete window.location;

    window.location = {
      ...originalLocation,
      href: 'https://partners.adobe.com/digitalexperience/preview/restricted/1/program-guide.pdf.html',
      replace: jest.fn(),
      assign: jest.fn(),
    };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('should redirect if finds valid url in table', async () => {
    const block = document.querySelector('.asset-redirects');
    await init(block);
    expect(window.location.replace).toHaveBeenCalledWith('https://partners.adobe.com/digitalexperience/preview/netstorage-assets/restricted/we/webinar-recording-pko26-keynote-amer-emea.mp4.html');
    expect(window.location.replace).toHaveBeenCalledTimes(1);
  });
});
