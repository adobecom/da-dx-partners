/**
 * @jest-environment jsdom
 */
import path from 'path';
import fs from 'fs';

const PERSONALIZATION_HIDE_CLASS = 'personalization-hide';

function importModules() {
  // eslint-disable-next-line global-require
  const { applyPagePersonalization, applyGnavPersonalization } = require('../../eds/scripts/personalization.js');
  jest.mock('../../eds/blocks/utils/utils.js', () => ({ getConfig: jest.fn(() => ({ env: { name: 'stage' } })) }));

  return { applyPagePersonalization, applyGnavPersonalization };
}

describe('Test personalization.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window = Object.create(window);
    Object.defineProperties(window, {
      location: {
        value: { pathname: '/solutionpartners/', hostname: 'partners.adobe.com' },
        writable: true,
      },
    });
    document.body.innerHTML = fs.readFileSync(
      path.resolve(__dirname, './mocks/personalization.html'),
      'utf8',
    );
    document.cookie = 'partner_data=';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });
  it('Populate placeholder if user is a member', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test user',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const placeholderElementAfter = document.querySelector('#welcome-firstname');
      expect(placeholderElementAfter.textContent.includes(cookieObject.SPP.firstName)).toBe(true);
    });
  });
  it('Remove placeholder if user is not a member', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        CPP: {
          status: 'MEMBER',
          firstName: 'Test use',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const placeholderElementAfter = document.querySelector('#welcome-firstname');
      expect(placeholderElementAfter).toBe(null);
    });
  });
  it('Show partner-not-signed-in block', () => {
    jest.isolateModules(() => {
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const notSignedInBlock = document.querySelector('.partner-not-signed-in');
      expect(notSignedInBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });

  it('Show partner-not-member block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        CPP: {
          status: 'MEMBER',
          firstName: 'Test use',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const notMemberBlock = document.querySelector('.partner-not-member');
      expect(notMemberBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-member block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test use',
          level: 'Gold',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const allLevelsBlock = document.querySelector('.partner-member');
      expect(allLevelsBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-level-gold block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test use',
          level: 'Gold',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const goldBlock = document.querySelector('.partner-level-gold');
      expect(goldBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-level-platinum but don\'t show partner-level-gold block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test use',
          level: 'Platinum',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const goldBlock = document.querySelector('.partner-level-gold');
      const platinumBlock = document.querySelector('.partner-level-platinum');
      expect(platinumBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
      expect(goldBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(true);
    });
  });
  it('Show partner-level-platinum section', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test use',
          level: 'Platinum',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const platinumBlock = document.querySelector('#platinum-section');
      expect(platinumBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Shows content if user matches any of multiple partner-level segments (OR logic)', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test user',
          level: 'Silver',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const block = document.querySelector('.partner-level-silver.partner-level-gold');
      expect(block.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Shows content only if user matches all exclusive segments (AND logic)', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test user',
          level: 'gold',
          salesCenterAccess: true,
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const block = document.querySelector('.partner-sales-access.partner-spp-member');
      expect(block.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });

  it('Hides content if user does not match all exclusive segments (AND logic)', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        SPP: {
          status: 'MEMBER',
          firstName: 'Test user',
          level: 'gold',
          salesCenterAccess: false,
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const block = document.querySelector('.partner-sales-access.partner-spp-member');
      expect(block.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(true);
    });
  });
  describe('Gnav personalization', () => {
    const parser = new DOMParser();
    let gnav;
    beforeEach(() => {
      const gnavString = fs.readFileSync(
        path.resolve(__dirname, './mocks/gnav-personalization.html'),
        'utf8',
      );
      gnav = parser.parseFromString(gnavString, 'text/html');
      document.importNode = (node) => node;
    });
    afterEach(() => {
      gnav = null;
    });
    it('Replaces profile dropdown placeholders', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            level: 'Platinum',
            accountName: 'Test Company',
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const companyPlaceholder = gnav.querySelector('#test-company-placeholder');
        const levelPlaceholder = gnav.querySelector('#test-level-placeholder');
        expect(companyPlaceholder.textContent).toEqual('$spp-accountName');
        expect(levelPlaceholder.textContent).toEqual('$spp-level');
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const companyPlaceholderUpdated = personalizedGnav.querySelector('#test-company-placeholder');
        const levelPlaceholderUpdated = personalizedGnav.querySelector('#test-level-placeholder');
        expect(companyPlaceholderUpdated.textContent).toEqual('Test Company');
        expect(levelPlaceholderUpdated.textContent).toEqual('Platinum');
      });
    });
    it('Show primary contact', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            level: 'Platinum',
            company: 'Test Company',
            primaryContact: true,
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const primaryContact = personalizedGnav.querySelector('.primary-contact-wrapper');
        expect(primaryContact).toBeTruthy();
      });
    });
    it('Show renew expired', () => {
      jest.isolateModules(() => {
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() + 30);
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            level: 'Gold',
            company: 'Test Company',
            primaryContact: true,
            accountAnniversary: expiredDate,
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const renewExpired = personalizedGnav.querySelector('.partner-expired');
        expect(renewExpired.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBeFalsy();
      });
    });
    it('Show renew suspended', () => {
      jest.isolateModules(() => {
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() - 30);
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            level: 'Gold',
            company: 'Test Company',
            primaryContact: true,
            accountAnniversary: expiredDate,
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const renewExpired = personalizedGnav.querySelector('.partner-suspended');
        expect(renewExpired.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBeFalsy();
      });
    });

    it('Show sales center link', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            level: 'Gold',
            company: 'Test Company',
            primaryContact: true,
            salesCenterAccess: true,
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const salesCenterLink = gnav.querySelector('#sales-link');
        const { applyGnavPersonalization } = importModules();
        applyGnavPersonalization(gnav);
        expect(salesCenterLink.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBeFalsy();
      });
    });
    it('Do not hide sales center link if it is marked with partner-tpp-account and user has access to sales center on spp or tpp program', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            level: 'Gold',
            company: 'Test Company',
            primaryContact: true,
            salesCenterAccess: true,
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const salesCenterLink = gnav.querySelector('#manage-profile-link');
        const { applyGnavPersonalization } = importModules();
        applyGnavPersonalization(gnav);
        expect(salesCenterLink.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBeFalsy();
      });
    });
    it('Should hide partner-level-platinum gnav items for non-platinum user', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test user',
            level: 'Silver',
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const { applyGnavPersonalization } = importModules();

        let platinumText = gnav.querySelector('#text-platinum');
        const anchorsFilterPredicate = (el) => el.textContent.includes('cta primary platinum') || el.textContent.includes('cta secondary platinum') || el.textContent.includes('link platinum');
        let anchorsArray = Array.from(gnav.querySelectorAll('a')).filter(anchorsFilterPredicate);

        expect(platinumText).not.toBeNull();
        expect(anchorsArray.length).toBe(3);

        const result = applyGnavPersonalization(gnav);

        platinumText = result.querySelector('#text-platinum');
        anchorsArray = Array.from(gnav.querySelectorAll('a')).filter(anchorsFilterPredicate);

        expect(platinumText).toBeNull();
        expect(anchorsArray.length).toBe(0);
      });
    });

    it('Should hide partner-sales-access gnav items for users without sales center access', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          SPP: {
            status: 'MEMBER',
            firstName: 'Test user',
            level: 'Silver',
            salesCenterAccess: false,
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const { applyGnavPersonalization } = importModules();

        let heading = gnav.querySelector('#sales-center');
        let list = gnav.querySelector('#sales-center + ul');

        expect(heading).not.toBeNull();
        expect(list).not.toBeNull();

        const result = applyGnavPersonalization(gnav);

        heading = result.querySelector('#sales-center');
        list = result.querySelector('#sales-center + ul');

        expect(heading).toBeNull();
        expect(list).toBeNull();
      });
    });
  });
});
