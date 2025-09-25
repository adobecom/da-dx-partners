import { getLocale, prodHosts, setLibs } from '../../scripts/utils.js';
import { RT_SEARCH_ACTION_PATH } from './dxConstants.js';

const miloLibs = setLibs('/libs');

const { createTag, localizeLink, getConfig } = await import(`${miloLibs}/utils/utils.js`);

export { createTag, localizeLink, getConfig };
const { replaceText } = await import(`${miloLibs}/features/placeholders.js`);
export { replaceText };

/**
 * TODO: This method will be deprecated and removed in a future version.
 * @see https://jira.corp.adobe.com/browse/MWPW-173470
 * @see https://jira.corp.adobe.com/browse/MWPW-174411
 */
export const shouldAllowKrTrial = (button, localePrefix) => {
  const allowKrTrialHash = '#_allow-kr-trial';
  const hasAllowKrTrial = button.href?.includes(allowKrTrialHash);
  if (hasAllowKrTrial) {
    button.href = button.href.replace(allowKrTrialHash, '');
    const modalHash = button.getAttribute('data-modal-hash');
    if (modalHash) button.setAttribute('data-modal-hash', modalHash.replace(allowKrTrialHash, ''));
  }
  return localePrefix === '/kr' && hasAllowKrTrial;
};

/**
 * TODO: This method will be deprecated and removed in a future version.
 * @see https://jira.corp.adobe.com/browse/MWPW-173470
 * @see https://jira.corp.adobe.com/browse/MWPW-174411
 */

export const shouldBlockFreeTrialLinks = ({ button, localePrefix, parent }) => {
  if (shouldAllowKrTrial(button, localePrefix) || localePrefix !== '/kr'
    || (!button.dataset?.modalPath?.includes('/kr/cc-shared/fragments/trial-modals')
      && !['free-trial', 'free trial', '무료 체험판', '무료 체험하기', '{{try-for-free}}']
        .some((pattern) => button.textContent?.toLowerCase()?.includes(pattern.toLowerCase())))) {
    return false;
  }

  if (button.dataset.wcsOsi) {
    button.classList.add('hidden-osi-trial-link');
    return false;
  }

  const elementToRemove = (parent?.tagName === 'STRONG' || parent?.tagName === 'EM') && parent?.children?.length === 1 ? parent : button;
  elementToRemove.remove();
  return true;
};

export function populateLocalizedTextFromListItems(el, localizedText) {
  const liList = Array.from(el.querySelectorAll('li'));
  liList.forEach((liEl) => {
    const liInnerText = liEl.innerText;
    if (!liInnerText) return;
    let liContent = liInnerText.trim().toLowerCase().replace(/ /g, '-');
    if (liContent.endsWith('_default')) liContent = liContent.slice(0, -8);
    localizedText[`{{${liContent}}}`] = liContent;
  });
}
export async function localizationPromises(localizedText, config) {
  return Promise.all(Object.keys(localizedText).map(async (key) => {
    const value = await replaceText(key, config);
    if (value.length) {
      localizedText[key] = value;
    }
  }));
}

export function getRuntimeActionUrl(action) {
  const { env } = getConfig();
  let domain = 'https://io-partners-dx.stage.adobe.com';
  if (env.name === 'prod') {
    domain = 'https://io-partners-dx.adobe.com';
  }
  return new URL(
    `${domain}${action}`,
  );
}

