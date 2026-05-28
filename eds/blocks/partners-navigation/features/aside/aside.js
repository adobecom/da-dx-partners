// PARTNERS_NAVIGATION START
// MWPW-159021 - Fix eslint errors
/* eslint-disable */
// PARTNERS_NAVIGATION END
import { toFragment, lanaLog } from '../../utilities/utilities.js';
// PARTNERS_NAVIGATION START
// MWPW-159021 - Fix eslint errors
import { getLibs } from '../../../../scripts/utils.js';
const miloLibs = getLibs();
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);
const { loadBlock, decorateAutoBlock } = await import(`${miloLibs}/utils/utils.js`);
// PARTNERS_NAVIGATION END

export default async function decorateAside({ headerElem, fedsPromoWrapper, promoPath } = {}) {
  const onError = () => {
    fedsPromoWrapper?.remove();
    headerElem?.classList.remove('has-promo');
    lanaLog({
      message: 'Gnav Promo fragment not replaced, potential CLS',
      tags: 'aside',
      severity: 'warning',
    });
    return '';
  };

  const fragLink = toFragment`<a href="${promoPath}">${promoPath}</a>`;
  const fragTemplate = toFragment`<div>${fragLink}</div>`;
  decorateAutoBlock(fragLink);
  if (!fragLink.classList.contains('fragment')) return onError();
  await loadBlock(fragLink).catch(() => onError());
  const aside = fragTemplate.querySelector('.aside');
  if (fragTemplate.contains(fragLink) || !aside) return onError();

  aside.removeAttribute('data-block');
  aside.setAttribute('daa-lh', 'Promo');

  aside.querySelectorAll('a').forEach((link, index) => {
    link.setAttribute('daa-ll', `${processTrackingLabels(link.textContent)}--${index + 1}`);
  });

  return aside;
}
