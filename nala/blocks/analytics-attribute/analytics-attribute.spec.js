export default {
  FeatureName: 'DX Analytics Attribute',
  features: [
    {
      tcid: '1',
      name: '@analytics-attribute-card-collection',
      path: '/digitalexperience/events/upcoming',
      tags: '@da-dx-analytics-attribute @regression @circleCi',
      data: {
        partnerLevel: 'dxp-platinum:',
        searchKeyWord: 'Adobe',
        filter: 'Products',
      },
    },
    {
      tcid: '2',
      name: '@analytics-attribute-search-page',
      path: '/digitalexperience/home/search/',
      tags: '@da-dx-analytics-attribute @regression @circleCi',
      data: {
        partnerLevel: 'dxp-platinum:',
        searchKeyWord: 'Adobe',
        filter: 'Products',
        checkBoxName: 'Adobe Analytics',
        daaLh: 'Search Cards Content | Filters: No Filters | Search Query: None',
        daaLhAfterSearch: 'Search Cards Content | Filters: Adobe Analytics | Search Query: Adobe',
      },
    },
  ],
};
