export default {
  features: [
    {
      tcid: '1',
      name: '@software-distribution-success-message-silver-user',
      path: '/digitalexperience/drafts/automation/regression/grant-download-access-test#',
      tags: '@da-dx-software-distribution @regression @circleCi',
      data: {
        partnerLevel: 'dxp-silver:',
        requestAccessLabel: 'Request access to Software Distribution',
        successMessage: 'Successful request.',
      },
    },
    {
      tcid: '2',
      name: '@software-distribution-fail-message-platinum-user',
      path: '/digitalexperience/drafts/automation/regression/grant-download-access-test#',
      tags: '@da-dx-software-distribution @regression @circleCi',
      data: {
        partnerLevel: 'dxp-platinum:',
        badRequestLabel: 'Example of a bad request',
        failMessage: 'Unsuccessful request.',
      },
    },
    {
      tcid: '3',
      name: '@software-distribution-submit-button-not-visible-public-user',
      path: '/digitalexperience/drafts/automation/regression/grant-download-access-test#',
      tags: '@da-dx-software-distribution @regression @anonymous @circleCi',
      data: { requestAccessLabel: 'Request access to Software Distribution' },
    },
  ],
};
