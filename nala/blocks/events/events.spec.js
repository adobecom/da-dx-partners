export default {
  FeatureName: 'DX Events',
  features: [
    {
      tcid: '1',
      name: '@events-public-page-load-validation',
      path: '/digitalexperience/drafts/automation/regression/events/attendees-events',
      tags: '@da-dx-events @regression @circleCi',
      data: { publicCardTitle: 'Public Level Event QA' }
    },
    {
        tcid: '2',
        name: '@events-protected-page-load-validation',
        path: '/digitalexperience/drafts/automation/regression/events/attendees-events',
        tags: '@da-dx-events @regression @circleCi',
        data: { partnerLevel: 'dxp-platinum:' }
    },
    {
        tcid: '3',
        name: '@events-access-platinum-event',
        path: '/digitalexperience/drafts/automation/regression/events/attendees-events',
        tags: '@da-dx-events @regression @circleCi',
        data: { 
          partnerLevel: 'dxp-platinum:',
          visibleCardTitle: 'Platinum Level Event QA',
          notVisibleCardTitle: 'Gold Level Event QA',
        }
    },
    {
      tcid: '4',
      name: '@events-access-gold-event',
      path: '/digitalexperience/drafts/automation/regression/events/attendees-events',
      tags: '@da-dx-events @regression @circleCi',
      data: { 
        partnerLevel: 'dxp-gold:',
        notVisibleCardTitle: 'Platinum Level Event QA',
        visibleCardTitle: 'Gold Level Event QA',
      }
  },
  ],
};