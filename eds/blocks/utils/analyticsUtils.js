const customEventName = 'aep:TrackEvent';
const appName = 'experience-hub';
export const eventTypeSearch = 'search';
export const eventTypeLinkClick = 'linkClick';

function createCustomEvent(eventType, metadata) {
  return new CustomEvent(customEventName, {
    detail: {
      appName,
      eventType,
      timestamp: Date.now(),
      metadata,
      xdm: {},
    },
  });
}
export function dispatchCustomEventOnLinkClick(e, link, linkText) {
  window.dispatchEvent(
    createCustomEvent(
      eventTypeLinkClick,
      // todo check for linkText what value they need
      { link, linkText },
    ),
  );
}

export function dispatchCustomEventOnSearch(term, filters) {
  window.dispatchEvent(
    createCustomEvent(
      eventTypeSearch,
      { term, filters },
    ),
  );
}
