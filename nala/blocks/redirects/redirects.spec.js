const DEMO_LINK = {
  stage: 'https://demo-stage.adobe.com/',
  main: 'https://demo.adobe.com/',
};

const ADOBE_LINK = {
  stage: 'https://stage.adobe.com/',
  main: 'https://adobe.com/',
};

export default {
  FeatureName: 'DXP Redirects',
  features: [
    {
      tcid: '1',
      name: '@redirects-links-validation-public-page',
      path: '/digitalexperience/drafts/automation/regression/links-rewrite/page-with-gnav',
      tags: '@da-dx-redirects @regression @circleCi @anonymous @da-dx-main',
      data: {
        benefitsCenterLink: '/benefits-center.html',
        experienceLeagueLink: '/en/home',
        menageUserLink: '/digitalexperience/home/manage-user',
        demoLink: DEMO_LINK,
        adobeLink: ADOBE_LINK,
      },
    },
    {
      tcid: '2',
      name: '@redirects-icon-links-validation-public-page',
      path: '/digitalexperience/drafts/automation/regression/links-rewrite/page-with-gnav',
      tags: '@da-dx-redirects @regression @circleCi @anonymous @da-dx-main',
      data: {
        benefitsCenterIconLink: '/benefits-center.html',
        bellIconLink: '/en/home',
        worldIconLink: '/digitalexperience/home/manage-user',
        menageUserIconLink: DEMO_LINK,
        homeIconLink: ADOBE_LINK,
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
