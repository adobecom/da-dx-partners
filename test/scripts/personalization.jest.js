/**
 * @jest-environment jsdom
 */
import path from 'path';
import fs from 'fs';
import {
  DX_ACCESS_TYPE,
  DX_COMPLIANCE_STATUS,
  DX_DESIGNATION_TYPE,
  DX_PRIMARY_BUSINESS
} from "../../eds/blocks/utils/dxConstants.js";
jest.mock('./../../eds/libs/deps/purify-wrapper.js', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn(v => v),
  }
}));
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
    window.history.pushState({}, '', '/digitalexperience/');
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
        DXP: {
          status: 'MEMBER',
        },
      };
      const partnerInfo = { firstName: 'Test user' };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const placeholderElementAfter = document.querySelector('#welcome-firstname');
      expect(placeholderElementAfter.textContent.includes(partnerInfo.firstName)).toBe(true);
    });
  });
  it('Remove placeholder if user is not a member', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        CPP: {
          status: 'MEMBER',
        },
      };
      document.cookie = 'partner_info=; Max-Age=0;';
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
        DXP: {
          status: 'MEMBER',
          level: 'Gold',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const allLevelsBlock = document.querySelector('.partner-member');
      expect(allLevelsBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-level-gold block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          level: 'Gold'
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const goldBlock = document.querySelector('.partner-level-gold');
      expect(goldBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });

  it('Show Partner primary business Solution block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          primaryBusiness: [DX_PRIMARY_BUSINESS.SOLUTION]
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const businessSolutionBlock = document.querySelector('.partner-primary-business-solution');
      expect(businessSolutionBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Partner primary business Technology block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          primaryBusiness: [DX_PRIMARY_BUSINESS.TECHNOLOGY]
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const businessTechnologyBlock = document.querySelector('.partner-primary-business-technology');
      expect(businessTechnologyBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Access Type blocks', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          accessType: [DX_ACCESS_TYPE.BILLING_ADMIN, DX_ACCESS_TYPE.SALES_CENTER_ADMIN, DX_ACCESS_TYPE.ADMIN]
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({ firstName: 'Test use' })}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const billingAdminBlock = document.querySelector('.partner-billing-admin');
      expect(billingAdminBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
      const SalesCenterAdminBlock = document.querySelector('.partner-salescenter-admin');
      expect(SalesCenterAdminBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
      const adminBlock = document.querySelector('.partner-admin');
      expect(adminBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Access Type (user) block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          accessType: []
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const partnerUserBlock = document.querySelector('.partner-user');
      expect(partnerUserBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Access Type NOT Sales Center admin block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          accessType: [DX_ACCESS_TYPE.BILLING_ADMIN, DX_ACCESS_TYPE.ADMIN]
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const partnerNotSalesCenterBlock = document.querySelector('.partner-not-salescenter-admin');
      expect(partnerNotSalesCenterBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Designation Type blocks', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          designationType: [DX_DESIGNATION_TYPE.LEARNING_AND_DEVELOPMENT, DX_DESIGNATION_TYPE.LEGAL_AND_COMPLIANCE]
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const designationLearningBlock = document.querySelector('.partner-designation-learning');
      expect(designationLearningBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
      const designationLegalBlock = document.querySelector('.partner-designation-legal');
      expect(designationLegalBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Locked Compliance Not Completed block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          specialState: 'locked',
          purchasedPartnerLevel: 'Silver',
          complianceStatus: DX_COMPLIANCE_STATUS.NOT_COMPLETED
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const lockedComplianceNotCompletedBlock = document.querySelector('.partner-locked-compliance');
      expect(lockedComplianceNotCompletedBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
      const placeholderElementAfter = document.querySelector('.purchasedPartnerLevelHolder');
      expect(placeholderElementAfter.textContent.includes(cookieObject.DXP.purchasedPartnerLevel)).toBe(true);
    });
  });
  it('Show Locked Compliance Not Completed block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          specialState: 'locked',
          purchasedPartnerLevel: 'Silver',
          complianceStatus: DX_COMPLIANCE_STATUS.COMPLETED
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const lockedComplianceCompletedBlock = document.querySelector('.partner-locked-payment');
      expect(lockedComplianceCompletedBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
      const placeholderElementAfter = document.querySelector('.purchasedPartnerLevelHolderCoplianceCompleted');
      expect(placeholderElementAfter.textContent.includes(cookieObject.DXP.purchasedPartnerLevel)).toBe(true);
    });
  });
  it('Show Locked Compliance Expiry date in the past block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          specialState: 'locked-compliance-past',
          purchasedPartnerLevel: 'Silver',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const lockedCompliancePastBlock = document.querySelector('.partner-locked-compliance-past');
      expect(lockedCompliancePastBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Locked Compliance Expiry date in the future block (Missing payment)', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          specialState: 'locked-payment-future',
          purchasedPartnerLevel: 'Silver',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const lockedPaymentFutureBlock = document.querySelector('.partner-locked-payment-future');
      expect(lockedPaymentFutureBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show Submitted in Review block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          specialState: 'submitted-in-review',
          purchasedPartnerLevel: 'Silver',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const submittedInReviewBlock = document.querySelector('.partner-submitted-in-review');
      expect(submittedInReviewBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Show partner-level-platinum but don\'t show partner-level-gold block', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          level: 'Platinum'
        }
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
        DXP: {
          status: 'MEMBER',
          firstName: 'Test use',
          level: 'Platinum'
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
        DXP: {
          status: 'MEMBER',
          firstName: 'Test user',
          level: 'Silver'
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
        DXP: {
          status: 'MEMBER',
          firstName: 'Test user',
          level: 'gold',
          salesCenterAccess: true
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const block = document.querySelector('.partner-sales-access.partner-member');
      expect(block.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
    });
  });
  it('Hides content if user does not match all exclusive segments (AND logic)', () => {
    jest.isolateModules(() => {
      const cookieObject = {
        DXP: {
          status: 'MEMBER',
          firstName: 'Test user',
          level: 'gold',
          salesCenterAccess: false,
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      const { applyPagePersonalization } = importModules();
      applyPagePersonalization();
      const block = document.querySelector('.partner-sales-access.partner-member');
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
          DXP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            level: 'Platinum',
            accountName: 'Test account name',
            company: 'Test Company name',
          },
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const accountPlaceholder = gnav.querySelector('#test-account-placeholder');
        const companyPlaceholder = gnav.querySelector('#test-company-placeholder');
        const levelPlaceholder = gnav.querySelector('#test-level-placeholder');
        expect(companyPlaceholder.textContent).toEqual('$company');
        expect(accountPlaceholder.textContent).toEqual('$accountName');
        expect(levelPlaceholder.textContent).toEqual('$level');
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const companyPlaceholderUpdated = personalizedGnav.querySelector('#test-company-placeholder');
        const accountPlaceholderUpdated = personalizedGnav.querySelector('#test-account-placeholder');
        const levelPlaceholderUpdated = personalizedGnav.querySelector('#test-level-placeholder');
        expect(companyPlaceholderUpdated.textContent).toEqual('Test Company name');
        expect(accountPlaceholderUpdated.textContent).toEqual('Test account name');
        expect(levelPlaceholderUpdated.textContent).toEqual('Platinum');
        expect(levelPlaceholderUpdated.classList.contains('level-placeholder')).toBe(true);
        expect(accountPlaceholderUpdated.classList.contains('accountname-placeholder')).toBe(true);
        expect(companyPlaceholderUpdated.classList.contains('company-placeholder')).toBe(true);
      });
    });
    it('Show primary contact', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          DXP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            company: 'Test Company',
            level: 'Platinum',
            primaryContact: true,
          }
        };
        document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
        const { applyGnavPersonalization } = importModules();
        const personalizedGnav = applyGnavPersonalization(gnav);
        const primaryContact = personalizedGnav.querySelector('.primary-contact-wrapper');
        expect(primaryContact).toBeTruthy();
      });
    });
    it('Show sales center link', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          DXP: {
            status: 'MEMBER',
            firstName: 'Test Name',
            company: 'Test Company',
            level: 'Gold',
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
    it('Should hide partner-level-platinum gnav items for non-platinum user', () => {
      jest.isolateModules(() => {
        const cookieObject = {
          DXP: {
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
          DXP: {
            status: 'MEMBER',
            firstName: 'Test user',
          },
          level: 'Silver',
          salesCenterAccess: false,
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
    it('Remove once we have real tests agains', () => {
      jest.isolateModules(() => {
        let heading = gnav.querySelector('#sales-center');
        expect(heading).not.toBeNull();
      });
    });
  });

  describe('Profile Image and Company Logo Personalization', () => {
    const { applyPagePersonalization } = require('../../eds/scripts/personalization.js');

    beforeEach(() => {
      document.cookie = 'partner_data=';
      document.body.innerHTML = '';
      window.adobeIMS = {
        getAccessToken: jest.fn(() => ({ token: 'mock-token' })),
      };
      global.fetch = jest.fn();
    });

    afterEach(() => {
      delete window.adobeIMS;
      delete global.fetch;
      document.body.innerHTML = '';
      jest.restoreAllMocks();
    });

    it('should handle profileImage placeholder with existing DOM image', async () => {
      const main = document.createElement('main');
      main.innerHTML = '<p>$profileImage</p>';
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;

      const mockImg = document.createElement('img');
      mockImg.className = 'feds-profile-img';
      mockImg.src = 'https://example.com/avatar.jpg';
      document.body.appendChild(mockImg);

      window.adobeIMS.isSignedInUser = jest.fn(() => true);

      applyPagePersonalization();

      const event = new CustomEvent('feds:profileImageRendered');
      window.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).not.toHaveBeenCalled();

      const picture = main.querySelector('picture');
      expect(picture).not.toBeNull();
      expect(picture.querySelector('img')?.src).toBe('https://example.com/avatar.jpg');
    });

    it('should handle companyLogoUrl placeholder with companyLogoUrl in cookie', async () => {
      const main = document.createElement('main');
      main.innerHTML = '<div>$companyLogoUrl</div>';
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      const partnerInfo = {
        companyLogoUrl: 'https://example.com/logo.png',
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;

      applyPagePersonalization();

      await new Promise(resolve => setTimeout(resolve, 100));

      const img = main.querySelector('img[data-company-logo-url]');
      expect(img).not.toBeNull();
      expect(img.src).toBe('https://example.com/logo.png');
    });

    it('should handle missing signed in user for profileImage', async () => {
      const main = document.createElement('main');
      const placeholder = document.createElement('p');
      placeholder.textContent = '$profileImage';
      main.appendChild(placeholder);
      document.body.appendChild(main);

      window.adobeIMS.isSignedInUser = jest.fn(() => false);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;

      applyPagePersonalization();

      const event = new CustomEvent('feds:profileImageRendered');
      window.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).not.toHaveBeenCalled();
      expect(main.querySelector('p')).toBeNull();
    });

    it('should handle missing companyLogoUrl for companyLogoUrl', async () => {
      const main = document.createElement('main');
      main.innerHTML = '<div>$companyLogoUrl</div>';
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({})}`;

      applyPagePersonalization();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(main.querySelector('div')).toBeNull();
    });

    it('should handle missing avatar image in DOM for profileImage', async () => {
      const main = document.createElement('main');
      const placeholder = document.createElement('p');
      placeholder.textContent = '$profileImage';
      main.appendChild(placeholder);
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;

      window.adobeIMS.isSignedInUser = jest.fn(() => true);

      applyPagePersonalization();

      const event = new CustomEvent('feds:profileImageRendered');
      window.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).not.toHaveBeenCalled();
      expect(main.querySelector('p')).toBeNull();
    });

    it('should remove companyLogoUrl element when companyLogoUrl is missing', async () => {
      const main = document.createElement('main');
      main.innerHTML = '<div>$companyLogoUrl</div>';
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify({})}`;

      applyPagePersonalization();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(main.querySelector('div')).toBeNull();
    });

    it('should handle empty avatar src in DOM for profileImage', async () => {
      const main = document.createElement('main');
      const placeholder = document.createElement('p');
      placeholder.textContent = '$profileImage';
      main.appendChild(placeholder);
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;

      const mockImg = document.createElement('img');
      mockImg.className = 'feds-profile-img';
      document.body.appendChild(mockImg);

      window.adobeIMS.isSignedInUser = jest.fn(() => true);

      applyPagePersonalization();

      const event = new CustomEvent('feds:profileImageRendered');
      window.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).not.toHaveBeenCalled();
      expect(main.querySelector('p')).toBeNull();
    });

    it('should handle missing partner_info cookie for companyLogoUrl', async () => {
      const main = document.createElement('main');
      main.innerHTML = '<div>$companyLogoUrl</div>';
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      // No partner_info cookie set

      applyPagePersonalization();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(main.querySelector('div')).toBeNull();
    });


    it('should replace companyLogoUrl placeholder with image when companyLogoUrl exists', async () => {
      const main = document.createElement('main');
      const div = document.createElement('div');
      div.textContent = '$companyLogoUrl';
      main.appendChild(div);
      document.body.appendChild(main);

      const cookieObject = {
        DXP: {
          status: 'MEMBER',
        },
      };
      const partnerInfo = {
        companyLogoUrl: 'https://example.com/company-logo.png',
      };
      document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
      document.cookie = `partner_info=${JSON.stringify(partnerInfo)}`;

      applyPagePersonalization();

      await new Promise(resolve => setTimeout(resolve, 100));

      const picture = main.querySelector('picture');
      const img = main.querySelector('img[data-company-logo-url]');
      expect(picture).not.toBeNull();
      expect(img).not.toBeNull();
      expect(img.src).toBe('https://example.com/company-logo.png');
      expect(img.alt).toBe('Company Logo URL');
    });

  });

  describe('BCTQ Compliance Expiration Tests', () => {
    beforeEach(() => {
      document.cookie = 'partner_data=';
    });

    describe('getDaysUntilComplianceExpiration', () => {
      it('should return correct days remaining for future expiration date', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { getDaysUntilComplianceExpiration } = require('../../eds/scripts/utils.js');
          const days = getDaysUntilComplianceExpiration();
          expect(days).toBe(45);
        });
      });

      it('should return null for past expiration dates', () => {
        jest.isolateModules(() => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - 10);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: pastDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { getDaysUntilComplianceExpiration } = require('../../eds/scripts/utils.js');
          const days = getDaysUntilComplianceExpiration();
          expect(days).toBeNull();
        });
      });

      it('should return null when complianceExpiryDate is not provided', () => {
        jest.isolateModules(() => {
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { getDaysUntilComplianceExpiration } = require('../../eds/scripts/utils.js');
          const days = getDaysUntilComplianceExpiration();
          expect(days).toBeNull();
        });
      });

      it('should return null when user is not signed in', () => {
        jest.isolateModules(() => {
          document.cookie = 'partner_data=';
          const { getDaysUntilComplianceExpiration } = require('../../eds/scripts/utils.js');
          const days = getDaysUntilComplianceExpiration();
          expect(days).toBeNull();
        });
      });

      it('should round up partial days', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          // Set to 30.5 days in the future
          futureDate.setTime(futureDate.getTime() + (30.5 * 24 * 60 * 60 * 1000));
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { getDaysUntilComplianceExpiration } = require('../../eds/scripts/utils.js');
          const days = getDaysUntilComplianceExpiration();
          expect(days).toBe(31);
        });
      });
    });

    describe('isBctqExpiring', () => {
      it('should return true when compliance expires within 90 days and not locked', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 60);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          const isExpiring = isBctqExpiring(90);
          expect(isExpiring).toBe(true);
        });
      });

      it('should return true when compliance expires exactly on 90 days', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 90);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          const isExpiring = isBctqExpiring(90);
          expect(isExpiring).toBe(true);
        });
      });

      it('should return false when compliance expires in more than 90 days', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 120);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          const isExpiring = isBctqExpiring(90);
          expect(isExpiring).toBe(false);
        });
      });

      it('should return false when status is locked', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 60);
          const cookieObject = {
            DXP: {
              status: 'locked',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          const isExpiring = isBctqExpiring(90);
          expect(isExpiring).toBe(false);
        });
      });

      it('should return false when complianceExpiryDate is not available', () => {
        jest.isolateModules(() => {
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          const isExpiring = isBctqExpiring(90);
          expect(isExpiring).toBe(false);
        });
      });

      it('should work with different threshold values', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 25);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          expect(isBctqExpiring(30)).toBe(true);
          expect(isBctqExpiring(20)).toBe(false);
        });
      });
    });

    describe('Banner functions', () => {
      let mockGetMetadataContent;

      beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        mockGetMetadataContent = jest.fn();

        jest.doMock('../../eds/scripts/utils.js', () => ({
          ...jest.requireActual('../../eds/scripts/utils.js'),
          getMetadataContent: mockGetMetadataContent,
        }));

        document.body.innerHTML = '<main></main>';
        global.fetch = jest.fn();
      });

      afterEach(() => {
        jest.dontMock('../../eds/scripts/utils.js');
      });

      describe('getBctqBanner', () => {
        it('should return null when banner condition is not met', async () => {
          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = false;

          const { getBctqBanner } = require('../../eds/scripts/portalMessaging.js');
          const result = await getBctqBanner();

          expect(result).toBeNull();
          expect(mockGetMetadataContent).not.toHaveBeenCalled();
        });

        it('should warn and return when fragment path is missing', async () => {
          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

          mockGetMetadataContent.mockReturnValue(null);

          const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

          const { getBctqBanner } = require('../../eds/scripts/portalMessaging.js');
          await getBctqBanner();

          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('bctq-banner should be displayed but popup fragment path is not found')
          );
          expect(global.fetch).not.toHaveBeenCalled();

          consoleWarnSpy.mockRestore();
        });

        it('should warn and return when fragment content is not found', async () => {
          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

          mockGetMetadataContent.mockReturnValue('/fragments/bctq-banner');
          global.fetch.mockResolvedValue({
            ok: true,
            text: async () => '<main></main>',
          });

          const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

          const { getBctqBanner } = require('../../eds/scripts/portalMessaging.js');
          await getBctqBanner();

          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('Popup fragment for /fragments/bctq-banner not found')
          );

          consoleWarnSpy.mockRestore();
        });

        it('should return banner content when condition is met', async () => {
          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

          mockGetMetadataContent.mockReturnValue('/fragments/bctq-banner');
          global.fetch.mockResolvedValue({
            ok: true,
            text: async () => '<main><div class="bctq-banner">Banner content</div></main>',
          });

          const { getBctqBanner } = require('../../eds/scripts/portalMessaging.js');
          const result = await getBctqBanner();

          expect(result).not.toBeNull();
          expect(result.className).toBe('bctq-banner');
        });
      });

      describe('getGlobalBanner', () => {
        it('should warn and return when fragment path is missing', async () => {
          mockGetMetadataContent.mockReturnValue(null);

          const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

          const { getGlobalBanner } = require('../../eds/scripts/portalMessaging.js');
          const result = await getGlobalBanner();

          expect(result).toBeUndefined();
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('global-banner should be displayed but popup fragment path is not found')
          );

          consoleWarnSpy.mockRestore();
        });

        it('should return banner content when fragment exists', async () => {
          mockGetMetadataContent.mockReturnValue('/fragments/global-banner');
          global.fetch.mockResolvedValue({
            ok: true,
            text: async () => '<main><div class="global-banner">Global Banner</div></main>',
          });

          const { getGlobalBanner } = require('../../eds/scripts/portalMessaging.js');
          const result = await getGlobalBanner();

          expect(result).not.toBeNull();
          expect(result.className).toBe('global-banner');
        });
      });

      describe('prependContent', () => {
        it('should return early when main element is not found', async () => {
          document.body.innerHTML = '';

          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

          mockGetMetadataContent.mockReturnValue('/fragments/bctq-banner');
          global.fetch.mockResolvedValue({
            ok: true,
            text: async () => '<main><div>Banner content</div></main>',
          });

          const { prependContent } = require('../../eds/scripts/portalMessaging.js');
          await prependContent();
          // Should return early without error
        });

        it('should prepend bctq banner content to main', async () => {
          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

          mockGetMetadataContent.mockImplementation((type) => {
            if (type === 'bctq-banner') return '/fragments/bctq-banner';
            return null;
          });
          global.fetch.mockResolvedValue({
            ok: true,
            text: async () => '<main><div class="bctq-banner">Banner content</div></main>',
          });

          const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
          const mainElement = document.querySelector('main');
          const prependSpy = jest.spyOn(mainElement, 'prepend');

          const { prependContent } = require('../../eds/scripts/portalMessaging.js');
          await prependContent();

          const bctqCall = prependSpy.mock.calls.find(call => call[0]?.className === 'bctq-banner');
          expect(bctqCall).toBeTruthy();

          prependSpy.mockRestore();
          consoleWarnSpy.mockRestore();
        });

        it('should prepend both bctq and global banner content to main', async () => {
          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = true;

          mockGetMetadataContent.mockImplementation((type) => {
            if (type === 'bctq-banner') return '/fragments/bctq-banner';
            if (type === 'global-banner') return '/fragments/global-banner';
            return null;
          });
          global.fetch.mockImplementation((url) => {
            if (url === '/fragments/bctq-banner') {
              return Promise.resolve({
                ok: true,
                text: async () => '<main><div class="bctq-banner">BCTQ Banner</div></main>',
              });
            }
            if (url === '/fragments/global-banner') {
              return Promise.resolve({
                ok: true,
                text: async () => '<main><div class="global-banner">Global Banner</div></main>',
              });
            }
            return Promise.resolve({ ok: false });
          });

          const mainElement = document.querySelector('main');
          const prependSpy = jest.spyOn(mainElement, 'prepend');

          const { prependContent } = require('../../eds/scripts/portalMessaging.js');
          await prependContent();

          expect(prependSpy).toHaveBeenCalledTimes(3);
          expect(prependSpy.mock.calls[0][0].className).toBe('global-banner');
          expect(prependSpy.mock.calls[1][0].className).toBe('bctq-banner');

          prependSpy.mockRestore();
        });

        it('should prepend only global banner when bctq condition is not met', async () => {
          const { PERSONALIZATION_CONDITIONS } = require('../../eds/scripts/personalizationConfigDX.js');
          PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d'] = false;

          mockGetMetadataContent.mockImplementation((type) => {
            if (type === 'global-banner') return '/fragments/global-banner';
            return null;
          });
          global.fetch.mockResolvedValue({
            ok: true,
            text: async () => '<main><div class="global-banner">Global Banner</div></main>',
          });

          const mainElement = document.querySelector('main');
          const prependSpy = jest.spyOn(mainElement, 'prepend');

          const { prependContent } = require('../../eds/scripts/portalMessaging.js');
          await prependContent();

          expect(prependSpy).toHaveBeenCalledTimes(2);
          expect(prependSpy.mock.calls[0][0].className).toBe('global-banner');

          prependSpy.mockRestore();
        });

        it('should create and prepend notificationRibbon element to main', async () => {
          mockGetMetadataContent.mockReturnValue(null);
          global.fetch.mockResolvedValue({
            ok: true,
            text: async () => '<main><div>Content</div></main>',
          });

          const { prependContent } = require('../../eds/scripts/portalMessaging.js');
          await prependContent();

          const mainElement = document.querySelector('main');
          const notificationRibbon = document.getElementById('notificationRibbon');

          expect(notificationRibbon).not.toBeNull();
          expect(notificationRibbon.tagName).toBe('DIV');
          expect(mainElement.contains(notificationRibbon)).toBe(true);
          expect(mainElement.firstElementChild).toBe(notificationRibbon);
        });
      });
    });

    describe('partner-bctq-expiring-90d segment', () => {
      it('should show BCTQ expiring banner when compliance expires within 90 days', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          document.body.innerHTML += '<div class="partner-bctq-expiring-90d partner-personalization">BCTQ Expiring</div>';
          const { applyPagePersonalization } = importModules();
          applyPagePersonalization();
          const bctqBlock = document.querySelector('.partner-bctq-expiring-90d');
          expect(bctqBlock).not.toBeNull();
          expect(bctqBlock.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
        });
      });

      it('should not show BCTQ banner when compliance expires in more than 90 days', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 120);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          expect(isBctqExpiring(90)).toBe(false);
        });
      });

      it('should not show BCTQ banner when user is locked', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const cookieObject = {
            DXP: {
              status: 'locked',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { isBctqExpiring } = require('../../eds/scripts/utils.js');
          expect(isBctqExpiring(90)).toBe(false);
        });
      });
    });

    describe('bctqExpirationDays placeholder', () => {
      it('should populate bctqExpirationDays placeholder with correct days', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          document.body.innerHTML += '<div id="days-countdown">Your compliance expires in $bctqExpirationDays days</div>';
          const { applyPagePersonalization } = importModules();
          applyPagePersonalization();
          const countdown = document.querySelector('#days-countdown');
          expect(countdown.textContent).toContain('45');
          expect(countdown.textContent).not.toContain('$bctqExpirationDays');
          expect(countdown.textContent).toBe('Your compliance expires in 45 days');
        });
      });

      it('should remove element if bctqExpirationDays is null', () => {
        jest.isolateModules(() => {
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          document.body.innerHTML += '<div id="days-countdown">Your compliance expires in $bctqExpirationDays days</div>';
          const { applyPagePersonalization } = importModules();
          applyPagePersonalization();
          const countdown = document.querySelector('#days-countdown');
          expect(countdown).toBeNull();
        });
      });

      it('should not add key-placeholder class to element', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          document.body.innerHTML += '<div id="days-countdown">$bctqExpirationDays</div>';
          const { applyPagePersonalization } = importModules();
          applyPagePersonalization();
          const countdown = document.querySelector('#days-countdown');
          expect(countdown.classList.contains('bctqexpirationdays-placeholder')).toBe(false);
        });
      });
    });

    describe('Combined BCTQ segments', () => {
      it('should show admin-specific BCTQ banner for admins', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
              accessType: [DX_ACCESS_TYPE.ADMIN],
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          document.body.innerHTML += '<div class="partner-bctq-expiring-90d partner-admin partner-personalization">Admin BCTQ Banner</div>';
          const { applyPagePersonalization } = importModules();
          applyPagePersonalization();
          const adminBanner = document.querySelector('.partner-bctq-expiring-90d.partner-admin');
          expect(adminBanner.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
        });
      });

      it('should show user-specific BCTQ banner for non-admins', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
              accessType: [],
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          document.body.innerHTML += '<div class="partner-bctq-expiring-90d partner-user partner-personalization">User BCTQ Banner</div>';
          const { applyPagePersonalization } = importModules();
          applyPagePersonalization();
          const userBanner = document.querySelector('.partner-bctq-expiring-90d.partner-user');
          expect(userBanner.classList.contains(PERSONALIZATION_HIDE_CLASS)).toBe(false);
        });
      });

      it('should correctly identify admin users vs regular users', () => {
        jest.isolateModules(() => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 45);
          const cookieObject = {
            DXP: {
              status: 'MEMBER',
              complianceExpiryDate: futureDate.getTime().toString(),
              accessType: [DX_ACCESS_TYPE.ADMIN],
            },
          };
          document.cookie = `partner_data=${JSON.stringify(cookieObject)}`;
          const { partnerCookieContainsValue } = require('../../eds/scripts/utils.js');
          expect(partnerCookieContainsValue('accesstype', DX_ACCESS_TYPE.ADMIN)).toBe(true);
        });
      });
    });
  });
});
