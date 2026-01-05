import { AGREEMENT_POPUP_DONE, partnerAgreement } from './partnerAgreement.js';
import { PORTAL_MESSAGING_DONE, portalMessaging } from './portalMessaging.js';
import { certificationExpiresPopup } from './certificationExpiresPopup.js';
import { isMember } from './utils.js';

export async function setPopups(miloLibs, imsClientId) {
  if (!isMember()) {
    return;
  }
  window.addEventListener(AGREEMENT_POPUP_DONE, async () => {
    await portalMessaging(miloLibs, false);
  });

  window.addEventListener(PORTAL_MESSAGING_DONE, async () => {
    await certificationExpiresPopup(
      miloLibs,
      imsClientId,
    );
  });

  await partnerAgreement(miloLibs);
}
