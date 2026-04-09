import {getConfig, getRuntimeActionUrl} from "../blocks/utils/utils.js";
import {
  getCookieValue,
  getCurrentProgramType,
  getMetadataContent,
  getPartnerCookieValue,
  preventModalClose,
  PORTAL_MESSAGING_POPUP,
  SHOW_NEXT_POPUP,
} from "./utils.js";

const RT_PARTNER_AGREEMENT_PATH = '/api/v1/web/dx-partners-runtime/partner-agreement';

const SPINNER_ANIMATION = `<sp-theme system="light" color="light" scale="medium" dir="ltr" class="agreement-progress-wrapper">
        <sp-progress-circle label="progress circle" indeterminate="" size="l" dir="ltr" role="progressbar" aria-label="progress circle"></sp-progress-circle>
    </sp-theme>`;

let agreementModal;

export function handleRedirects(agreementRedirectDomains, win = window) {
  if (!agreementRedirectDomains) return;
  const allowedDomains = agreementRedirectDomains.split(',').map(url => url.trim().toLowerCase());
  const params = new URLSearchParams(win.location.search);
  const redirectUrl = params.get('redirectUrl');
  if (!redirectUrl) return;

  let redirectDomain;

  try {
    redirectDomain = new URL(redirectUrl).hostname.toLowerCase();
  } catch {
    // Invalid URL
    return;
  }

  if (allowedDomains.includes(redirectDomain)) {
    win.location.href = redirectUrl;
  }
}
async function acceptAgreement(agreementTextContainer, successMessage, errorMessage, agreementRedirectDomains, spinner, closeModalCallback) {
    agreementTextContainer.replaceWith(spinner);
    const success = await handleAgreement('accept');
    if (success) {
        spinner.innerHTML = successMessage;
        addRegeneratePropToCookie();
      setTimeout(() => {
        closeModalCallback(agreementModal);
        window.dispatchEvent(
          new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: PORTAL_MESSAGING_POPUP } }),
        );
      }, 2000);
        handleRedirects(agreementRedirectDomains);
    } else {
        spinner.innerHTML = errorMessage;
    }
}

async function createContent(miloLibs, agreementMeta, agreementContent) {
    const { codeRoot } = getConfig();
    const {createTag, loadStyle} = await import(`${miloLibs}/utils/utils.js`);
    const {closeModal} = await import(`${miloLibs}/blocks/modal/modal.js`);

    await import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`);
    await import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`);
    await loadStyle(`${codeRoot}/styles/partner-agreement.css`);

    const agreementTitleText = createTag('div', null, agreementMeta.agreementTitle);
    const agreementTitleIcon = createTag('div', {class: 'agreement-alert'});
    const agreementHeader = createTag('h3', {class: 'agreement-header'}, [agreementTitleText, agreementTitleIcon]);

    const agreementHr = createTag('hr', {class: 'agreement-hr'})

    const agreementDescription = createTag('div', {class: "agreement-description"}, agreementMeta.agreementDescription);
    const agreementText = createTag('div', {class: 'agreement-text'}, agreementContent);
    const agreementBody = createTag('div', {class: 'agreement-body'}, [agreementDescription, agreementText]);

    const agreementCta = createTag('button', {class: 'con-button blue button-l button-justified-mobile agreement-cta'}, agreementMeta.agreementCtaLabel);
    const agreementSpinner = createTag('div', {class: 'agreement-spinner'}, SPINNER_ANIMATION);
    agreementCta.addEventListener('click', () => acceptAgreement(
        agreementText,
        agreementMeta.agreementSuccessMessage,
        agreementMeta.agreementErrorMessage,
        agreementMeta.agreementRedirectDomains,
        agreementSpinner,
        closeModal));
    const agreementFooter = createTag('div', {class: 'agreement-footer'}, agreementCta);

    return createTag('div', {class: 'agreement-wrapper'}, [agreementHeader, agreementHr, agreementBody, agreementFooter]);
}

