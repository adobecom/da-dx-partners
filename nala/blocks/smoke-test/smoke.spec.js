export default {
  FeatureName: 'DX Smoke Tests',
  features: [
    {
      tcid: '1',
      name: '@desc-dx-partner-directory-validate-access',
      testId: '@MWPW-168683',
      path: '/digitalexperience/join',
      // tags: '@dx-smoke-test',
    },
    {
      tcid: '2',
      name: '@desc-dx-partner-directory-validate-links',
      testId: '@MWPW-168683',
      // tags: '@dx-smoke-test',
      data: {
        contactUsDXURL: '/digitalexperience/contact.html',
        learnMoreDXURL: '/digitalexperience/about.html',
        visitAdobeExchangeURL: 'https://stage.exchange.adobe.com/',
      }
    },
    {
      tcid: '3',
      name: '@desc-dx-partner-directory-join-validate-links',
      testId: '@MWPW-168683',
      path: '/digitalexperience/join',
      // tags: '@dx-smoke-test',
      data: {
        learnMoreDXURL: '/digitalexperience/about.html',
        joinNowDXURL: '/digitalexperience/registration.html',
      }
    },
  ],
};
