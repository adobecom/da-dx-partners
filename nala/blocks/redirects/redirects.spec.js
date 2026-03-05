export default {
  FeatureName: 'DXP Redirects',
  features: [
    {
      tcid: '1',
      name: '@redirects-links-validation-public-page',
      path: '/digitalexperience/drafts/automation/regression/links-rewrite/page-with-gnav',
      tags: '@da-dx-redirects @regression @circleCi @anonymous',
      data: {
        benefitsCenterLink: 'https://pp-staging.adobe.com/benefits-center.html',
        experienceLeagueLink: 'https://experienceleague.stage.adobe.com/en/home',
        menageUserLink: 'https://partners.stage.adobe.com/digitalexperience/home/manage-user',
        demoLink: 'https://demo-stage.adobe.com/',
        adobeLink: 'https://stage.adobe.com/',
      }
    },
    {
      tcid: '2',
      name: '@redirects-icon-links-validation-public-page',
      path: '/digitalexperience/drafts/automation/regression/links-rewrite/page-with-gnav',
      tags: '@da-dx-redirects @regression @circleCi @anonymous',
      data: {
        benefitsCenterIconLink: 'https://pp-staging.adobe.com/benefits-center.html',
        bellIconLink: 'https://experienceleague.stage.adobe.com/en/home',
        worldIconLink: 'https://partners.stage.adobe.com/digitalexperience/home/manage-user',
        menageUserIconLink: 'https://demo-stage.adobe.com/',
        homeIconLink: 'https://stage.adobe.com/',
      },
    },
    {
      tcid: '3',
      name: '@redirects-links-validation-protected-page',
      path: '/digitalexperience/drafts/automation/regression/links-rewrite/page-with-gnav',
      tags: '@da-dx-redirects @regression @circleCi',
      data: {
        partnerLevel: 'dxp-platinum:',
        benefitsCenterLink: 'https://pp-staging.adobe.com/benefits-center.html',
        bellIconLink: 'https://experienceleague.stage.adobe.com/en/home',
        demoLink: 'https://demo-stage.adobe.com/',
        experienceLeagueLink: 'https://experienceleague.stage.adobe.com/en/home',
        menageUserLink: 'https://partners.stage.adobe.com/digitalexperience/home/manage-user',
        adobeLink: 'https://stage.adobe.com/',
      },
    },
  ],
};