function addRegeneratePropToCookie() {
    const partnerDataCookie = getCookieValue('partner_data');
    if (!partnerDataCookie) return;
    const partnerDataObj = JSON.parse(decodeURIComponent(partnerDataCookie));
    partnerDataObj[getCurrentProgramType().toUpperCase()].regenerate = 'true';
    const modifiedPartnerDataJsonString = JSON.stringify(partnerDataObj);
    const modifiedPartnerDataCookie = modifiedPartnerDataJsonString.replace(/,/g, '%2C');
    document.cookie = `${'partner_data'}=${modifiedPartnerDataCookie}; Path=/`;
}

async function handleAgreement(action) {
    try {
        const url = getRuntimeActionUrl(RT_PARTNER_AGREEMENT_PATH);
        const response = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    programType: getCurrentProgramType().toUpperCase(),
                    action: action
                })
            }
        );
        if (!response.ok) {
            console.error(`${action} Partner Agreement failed, status: ${response.status}`);
            return false;
        }
        const responseJson = await response.json();
        if (action === 'fetch') {
            if (!responseJson || !responseJson.terms || responseJson.terms.length < 1) {
                console.error('Partner Agreement response is empty');
                return false;
            }
            return responseJson.terms?.[0];
        } else {
            //error code "41012" means agreement already accepted
            if (responseJson.errorCode && responseJson.errorCode !== '41012') {
                console.error(`Accepting partner agreement failed! Error code: ${responseJson.errorCode}`);
                return false;
            }
            return true;
        }
    } catch (error) {
        console.error(`Partner Agreement ${action} error`, error);
        return false;
    }
}

function preventAgreementModalClose(modal) {
    // remove Milo close button
    const closeCta = modal.querySelector('#partner-agreement-modal .dialog-close');
    closeCta.remove();

    // block Milo Escape keydown listener
    const blockEscapeKey = function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
    modal.addEventListener('keydown', blockEscapeKey, {capture: true});

    preventModalClose(modal);
}

async function loadAgreementMeta(metadataUrl) {
    const response = await fetch(metadataUrl);
    if (!response.ok) {
        console.error(`Fetching partner agreement metadata failed, status ${response.status}`);
        return false;
    }
    const text = await response.text();
    const {head} = new DOMParser().parseFromString(text, 'text/html');
    return {
        agreementTitle: head.querySelector('meta[name="agreementtitle"]')?.content || 'Agreement Title',
        agreementDescription: head.querySelector('meta[name="agreementdescription"]')?.content || 'Agreement Description',
        agreementCtaLabel: head.querySelector('meta[name="agreementctalabel"]')?.content || 'Agreement CTA label',
        agreementSuccessMessage: head.querySelector('meta[name="agreementsuccessmessage"]')?.content || 'Agreement Success Message',
        agreementErrorMessage: head.querySelector('meta[name="agreementerrormessage"]')?.content || 'Agreement Error Message',
        agreementRedirectDomains: head.querySelector('meta[name="agreementredirectdomains"]')?.content || '',
    };
}

export async function partnerAgreement(miloLibs, win = window) {
    const latestAgreementAccepted = getPartnerCookieValue('latestagreementaccepted');
    if (latestAgreementAccepted) {
      win.dispatchEvent(
        new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: PORTAL_MESSAGING_POPUP } }),
      );

      return false;
    }

    const partnerAgreementMetaPath = getMetadataContent('partner-agreement-meta');
  if (!partnerAgreementMetaPath) {
    console.warn('Partner agreement should be displayed but partner agreement meta path is not authored');
    win.dispatchEvent(
      new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: PORTAL_MESSAGING_POPUP } }),
    );
    return false;
  }

    const agreementMeta = await loadAgreementMeta(partnerAgreementMetaPath);
  if (!agreementMeta) {
    win.dispatchEvent(
      new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: PORTAL_MESSAGING_POPUP } }),
    );
    return false;
  }

    const agreementContent = await handleAgreement('fetch');
  if (!agreementContent) {
    win.dispatchEvent(
      new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: PORTAL_MESSAGING_POPUP } }),
    );
    return false;
  }

    const content = await createContent(miloLibs, agreementMeta, agreementContent);

    const {getModal} = await import(`${miloLibs}/blocks/modal/modal.js`);
    agreementModal = await getModal(
        null,
        {class: 'commerce-frame', id: 'partner-agreement-modal', content, closeEvent: 'close-partner-agreement-modal'},
    );
    preventAgreementModalClose(agreementModal);
    return true;
}