export function generateRequestForSearchAPI(pageOptions, body) {
  const { locales } = getConfig();
  const url = getRuntimeActionUrl(RT_SEARCH_ACTION_PATH);
  const localesData = getLocale(locales);
  const queryParams = new URLSearchParams(url.search);
  // queryParams.append('geo', localesData.prefix && localesData.region);
  queryParams.append('language', localesData.ietf); // en-US

  // eslint-disable-next-line array-callback-return
  Object.keys(pageOptions).map((option) => {
    queryParams.append(option, pageOptions[option]);
  });

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  return fetch(url + queryParams, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include', // UNCOMMENT FOR PROD
  });
  // const mockCards = {
  //   "cards": [
  //     {
  //       "id": "78a9286d9b797ad40f633c76063b11b0",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Adobe Journey Optimizer Experimentation Accelerator: Technical Enablement",
  //         "url": "https://ajo-exp-accelerator2025.solutionpartners.adobeevents.com/",
  //         "description": "In this session, we’ll cover:\n\n\tExperimentation\n     Accelerator launch overview and timelines\n\tTechnical\n     enablement and deployment methods\n\tBest\n     practices for Target and Journey Optimizer implementations\n\tNew\n     sales and partner resources available for activation\n\n\n\t\n\n\n\t\n\n\n\t\n\nThe objective of this call is to ensure our Adobe partners\nwalk away with a comprehensive understanding of the technical implementation\ndetails for Journey Optimizer Experimentation Accelerator so you can\nconfidently accelerate services business growth and client adoption!\n",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-23T17:08:07Z",
  //       "modifiedDate": "2025-09-23T17:08:07Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:region": "apac"
  //         },
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:region": "japan"
  //         },
  //         {
  //           "caas:products": "adobe-journey-optimizer"
  //         },
  //         {
  //           "caas:products": "adobe-target"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "27ecc03513262daddd168512914cfdd7",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Adobe Real-Time CDP: Composability in Action",
  //         "url": "https://rtcdp-composability-oct2025.solutionpartners.adobeevents.com/",
  //         "description": "In this exclusive partner session, we'll break down what composability means for your data strategy and show how leading brands are putting it into practice.\nThis session will cover the following key topics:\n•\tCDP trends: Understand how CDPs are evolving to handle more data from diverse sources, requiring intelligent action and flexible access to enterprise data for real-time personalization and marketing activation.\n•\tData composability: Learn about the blend of ingestion and federation approaches in modern CDPs, which leverage existing enterprise data warehouses without redundant data copies. This balance addresses latency, use case needs, and data governance.\n•\tFederated Audience ComT's operational efficiency gains.\nThis session is for partners who are looking to enhance their understanding of CDPs and data composability. By the end of the session, participants will have a comprehensive understanding of how to leverage these technologies to improve customer engagement and drive business success.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-16T09:13:32Z",
  //       "modifiedDate": "2025-09-16T09:13:32Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:region": "apac"
  //         },
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:region": "japan"
  //         },
  //         {
  //           "caas:products": "adobe-real-time-cdp"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "a22157674ee6b7af31cd346711cedd1d",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Full visibility, zero surprises: Observability across Adobe Commerce as a Cloud Service infrastructure (AMER/EMEA)",
  //         "url": "https://commerce-techdeepdive-june25.solutionpartners.adobeevents.com/",
  //         "description": "From CDN tuning and WAF configuration to debugging in App Builder, this session offers a deep dive into monitoring and observability across Adobe Commerce as a Cloud Service and Adobe Commerce Optimizer. Learn how to proactively detect issues, troubleshoot with precision, and maintain optimal storefront performance with the right tools and insights at your fingertips.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-15T16:03:26Z",
  //       "modifiedDate": "2025-09-15T16:03:26Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:products": "adobe-commerce"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "6442c6b381ec865cda97a421dd9db304",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Checkout starter kit: Streamline payments, shipping, and taxes (AMER/EMEA)",
  //         "url": "https://commerce-techdeepdive-june25.solutionpartners.adobeevents.com/",
  //         "description": "Learn how to simplify and speed up your checkout\nintegrations using the Adobe Commerce checkout starter kit. In this session,\nwe’ll cover how to connect payments, shipping, and tax services seamlessly\nwhile reducing custom code and complexity. Walk away with best practices that\nhelp you deliver a faster, frictionless checkout experience for your customers.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-15T16:03:26Z",
  //       "modifiedDate": "2025-09-15T16:03:26Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:products": "adobe-commerce"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "9fbacf19bf9fbb16287e80d4f65d83d2",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Full visibility, zero surprises: Observability across Adobe Commerce as a Cloud Service infrastructure (APAC)",
  //         "url": "https://apac-commerce-techdeepdive-july25.solutionpartners.adobeevents.com/",
  //         "description": "From CDN tuning and WAF configuration to debugging in App Builder, this session offers a deep dive into monitoring and observability across Adobe Commerce as a Cloud Service and Adobe Commerce Optimizer. Learn how to proactively detect issues, troubleshoot with precision, and maintain optimal storefront performance with the right tools and insights at your fingertips.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-15T16:03:23Z",
  //       "modifiedDate": "2025-09-15T16:03:23Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "apac"
  //         },
  //         {
  //           "caas:region": "japan"
  //         },
  //         {
  //           "caas:products": "adobe-commerce"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "82074556dcd80ccbc83dc59bd0b56c03",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Checkout starter kit: Streamline payments, shipping, and taxes (APAC)",
  //         "url": "https://apac-commerce-techdeepdive-july25.solutionpartners.adobeevents.com/",
  //         "description": "Learn how to simplify and speed up your checkout\nintegrations using the Adobe Commerce checkout starter kit. In this session,\nwe’ll cover how to connect payments, shipping, and tax services seamlessly\nwhile reducing custom code and complexity. Walk away with best practices that\nhelp you deliver a faster, frictionless checkout experience for your customers.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-15T16:03:23Z",
  //       "modifiedDate": "2025-09-15T16:03:23Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "apac"
  //         },
  //         {
  //           "caas:region": "japan"
  //         },
  //         {
  //           "caas:products": "adobe-commerce"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "9045678144f55e1fc8e10d88632ba9f7",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Option 1 | Adobe Corp. Enterprise Deal Registration Training (AMER and EMEA)",
  //         "url": "https://training1.solutionpartners.adobeevents.com/",
  //         "description": "Join us for Solution Partner Program Deal Registration Training. Partners should attend when onboarding and at least once per year.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-10T21:48:20Z",
  //       "modifiedDate": "2025-09-10T21:48:20Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:region": "apac"
  //         },
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:region": "japan"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "3027da0e2ff016fae029c9c96b409b50",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Option 2 | Adobe Corp. Enterprise Deal Registration Training (APAC & Japan)",
  //         "url": "https://training1.solutionpartners.adobeevents.com/",
  //         "description": "Join us for Solution Partner Program Deal Registration Training. Partners should attend when onboarding and at least once per year.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-10T21:48:20Z",
  //       "modifiedDate": "2025-09-10T21:48:20Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:region": "apac"
  //         },
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:region": "japan"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "5fc0d61df19e26a514bbd9b89bbda7b5",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Developers Live - Adobe Experience Manager and Adobe Commerce",
  //         "url": "https://aem-commerce-devlive2025.solutionpartners.adobeevents.com/",
  //         "description": "Mark your calendars and join us at Adobe Founders Tower in San Jose on November 10-11, 2025.\nEverything is bigger and better this year with more opportunities for Adobe customers, partners and the curious, to connect and engage with Adobe product teams and each other. This year we are adding hands-on sessions to the excellent lineup of can’t miss sessions for developers, architects, and technical professionals building solutions in the Adobe ecosystem.\nThis event unites the Adobe developer community to explore the future of content and commerce, covering Adobe Experience Manager, Adobe Commerce and featuring Edge Delivery Services.",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-10T02:55:12Z",
  //       "modifiedDate": "2025-09-10T02:55:12Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:products": "adobe-commerce"
  //         },
  //         {
  //           "caas:products": "adobe-experience-manager"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "904b8fe9781486831c48346d41b818b9",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Middle East Partner Townhall",
  //         "url": "https://middle-east-townhall.solutionpartners.adobeevents.com/",
  //         "description": "This Middle East Partner Townhall marks the launch of a new series designed to bring partners across the region together.\nJoin Adobe leaders and fellow partners for updates on what’s happening in the Middle East, insights into the value of the Adobe ecosystem, and a spotlight on key solutions and use cases. The session will close with an open Q&A, giving you the chance to engage directly with Adobe experts.\nAgenda: \n•\tWelcome \n•\tLatest updates from Adobe in the region\n•\tEcosystem spotlight: Ultimate Success — what the team does, the value they bring, and how partners can leverage them\n•\tProduct spotlight: Use cases and industry perspectives\n•\tWrap-up & Q&A\nAll partners are invited to register!",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-07T11:32:19Z",
  //       "modifiedDate": "2025-09-07T11:32:19Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "7ff76732c27ee97e5fee097dff817ef8",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Technical Deep Dive: Campaign Orchestration in Adobe Journey Optimizer",
  //         "url": "https://ajo-techdeepdive-sep2025.solutionpartners.adobeevents.com/",
  //         "description": "Join our team of Adobe Journey Optimizer experts from Product Management, Solution Architecture, and Partner Solution Consulting teams to learn about the latest release Adobe Journey Optimizer release—Campaign Orchestration.  This release introduces a suite of powerful enhancements, including multi-channel, multi-step workflows, on-demand audiences, multi-entity segmentation, and pre-send visibility. \n \nThis webinar is designed for technical users to explore to explore the key capabilities and building blocks of Campaign Orchestration in Journey Optimizer.  \n \nWhat to expect during the session:\nOpportunities for partners and your AJO practices\nHow Campaign Orchestration compliments existing AJO functionality\nWalk through of the core Campaign Orchestration building blocks, architecture, and data flows\nDemonstration of Campaign orchestration and how it applies to customer use cases\nQ&A with our product experts\nPartner resources\n \nFoundational knowledge important for this session:\nReview recording from AJO & Campaign Roadmap & Strategy Updates for 2H’FY25 (URL)\nFoundational understanding of Adobe Journey Optimizer\nAdobe Experience Platform data flows and architecture\nJourney Optimizer message authoring and execution\nSee release notes for an overview of Campaign Orchestration here",
  //         "contentType": "event"
  //       },
  //       "cardDate": "2025-09-02T07:26:41Z",
  //       "modifiedDate": "2025-09-02T07:26:41Z",
  //       "arbitrary": [
  //         {
  //           "caas:region": "americas"
  //         },
  //         {
  //           "caas:region": "emea"
  //         },
  //         {
  //           "caas:products": "adobe-journey-optimizer"
  //         },
  //         {
  //           "caas:events": "session-format"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "c9e2e09352eb6b6a32753f10a0b25f9d",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "The initial SPP Public Homepage for Sarah and Sumant",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2025-05-30T07:24:57.000Z",
  //       "modifiedDate": "2025-05-30T07:24:57.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "011bd384c837e6a989932ae5446979b2",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Solution Partner Program",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/spp-shared/gnav",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2025-05-15T09:40:32.000Z",
  //       "modifiedDate": "2025-05-15T09:40:32.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "fcee98e8752fb3f7e60d46d0be92889d",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Adobe",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/spp-shared/gnav2",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2025-02-21T12:51:59.000Z",
  //       "modifiedDate": "2025-02-21T12:51:59.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "1d0f54831225ef2cee84b039d850956d",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Contact not found",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/error/contact-not-found",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-07-02T13:22:33.000Z",
  //       "modifiedDate": "2024-07-02T13:22:33.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "f11643638d02cd30d41b13870b768d10",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Server error",
  //         "url": "https://partners.stage.adobe.com/technologypartners/server-error",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-26T13:24:05.000Z",
  //       "modifiedDate": "2024-06-26T13:24:05.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "4fb1cf467a30e20998350724decc1d15",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Submitted in review",
  //         "url": "https://partners.stage.adobe.com/technologypartners/submitted-in-review",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-26T12:19:18.000Z",
  //       "modifiedDate": "2024-06-26T12:19:18.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "59eedfb11d7289a6feaefb344ea7a80f",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Contact not found",
  //         "url": "https://partners.stage.adobe.com/technologypartners/contact-not-found",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-26T12:18:52.000Z",
  //       "modifiedDate": "2024-06-26T12:18:52.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "41b5c52ce0f8ece36cbc9fab24da98a5",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Continue registration",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/ec/app/74487/continue-registration",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-14T08:24:46.000Z",
  //       "modifiedDate": "2024-06-14T08:24:46.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "1e56e2f4ab6a8039e86e3c3f3c021710",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Invited contact registration",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/ec/app/74487/invited-contact-registration",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-14T08:23:59.000Z",
  //       "modifiedDate": "2024-06-14T08:23:59.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "72d500e3222f1ce285c62d9f25ae9085",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Bad request",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/error/bad-request",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-14T08:21:32.000Z",
  //       "modifiedDate": "2024-06-14T08:21:32.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "500a059133f08ad43f0e050e68815ad8",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Account expired",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/error/account-expired",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-14T08:20:16.000Z",
  //       "modifiedDate": "2024-06-14T08:20:16.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "f0432c483917bafe9849fde456575cc4",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Contact inactive",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/error/contact-inactive",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-14T08:18:45.000Z",
  //       "modifiedDate": "2024-06-14T08:18:45.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "d0a2f3be887ae1a9d024dd8dfee210ad",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Submitted in review",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/error/submitted-in-review",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-06-14T08:17:45.000Z",
  //       "modifiedDate": "2024-06-14T08:17:45.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "45269ae8d0f06c23d91a4cce8901918f",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Social",
  //         "url": "https://partners.stage.adobe.com/solutionpartners/spp-shared/footer",
  //         "description": "Adobe. All rights reserved. / Privacy (Updated) / Terms of Use / Cookie preferences / Do not sell my personal information / AdChoices",
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-05-23T09:10:00.000Z",
  //       "modifiedDate": "2024-05-23T09:10:00.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "a5f2fbe464e5e6a6a685e501f3ff0495",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Social",
  //         "url": "https://partners.stage.adobe.com/technologypartners/tpp-shared/footer",
  //         "description": "Adobe. All rights reserved. / Privacy (Updated) / Terms of Use / Cookie preferences / Do not sell my personal information / AdChoices",
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-05-15T08:23:05.000Z",
  //       "modifiedDate": "2024-05-15T08:23:05.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "9dc25370c3e033f55cfaf6320bf7968d",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Technology Partner Program",
  //         "url": "https://partners.stage.adobe.com/technologypartners/tpp-shared/gnav",
  //         "description": null,
  //         "type": "html",
  //         "contentType": "page"
  //       },
  //       "cardDate": "2024-05-15T08:22:33.000Z",
  //       "modifiedDate": "2024-05-15T08:22:33.000Z",
  //       "arbitrary": [],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "875d675481767bab6b8ec575980474bd",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Platinum Netstorage MP4 Automation",
  //         "url": "https://partners.stage.adobe.com/digitalexperience/preview/netstorage-assets/spp/platinum/pl/platinum_netstoragemp4automation.mp4",
  //         "description": "",
  //         "size": "1.6 MB",
  //         "type": "video",
  //         "contentType": "asset"
  //       },
  //       "cardDate": "2024-04-05T10:49:57Z",
  //       "modifiedDate": "2024-04-05T10:49:57Z",
  //       "arbitrary": [],
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "b7ea52d9603bcd27de5a6819d4eec77b",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Real-Time CDP: Qualifying Opportunities",
  //         "url": "https://partners.adobe.com/digitalexperience/training/courses/course5036042",
  //         "description": "This course examines the customer qualifications for Real-Time CDP. ",
  //         "contentType": "course"
  //       },
  //       "cardDate": "2022-03-14T19:41:54.000Z",
  //       "modifiedDate": "2022-03-14T19:41:54.000Z",
  //       "arbitrary": [
  //         {
  //           "caas:adobe-partners": "px"
  //         },
  //         {
  //           "caas:content-type": "course"
  //         },
  //         {
  //           "caas:technical-level": "not-specified"
  //         },
  //         {
  //           "caas:products": "adobe-real-time-cdp"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     },
  //     {
  //       "id": "131f195ae01f0d5d4dcba97643374c1a",
  //       "contentArea": {
  //         "detailText": "",
  //         "title": "Real-Time CDP Connections",
  //         "url": "https://partners.adobe.com/digitalexperience/training/courses/course5036041",
  //         "description": "This course examines the Adobe Real-Time CDP Connections including overview, elevator pitch/value prop, and customer issues/identifications.",
  //         "contentType": "course"
  //       },
  //       "cardDate": "2022-03-14T19:40:53.000Z",
  //       "modifiedDate": "2022-03-14T19:40:53.000Z",
  //       "arbitrary": [
  //         {
  //           "caas:adobe-partners": "px"
  //         },
  //         {
  //           "caas:content-type": "course"
  //         },
  //         {
  //           "caas:technical-level": "not-specified"
  //         },
  //         {
  //           "caas:products": "adobe-real-time-cdp"
  //         }
  //       ],
  //       "lang": "en-US",
  //       "origin": "dx-partners"
  //     }
  //   ],
  //   "count": {
  //     "all": 38,
  //     "assets": 1,
  //     "pages": 27
  //   }
  // }

  // // Return a Promise that resolves with a mock response object
  // return Promise.resolve({
  //   ok: true,
  //   json: () => Promise.resolve(mockCards)
  // });

}

const PARTNERS_PREVIEW_DOMAIN = 'partnerspreview.adobe.com';
export const PARTNERS_STAGE_DOMAIN = 'partners.stage.adobe.com';
export const PARTNERS_PROD_DOMAIN = 'partners.adobe.com';

// eslint-disable-next-line class-methods-use-this
export function transformCardUrl(url) {
  if (!url) {
    // eslint-disable-next-line no-console
    console.error('URL is null or undefined');
    return '';
  }
  const isProd = prodHosts.includes(window.location.host);
  if(url.startsWith("/")){
    url = `https://${PARTNERS_STAGE_DOMAIN}${url}`;
  }
  const newUrl = new URL(url);
  newUrl.protocol = window.location.protocol;
  if(!newUrl.host || newUrl.host === PARTNERS_PREVIEW_DOMAIN || newUrl.host === PARTNERS_STAGE_DOMAIN|| newUrl.host === PARTNERS_PROD_DOMAIN ) {
    newUrl.host = isProd ? PARTNERS_PROD_DOMAIN : PARTNERS_STAGE_DOMAIN;
  }
  return newUrl;
}
