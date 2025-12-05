import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

describe('brickProfilePicture', () => {
  let fetchStub;
  let imsStub;
  let consoleLogStub;
  let consoleWarnStub;

  const mockProfileData = {
    user: {
      avatar: 'https://pps-stage.services.adobe.com/api/profile/image/default/test-avatar.jpg',
      name: {
        notTruncated: 'Test User',
        trunctated25: 'Test User',
        trunctated10: 'Test User',
      },
    },
    sections: {},
  };

  beforeEach(() => {
    // Stub console.log and console.warn to avoid cluttering test output
    consoleLogStub = sinon.stub(console, 'log');
    consoleWarnStub = sinon.stub(console, 'warn');

    // Create mock IMS
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(false),
      getAccessToken: sinon.stub().returns({ token: 'mock-token' }),
      getProfile: sinon.stub().resolves({ email: 'test@test.com' }),
    };

    // Stub fetch
    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => {
    consoleLogStub.restore();
    consoleWarnStub.restore();
    fetchStub.restore();
    delete window.adobeIMS;
    document.body.innerHTML = '';
  });

  describe('initBrickProfilePicture', () => {
    it('should wait for IMS to be ready', async () => {
      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      
      // IMS not available yet
      delete window.adobeIMS;
      
      initBrickProfilePicture();
      
      // Add IMS after a delay
      await new Promise((resolve) => {
        setTimeout(() => {
          window.adobeIMS = {
            isSignedInUser: sinon.stub().returns(false),
            getAccessToken: sinon.stub().returns({ token: 'mock-token' }),
          };
          resolve();
        }, 150);
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
      
      expect(window.adobeIMS.isSignedInUser.called).to.be.true;
    });

    it('should not replace images if user is not signed in', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(false);

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const img = document.querySelector('img');
      expect(img).to.be.null;
    });

    it('should replace $profileImage placeholder when user is signed in', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img).to.exist;
      expect(img.src).to.equal(mockProfileData.user.avatar);
      expect(img.dataset.userProfile).to.equal('true');
    });

    it('should wrap profile image in picture element', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const picture = document.querySelector('picture');
      expect(picture).to.exist;
      
      const img = picture.querySelector('img');
      expect(img).to.exist;
      expect(img.width).to.equal(96);
      expect(img.height).to.equal(96);
    });

    it('should add icon-area class to parent paragraph', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const paragraph = document.querySelector('p');
      expect(paragraph.classList.contains('icon-area')).to.be.true;
    });

    it('should handle multiple bricks', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
        <div class="brick">
          <p>$profileImage</p>
        </div>
        <div class="brick">
          <p>Some other text</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const images = document.querySelectorAll('img[data-user-profile="true"]');
      expect(images.length).to.equal(2);
    });

    it('should not replace hardcoded images', async () => {
      const hardcodedSrc = 'https://example.com/hardcoded.jpg';
      document.body.innerHTML = `
        <div class="brick">
          <p class="icon-area">
            <picture>
              <img src="${hardcodedSrc}" alt="Hardcoded Image">
            </picture>
          </p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img.src).to.equal(hardcodedSrc);
    });

    it('should use correct environment URL for stage', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      // Note: window.location.hostname is already 'localhost' in test environment
      // which triggers stage environment

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(fetchStub.calledOnce).to.be.true;
      const fetchUrl = fetchStub.firstCall.args[0];
      expect(fetchUrl).to.include('cc-collab-stage.adobe.io');
    });

    it('should fetch profile data with authorization header', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(fetchStub.calledOnce).to.be.true;
      const fetchCall = fetchStub.firstCall;
      const fetchUrl = fetchCall.args[0];
      const fetchOptions = fetchCall.args[1];
      
      // Verify URL is correct
      expect(fetchUrl).to.include('cc-collab');
      expect(fetchUrl).to.include('/profile');
      
      // Verify authorization header is sent
      expect(fetchOptions.headers.get('Authorization')).to.equal('Bearer mock-token');
    });

    it('should handle missing access token', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      window.adobeIMS.getAccessToken.returns(null);

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img).to.be.null;
    });

    it('should handle profile fetch failure', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 500,
        json: async () => ({}),
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img).to.be.null;
    });

    it('should handle missing avatar in profile response', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => ({ user: {} }),
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img).to.be.null;
    });

    it('should handle network errors gracefully', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.rejects(new Error('Network error'));

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img).to.be.null;
    });

    it('should only replace first occurrence per brick', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const images = document.querySelectorAll('img[data-user-profile="true"]');
      expect(images.length).to.equal(1);
      
      // Second placeholder should remain as text
      const paragraphs = document.querySelectorAll('p');
      const hasPlaceholder = Array.from(paragraphs).some(p => p.textContent.includes('$profileImage'));
      expect(hasPlaceholder).to.be.true;
    });

    it('should listen for sign-in events', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>$profileImage</p>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(false);

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // User signs in
      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      // Trigger sign-in event
      window.dispatchEvent(new Event('feds:signIn'));

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img).to.exist;
      expect(img.src).to.equal(mockProfileData.user.avatar);
    });

    it('should not process bricks without $profileImage placeholder', async () => {
      document.body.innerHTML = `
        <div class="brick">
          <p>Regular text content</p>
          <h2>Heading</h2>
        </div>
      `;

      window.adobeIMS.isSignedInUser.returns(true);
      fetchStub.resolves({
        status: 200,
        json: async () => mockProfileData,
      });

      const { initBrickProfilePicture } = await import('../../eds/scripts/brickProfilePicture.js');
      initBrickProfilePicture();

      await new Promise((resolve) => setTimeout(resolve, 300));

      const img = document.querySelector('img');
      expect(img).to.be.null;
    });
  });
});
