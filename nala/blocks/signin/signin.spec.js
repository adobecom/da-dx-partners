export default {
  FeatureName: 'DX Sign In Flow',
  features: [
    {
      tcid: '1',
      name: '@login-redirect-to-protected-home',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      tags: '@da-dx-signin @regression @circleCi @anonymous',
      data: {
        partnerLevel: 'dx-platinum:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/protected-home',
        expectedPublicURL: '/digitalexperience/drafts/automation/regression/public-page',
      },
    },
    {
      tcid: '2',
      name: '@login-redirection-to-dx-gold-page',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/gold-page',
      tags: '@da-dx-signin @regression @circleCi @anonymous',
      data: {
        partnerLevel: 'dx-gold:',
        expectedToSeeInURL: '/digitalexperience/drafts/automation/regression/gold-page',
      },
    },
    {
      tcid: '3',
      name: '@login-accessing-public-home-page-with-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      baseURL: 'https://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi @anonymous',
      data: {
        partnerLevel: 'dx-community:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/protected-home',
      },
    },
    {
      tcid: '4',
      name: '@login-accessing-restricted-home-page-with-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/protected-home',
      baseURL: 'https://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi @anonymous',
      data: {
        partnerLevel: 'dx-platinum:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/protected-home',
      },
    },
    {
      tcid: '5',
      name: '@login-accessing-public-page-with-non-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/public-page',
      baseURL: 'https://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi @anonymous',
      data: {
        partnerLevel: 'dx-non-member:',
        expectedProtectedURL: '/digitalexperience/drafts/automation/regression/public-page',
      },
    },
    {
      tcid: '6',
      name: '@login-accessing-protected-page-with-non-member-user-logged-in-to-adobe',
      path: 'https://partners.stage.adobe.com/digitalexperience/drafts/automation/regression/protected-home',
      baseURL: 'https://www.stage.adobe.com?akamaiLocale=us',
      tags: '@da-dx-signin @regression @circleCi @anonymous',
      data: {
        partnerLevel: 'dx-non-member:',
        expectedProtectedURL: '/digitalexperience/error/contact-not-found',
      },
    },
  ],
};
