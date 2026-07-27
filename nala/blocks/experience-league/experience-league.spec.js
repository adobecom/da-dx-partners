const PREVIEW_URL = 'https://experienceleague.stage.adobe.com/en/docs/advertising/dsp/home';

export default {
  FeatureName: 'Experience League Page',
  features: [
    {
      tcid: '1',
      name: '@experience-league-card-collection-metadata-validation',
      path: '/digitalexperience/drafts/automation/regression/experience-league-card-collection',
      tags: '@da-dx-card-collection @regression @circleCi @anonymous',
      data: {
        searchKeyword: 'Automation Regression Experience League Page',
        cardTitle: 'Automation Regression Experience League Page',
        expectedCardCount: 1,
        description: 'Automation Regression Description',
        cardDate: 'Jan 1,',
        cardImagePath: '/eds/automation-regression/images/chatgpt-image-apr-14-2026-01-21-00-pm.png',
        previewUrl: PREVIEW_URL,
        industryFilter: 'Industry',
        industryCheckbox: 'Media & Entertainment',
      },
    },
    {
      tcid: '2',
      name: '@experience-league-search-page-metadata-validation',
      path: '/digitalexperience/drafts/automation/regression/search-page?georouting=off&martech=off',
      tags: '@da-dx-search-page @da-dx-card-collection @regression @circleCi',
      data: {
        partnerLevel: 'dxp-community:',
        searchKeyword: 'Automation Regression Experience League Page',
        cardTitle: 'Automation Regression Experience League Page',
        description: 'Automation Regression Description',
        cardDate: 'Jan 1,',
        previewUrl: PREVIEW_URL,
        pageIconPath: '/eds/img/icons/html.svg',
        industryFilter: 'Industries',
        industryCheckbox: 'Media & Entertainment',
      },
    },
  ],
};
