export default {
  FeatureName: 'Gnav Personalisation',
  features: [
    {
      tcid: '1',
      name: '@gnav-personalisation-non-logged-in-user-accsess',
      path: '/digitalexperience/drafts/automation/regression/personalization/page-with-gnav',
      tags: '@da-dx-personalisation @regression @anonymous @circleCi',
      data: {
        segmentText: '(NOT) Partner NOT member :',
      }
    },
    {
        tcid: '2',
        name: '@gnav-personalisation-logged-in-platinum-user-accsess',
        path: '/digitalexperience/drafts/automation/regression/personalization/page-with-gnav',
        tags: '@da-dx-personalisation @regression @anonymous',
        data: {
            segmentText: 'Partner member :',
            partnerData: {
                partnerPortal: 'DXP',
                partnerLevel: 'Platinum',
            }
        }
    }
  ],
};