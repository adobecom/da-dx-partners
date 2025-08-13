export default {
  FeatureName: 'DX Sign In Flow',
  features: [
    {
      tcid: '1',
      name: '@login-redirect-to-protected-home',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'spp-platinum:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/protected-home',
        expectedPublicURL: '/digitalexperience/drafts/automation/regression/public-page',
      },
    },
    {
      tcid: '2',
      name: '@login-redirection-to-spp-gold-page',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/gold-page',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'spp-gold:',
        expectedToSeeInURL: '/digitalexperience/drafts/automation/regression/gold-page',
      },
    },
    {
      tcid: '3',
      name: '@login-accessing-public-home-page-with-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      baseURL: 'http://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'spp-community:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/protected-home',
      },
    },
    {
      tcid: '4',
      name: '@login-accessing-restricted-home-page-with-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/protected-home',
      baseURL: 'http://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'spp-platinum:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/protected-home',
      },
    },
    {
      tcid: '5',
      name: '@login-accessing-public-page-with-non-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      baseURL: 'http://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/public-page',
      },
    },
    {
      tcid: '6',
      name: '@login-accessing-protected-page-with-non-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/protected-home',
      baseURL: 'http://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        expectedProtectedURL: '/digitalexperience/error/contact-not-found',
      },
    },
    {
      tcid: '7',
      name: '@login-accessing-publick-page-with-non-member-user',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        expectedToSeeInURL: '/digitalexperience/error/contact-not-found',
      },
    },
    {
      tcid: '8',
      name: '@login-accessing-protected-page-with-non-member-user-logged-in-partner-portal',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      protectedPageUrl: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/protected-home',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        expectedToSeeInURL: '/digitalexperience/drafts/automation/regression/protected-home',
      },
    },
    {
      tcid: '9',
      name: '@error-flow-abandoned-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'app-abandoned:',
        expectedToSeeInURL: '/digitalexperience/error/account-inactive',
      },
    },
    {
      tcid: '10',
      name: '@error-flow-terminated-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'app-terminated:',
        expectedToSeeInURL: '/digitalexperience/error/ineligible',
      },
    },
    {
      tcid: '11',
      name: '@error-flow-rejected-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'app-rejected:',
        expectedToSeeInURL: '/digitalexperience/error/decline',
      },
    },
    {
      tcid: '12',
      name: '@error-flow-non-member-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        expectedToSeeInURL: '/digitalexperience/error/contact-not-found',
      },
    },
    {
      tcid: '13',
      name: '@error-flow-404-user-case',
      path: ' https://partners.stage.adobe.com/digitalexperience/home-page',
      tags: '@da-dx-signin @regression @circleCi',
      data: {
        partnerLevel: 'spp-gold:',
        expectedToSeeInURL: '/digitalexperience/home-page',
      },
    },
  ],
};
