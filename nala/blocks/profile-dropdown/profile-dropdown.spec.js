export default {
  features: [
    {
      name: '@dxp-user-profile-dropdown',
      path: '/digitalexperience/',
      tags: '@da-dx-profile-dropdown @regression @circleCi',
      data: {
        partnerLevel: 'dxp-platinum:',
        profileName: 'Yugo DX Stage Platinum',
        profileEmail: 'yugo-test-dx…@adobetest.com',
        profileJob: 'Product Engineering',
        accountName: 'DONOT USE Yugo DX Stage Platinum',
        partnerLevelDropdown: 'Platinum',
      },
    },
    {
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
      name: '@dxp-non-user-profile-dropdown-validation',
      path: '/digitalexperience/',
      tags: '@da-dx-profile-dropdown @regression @circleCi',
      data: {
        partnerLevel: 'cpp-distributor-india:',
        profileName: 'Yugo Stage CPP Distributor APAC India',
        profileEmail: 'yugo-stage-c…@yopmail.com',
        manageCompanyAccountLink: '/digitalexperience/home/',
        signOutLink: '/digitalexperience/',
      },
    },
  ],
};
