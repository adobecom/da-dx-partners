import {
    getCurrentProgramType,
    getMetadataContent,
    getPartnerDataCookieValue,
    isMember
} from "./utils.js";
import {PERSONALIZATION_CONDITIONS, PERSONALIZATION_PLACEHOLDERS} from "./personalizationConfigDX.js";
import {personalizePage, personalizePlaceholders} from "./personalization.js";

async function loadPopupFragment(popupFragment) {
    const response = await fetch(popupFragment);
    if (!response.ok) {
        console.error(`Fetching partner agreement metadata failed, status ${response.status}`);
        return null;
    }
    const text = await response.text();
    const {body} = new DOMParser().parseFromString(text, 'text/html');
    if (!body) return null;

    const main = body.querySelector('main');
    personalizePlaceholders(PERSONALIZATION_PLACEHOLDERS, main, getCurrentProgramType());
    personalizePage(main);
    return main.firstElementChild;
}

export async function portalMessaging(miloLibs, partnerAgreementDisplayed) {
    if (partnerAgreementDisplayed) return;
    if (!isMember()) return;

    const modalClosed = sessionStorage.getItem('portal-messaging-popup-closed')
    if (modalClosed === 'true') return;

    const specialStateCookie = getPartnerDataCookieValue('specialstate');
    if (!specialStateCookie) return;

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
    if (!popupType) return;

    const popupFragmentPath = getMetadataContent(popupType);
    if (!popupFragmentPath) {
        console.warn(`${popupType} should be displayed but popup fragment path is not found`);
        return;
    }

    const popupContent = await loadPopupFragment(popupFragmentPath);
    if (!popupContent) {
        console.warn(`Popup fragment for ${popupFragmentPath} not found`);
        return;
    }

    const {getModal} = await import(`${miloLibs}/blocks/modal/modal.js`);
    getModal(
        null,
        {
            id: 'portal-messaging-modal',
            class: 's-size',
            content: popupContent,
            closeCallback: () => {
                sessionStorage.setItem("portal-messaging-popup-closed", "true");
            }
        },
    );
}
