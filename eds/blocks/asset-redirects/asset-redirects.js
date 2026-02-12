export default async function init(el) {
  const assetRedirects = document.querySelector('.asset-redirects');
  const redirectsMap = {};
  const assetRedirectRows = Array.from(assetRedirects.children);
  assetRedirectRows.forEach((row) => {
    const cols = Array.from(row.children);
    const originalAssetURL = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
    const redirectAssetURL = cols[1].innerText.trim();
    redirectsMap[originalAssetURL] = redirectAssetURL;
  });
  assetRedirects.remove();
  console.log('redirectsmap', redirectsMap);
  console.log('in redirets', el);
}
