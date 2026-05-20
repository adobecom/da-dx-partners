# Uplevel Banner

## Milo Notification Dependency

This block dynamically loads and initialises the milo `notification` block at runtime:

```js
el.classList.add('notification');
const { default: initNotification } = await import(`${miloLibs}/blocks/notification/notification.js`);
await initNotification(el);
```

Any changes to milo's `notification` block (JS or CSS) will directly affect this block's rendering, layout, and close behaviour.

## Data

Fetches from the Track Partnership API via `partnershipDataService.js` (shared with `partnership-progress`). The API call is made once and cached — having both blocks on the same page will not trigger two requests.

## Authoring

| uplevel-banner (ribbon, center, dark) | |
|---|---|
| `#a934bf` | Background colour |
| `$accountName is eligible to move up to the $eligibleLevel...` `<em>[Join now link]</em>` | Heading with placeholders and inline CTA. `$eligibleLevel` is replaced by this block; `$accountName` is handled by personalization. |

The banner is enabled by default, if authored on the page. Add `uplevel-banner = none` to metadata-sitewide to suppress it.
