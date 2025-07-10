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
        contactUsSPURL: 'https://solutionpartners.stage2.adobe.com/solution-partners/contact.html',
        findPartnerSPURL: '/s/directory/solution',
        learnMoreSPURL: 'https://solutionpartners.stage2.adobe.com/solution-partners/about.html',
        contactUsTPURL: '/technologyprogram/experiencecloud/support.html',
        findPartnerTPURL: '/s/directory/technology',
        learnMoreTPURL: '/technologyprogram/experiencecloud/about.html',
        contactUsARURL: 'https://cbconnection-stage.adobe.com/en/apc-helpdesk',
        findPartnerARURL: 'https://adobe.my.salesforce-sites.com/PartnerSearch?lang=en',
        learnMoreARURL: '/na/channelpartners/program/',
        visitAdobeExchangeURL: 'https://stage.exchange.adobe.com/',
      }
    },
    {
      tcid: '3',
      name: '@desc-partner-directory-join-validate-links',
      testId: '@MWPW-168683',
      path: '/join',
      tags: '@da-dx-smoke-test',
      data: {
        learnMoreSPURL: 'https://solutionpartners.stage2.adobe.com/solution-partners/about.html',
        joinNowSPURL: 'https://solutionpartners.stage2.adobe.com/solution-partners/registration.html',
        learnMoreTPURL: '/technologyprogram/experiencecloud/about.html',
        joinNowTPURL: '/technologyprogram/experiencecloud/registration.html',
        learnMoreARURL: '/na/channelpartners/program/',
        joinNowARURL: '/na/channelpartners/enrollment/',
      }
    },
  ],
};
