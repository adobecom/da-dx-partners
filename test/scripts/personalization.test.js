import { expect } from '@esm-bundle/chai';

describe('Personalization', () => {
  let applyPagePersonalization;

  before(async () => {
    const module = await import('../../eds/scripts/personalization.js');
    applyPagePersonalization = module.applyPagePersonalization;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.cookie = 'partner_data=; Max-Age=0;';
    if (window.adobeIMS) delete window.adobeIMS;
  });

  it('should apply borderRadius style to profile image', async () => {
    // Setup DOM with profile image placeholder
    const main = document.createElement('main');
    main.innerHTML = '<p>$profileImage</p>';
    document.body.appendChild(main);

    // Setup partner cookie
    const cookieObject = { DXP: { status: 'MEMBER' } };
    document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;

    // Setup existing avatar image in DOM
    const mockImg = document.createElement('img');
    mockImg.className = 'feds-profile-img';
    mockImg.src = 'https://example.com/avatar.jpg';
    document.body.appendChild(mockImg);

    // Mock adobeIMS
    window.adobeIMS = {
      isSignedInUser: () => true,
    };

    // Execute personalization
    applyPagePersonalization();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify profile image was replaced with correct styling
    const picture = main.querySelector('picture');
    expect(picture).to.not.be.null;

    const img = picture.querySelector('img');
    expect(img).to.not.be.null;
    expect(img.src).to.equal('https://example.com/avatar.jpg');
    expect(img.style.borderRadius).to.equal('50%');
    expect(img.width).to.equal(96);
    expect(img.height).to.equal(96);
    expect(img.alt).to.equal('');
    expect(img.dataset.userProfile).to.equal('true');
  });
});
