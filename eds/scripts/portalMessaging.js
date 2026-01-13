import {
  getCurrentProgramType,
  getMetadataContent,
  getPartnerCookieValue,
  isMember, PARTNER_AGREEMENT_POPUP, CERTIFICATION_POPUP, SHOW_NEXT_POPUP
} from "./utils.js";
import {PERSONALIZATION_CONDITIONS, PERSONALIZATION_PLACEHOLDERS} from "./personalizationConfigDX.js";
import {personalizePage, personalizePlaceholders} from "./personalization.js";
import {rewriteLinks} from "./rewriteLinks.js";

export const PORTAL_MESSAGING_DONE = 'dxp:portalMessagingDone';
export async function loadPopupFragment(popupFragment, modal = 'partner agreement') {
    const response = await fetch(popupFragment);
    if (!response.ok) {
        console.error(`Fetching ${modal} metadata failed, status ${response.status}`);
        return null;
    }
    const text = await response.text();
    const {body} = new DOMParser().parseFromString(text, 'text/html');
    if (!body) return null;

    const main = body.querySelector('main');
    return main.firstElementChild;
}

export async function portalMessaging(miloLibs) {
    const modalClosed = sessionStorage.getItem('portal-messaging-popup-closed')
  if (modalClosed === 'true') {
    window.dispatchEvent(
      new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: CERTIFICATION_POPUP } }),
    );
    return false;
  }

    const specialStateCookie = getPartnerCookieValue('specialstate');
    if (!specialStateCookie) {
      window.dispatchEvent(
        new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: CERTIFICATION_POPUP } }),
      );
      return false;
    }

    let popupType;
    if (PERSONALIZATION_CONDITIONS['partner-submitted-in-review']) {
        popupType = 'submitted-in-review-modal';
    }
    if (PERSONALIZATION_CONDITIONS['partner-locked-compliance-past']) {
        popupType = 'locked-compliance-past-modal';
    }
    if (PERSONALIZATION_CONDITIONS['partner-locked-payment-future']) {
        popupType = 'locked-payment-future-modal';
    }
    if (!popupType) {
      window.dispatchEvent(
        new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: CERTIFICATION_POPUP } }),
      );
      return false;
    }

    const popupFragmentPath = getMetadataContent(popupType);
    if (!popupFragmentPath) {
        console.warn(`${popupType} should be displayed but popup fragment path is not found`);
      window.dispatchEvent(
        new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: CERTIFICATION_POPUP } }),
      );
      return false;
    }

    const popupContent = await loadPopupFragment(popupFragmentPath);
    if (!popupContent) {
        console.warn(`Popup fragment for ${popupFragmentPath} not found`);
      window.dispatchEvent(
        new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: CERTIFICATION_POPUP } }),
      );
      return false;
    }

    const {getModal} = await import(`${miloLibs}/blocks/modal/modal.js`);
    const modal = await getModal(
        null,
        {
            id: 'portal-messaging-modal',
            class: 's-size',
            content: popupContent,
            closeCallback: () => {
                sessionStorage.setItem("portal-messaging-popup-closed", "true");
              window.dispatchEvent(
                new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: CERTIFICATION_POPUP } }),
              );
            }
        },
    );
    if (!modal) {
      window.dispatchEvent(
        new CustomEvent(SHOW_NEXT_POPUP, { detail: { next: CERTIFICATION_POPUP } }),
      );
      return false;
    };
    const { loadArea } = await import(`${miloLibs}/utils/utils.js`);
    await loadArea(modal);
    personalizePlaceholders(PERSONALIZATION_PLACEHOLDERS, modal, getCurrentProgramType());
    personalizePage(modal);
    rewriteLinks(modal);
}

export async function bctqBanner(miloLibs) {
    if (!isMember()) return;

    let bannerType;
    if (PERSONALIZATION_CONDITIONS['partner-bctq-expiring-90d']) {
        bannerType = 'bctq-banner';
    }
    if (!bannerType) return;

    const bannerFragmentPath = getMetadataContent(bannerType);
    if (!bannerFragmentPath) {
        console.warn(`${bannerType} should be displayed but popup fragment path is not found`);
        return;
    }

    const bannerContent = await loadPopupFragment(bannerFragmentPath);
    if (!bannerContent) {
        console.warn(`Popup fragment for ${bannerFragmentPath} not found`);
        return;
    }

    const documentMain = document.querySelector('main');
    if (!documentMain) return;

    documentMain.prepend(bannerContent);
}
