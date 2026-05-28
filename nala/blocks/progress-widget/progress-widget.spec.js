export default {
  features: [
    {
      tcid: '1',
      name: '@progress-widget-silver-user',
      path: '/digitalexperience/drafts/automation/regression/partnership-progress-widget?georouting=off&martech=off',
      tags: '@da-dx-progress-widget @regression @circleCi',
      data: {
        partnerLevel: 'dxp-silver:',
        progressionLevel: 'GOLD',
        widgetVisible: true,
        verifyFullBars: false,
      },
    },
    {
      tcid: '2',
      name: '@progress-widget-gold-user',
      path: '/digitalexperience/drafts/automation/regression/partnership-progress-widget?georouting=off&martech=off',
      tags: '@da-dx-progress-widget @regression @circleCi',
      data: {
        partnerLevel: 'dxp-gold-progress:',
        progressionLevel: 'PLATINUM',
        progressBars: [
          {
            label: 'Specializations',
            value: '60',
          },
          {
            label: 'Credentials',
            value: '30',
          },
          {
            label: 'Active Customer Deployments',
            value: '10',
          },
        ],
      },
    },
    {
      tcid: '3',
      name: '@progress-widget-platinum-user',
      path: '/digitalexperience/drafts/automation/regression/partnership-progress-widget?georouting=off&martech=off',
      tags: '@da-dx-progress-widget @regression @circleCi',
      data: {
        partnerLevel: 'dxp-platinum:',
        progressionLevel: 'PLATINUM',
      },
    },
    {
      tcid: '4',
      name: '@progress-widget-community-user',
      path: '/digitalexperience/drafts/automation/regression/partnership-progress-widget?georouting=off&martech=off',
      tags: '@da-dx-progress-widget @regression @circleCi',
      data: { partnerLevel: 'dxp-community:' },
    },
  ],
};
