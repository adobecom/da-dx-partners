export default {
  FeatureName: 'DX Events',
  features: [
    {
      tcid: '1',
      name: '@events-public-page-load-validation',
      path: '/digitalexperience/drafts/automation/regression/events/attendees-events',
      tags: '@da-dx-events @regression @circleCi',
    },
    {
        tcid: '2',
        name: '@events-protected-page-load-validation',
        path: '/digitalexperience/drafts/automation/regression/events/attendees-events',
        tags: '@da-dx-events @regression @circleCi',
        data: { partnerLevel: 'da-dx-platinum:' }
    },
    {
        tcid: '3',
        name: '@events-protected-page-load-validation',
        path: '/digitalexperience/drafts/automation/regression/events/attendees-events',
        tags: '@da-dx-events @regression @circleCi',
        data: { partnerLevel: 'da-dx-platinum:' }
    },
  ],
};