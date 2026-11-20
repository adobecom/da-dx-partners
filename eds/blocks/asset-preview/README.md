# Asset Preview

This block is used on AEM author/asset dashboard pages and the EDS site.

Any asset-preview change should also be checked in the AEM asset AI dashboard Asset Preview tab, since the same files are reused there.

## Why this matters

On AEM author hosts, `/eds/...` URLs resolve against the author origin and can 404. Use `getEdsOrigin()` for CSS and SVG asset URLs.

## SVG caution

Avoid cross-origin `<use href="https://.../player-play.svg#icon">`; browsers block it when origins differ. Prefer same-origin asset URLs or inline SVG.

## Validate

- AEM author / asset AI dashboard Asset Preview tab
- EDS page
