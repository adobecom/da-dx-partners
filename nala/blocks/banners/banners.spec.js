export default {
  FeatureName: 'DX Banners',
  features: [
    {
      tcid: '1',
      name: '@banners-platinum-user-anyversery-date-in-next90-days',
      path: '/digitalexperience/drafts/automation/regression/public-page',
      tags: '@da-dx-banners @regression @anonymous',
      data: {
        partnerData: {
            partnerPortal: 'DXP',
            accessType: '["Billing Admin","Sales Center Admin","Admin"]',
            complianceStatus: 'Completed',
            daysToComplianceExpiry: 65,
            designationType: '["Legal and Compliance"]',
            email: 'yugo-test+dx-stage-platinum@adobetest.com',
            isAdmin: 'true',
            latestAgreementAccepted: 'true',
            latestAgreementAcceptedVersion: 'Feb 6, 2026',
            primaryBusiness: '["Solution"]',
            primaryContact: 'true',
            primaryJobRole: 'Product Management',
            purchasedPartnerLevel: 'Platinum',
            salesCenterAccess: 'true',
            status: 'MEMBER',
            partnerLevel: 'Platinum',
          },
          completeComplianceButtonLink: '/digitalexperience/m/manageprofile/companyinfo/information?open=compliance',
      },
    },
  ],
};