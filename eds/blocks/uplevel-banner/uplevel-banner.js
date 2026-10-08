import { getLibs, invokeAfterImsIsReady, getMetadataContent, getPartnerCookieValue } from '../../scripts/utils.js';
import { getPartnershipData } from '../utils/partnershipDataService.js';
import { replaceDirectText } from '../../scripts/personalization.js';
import { DX_PARTNER_LEVEL } from '../utils/dxConstants.js';

const miloLibs = getLibs();

const LEVEL_MAP = { silver: 'gold', gold: 'platinum' };

const isFullyCompleted = (obj, fields) => fields.every((field) => obj?.[field]?.percentage === 100);

export function getTargetLevel(data) {
  const currentLevel = data.level?.toLowerCase();

  if (currentLevel !== 'silver' && currentLevel !== 'gold') return null;

  const targetLevel = LEVEL_MAP[currentLevel];
  const isSilverPartner = String(getPartnerCookieValue('level')).toLowerCase()
  === DX_PARTNER_LEVEL.SILVER.toLowerCase();

  const solutionItem = (data.solution || []).find(
    (item) => item.level?.toLowerCase() === targetLevel,
  );
  const solutionValid = isFullyCompleted(
    solutionItem,
    ['credentials', 'customerDeployments', 'specializations'],
  );
  if (solutionValid) return targetLevel;

  const technologyItem = (data.technology || []).find(
    (item) => item.level?.toLowerCase() === targetLevel,
  );
  const technologyFields = ['credentials', 'customerDeployments', 'solutions'];
  if (!isSilverPartner) technologyFields.push('appAssurances');
  if (!isFullyCompleted(technologyItem, technologyFields)) return null;

  return targetLevel;
}

export default async function init(el) {
  const { parentNode, nextSibling } = el;
  el.remove();

  const metaEnabled = getMetadataContent('uplevel-banner')?.toLowerCase();
  if (metaEnabled === 'none') return;

  invokeAfterImsIsReady(async () => {
    try {
      const data = await getPartnershipData();
      const targetLevel = getTargetLevel(data);
      if (!targetLevel) return;

      if (el.textContent.includes('$eligibleLevel')) {
        [...el.querySelectorAll('*')].forEach((node) => replaceDirectText(node, '$eligibleLevel', targetLevel));
      }

      el.classList.add('notification');
      const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
      loadStyle(`${miloLibs}/blocks/notification/notification.css`);
      const { default: initNotification } = await import(`${miloLibs}/blocks/notification/notification.js`);
      await initNotification(el);

      parentNode.insertBefore(el, nextSibling);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[uplevel-banner] error', e);
    }
  });
}
