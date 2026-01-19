export default {
  FeatureName: 'DX Smoke Tests',
  features: [
    {
      tcid: '1',
      name: '@desc-partner-directory-validate-access',
      testId: '@MWPW-168683',
      path: '/join',
      tags: '@da-dx-smoke-test',
    },
    {
      tcid: '2',
      name: '@desc-partner-directory-validate-links',
      testId: '@MWPW-168683',
      tags: '@da-dx-smoke-test',
      data: {
        contactUsSPURL: '/solution-partners/contact.html',
        findPartnerSPURL: '/s/directory/solution',
        learnMoreSPURL: '/solution-partners/about.html',
        contactUsTPURL: '/technologyprogram/experiencecloud/support.html',
        findPartnerTPURL: '/s/directory/technology',
        learnMoreTPURL: '/technologyprogram/experiencecloud/about.html',
        contactUsARURL: '/en/apc-helpdesk',
        findPartnerARURL: '/channel?lang=en',
        learnMoreARURL: '/channelpartners/',
        visitAdobeExchangeURL: 'exchange.adobe.com/',
      },
    },
    {
      tcid: '3',
      name: '@desc-partner-directory-join-validate-links',
      testId: '@MWPW-168683',
      path: '/join',
      tags: '@da-dx-smoke-test',
      data: {
        learnMoreSPURL: '/solution-partners/about.html',
        joinNowSPURL: '/solution-partners/registration.html',
        learnMoreTPURL: '/technologyprogram/experiencecloud/about.html',
        joinNowTPURL: '/technologyprogram/experiencecloud/registration.html',
        learnMoreARURL: '/na/channelpartners/program/',
        joinNowARURL: '/na/channelpartners/enrollment/',
      },
    },
    {
      tcid: '4',
      name: '@smoke-test-become-a-partner',
      path: '/digitalexperience/?georouting=off&martech=off',
      tags: '@da-dx-smoke-test',
      data: {
        becomAPartnerUrl: '/digitalexperience/s/registration',
      }
    },
    {
      tcid: '5',
      name: '@smoke-test-find-a-partner-validation',
      path: '/digitalexperience/?georouting=off&martech=off',
      tags: '@da-dx-smoke-test',
      data: {
        findAPartnerUrl: '/s/directory/solution',
      }
    },
    {
      tcid: '6',
      name: '@smoke-test-analytics-card-collection-validation',
      path: '/digitalexperience/products/analytics?georouting=off&martech=off',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'dxp-platinum:',
      }
    },
    {
      tcid: '7',
      name: '@smoke-test-sale-center-home-button-validation',
      path: '/digitalexperience/?georouting=off&martech=off',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'dxp-gold:',
        expectedSaleCenterUrl: '/digitalexperience/m/salescenter/',
        homeUrl: '/digitalexperience/home/',
      }
    },
    {
      tcid: '8',
      name: '@smoke-test-non-member-user-loged-in-validation',
      path: '/digitalexperience/?georouting=off&martech=off',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        contactNotFoundUrl: '/digitalexperience/error/contact-not-found#',
      }
    },
    {
      tcid: '9',
      name: '@smoke-test-search-page-validation',
      path: '/digitalexperience/home/search/?georouting=off&martech=off',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'dxp-silver:',
        searchKeyword: 'Adobe',
      }
    },
    {
      tcid: '10',
      name: '@smoke-test-feedback-mechanism-validation',
      path: '/digitalexperience/?georouting=off&martech=off',
      tags: '@da-dx-smoke-test',
      data: {
        feedbackTitle: 'Rate this page',
        feedbackTextArea: 'Automation Test Keywords',
      }
    },
    {
      tcid: '11',
      name: '@smoke-test-error-flow-abandoned-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'dxp-abandoned:',
        expectedToSeeInURL: '/digitalexperience/error/account-inactive',
      },
    },
    {
      tcid: '12',
      name: '@smoke-test-error-flow-terminated-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'dxp-terminated:',
        expectedToSeeInURL: '/digitalexperience/error/ineligible',
      },
    },
    {
      tcid: '13',
      name: '@smoke-test-error-flow-rejected-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'dxp-rejected:',
        expectedToSeeInURL: '/digitalexperience/error/decline',
      },
    },
    {
      tcid: '14',
      name: '@smoke-test-error-flow-404-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/home-page',
      tags: '@da-dx-smoke-test',
      data: {
        partnerLevel: 'dxp-gold:',
        expectedToSeeInURL: '/digitalexperience/home-page',
      },
    },
  ],
};
