export default {
  features: [
    {
      tcid: '1',
      name: '@dxp-user-profile-dropdown',
      path: '/digitalexperience/',
      tags: '@da-dx-profile-dropdown @regression @circleCi',
      data: {
        partnerLevel: 'dxp-platinum:',
        profileName: 'DONOT USE Yugo DX Stage Platinum New',
        profileEmail: 'yugo-test+dx…@adobetest.com',
        profileJob: 'Product Management',
        accountName: 'DONOT USE Yugo DX Stage Platinum New',
        partnerLevelDropdown: 'Platinum',
      },
    },
    {
      tcid: '2',
      name: '@dxp-user-profile-dropdown-and-open-links',
      path: '/digitalexperience/',
      tags: '@da-dx-profile-dropdown @regression @circleCi',
      data: {
        partnerLevel: 'dxp-gold:',
        updateProfileLink: 'https://partners.stage.adobe.com/digitalexperience/home/manage-user#',
        manageCompanyAccountLink: 'https://partners.stage.adobe.com/digitalexperience/home/manage-company',
      },
    },
    {
      tcid: '3',
      name: '@dxp-non-user-profile-dropdown-validation',
      path: '/digitalexperience/',
      tags: '@da-dx-profile-dropdown @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        profileName: 'DONOT USE Yugo Stage Distributor India APAC',
        profileEmail: 'yugo-test+cp…@adobetest.com',
        manageCompanyAccountLink: '/digitalexperience/home/',
        signOutLink: '/digitalexperience/',
      },
    },
  ],
};
