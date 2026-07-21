/* eslint-disable import/extensions */
import TAG_DATA from './aem-tags.json' with { type: 'json' };

// TAG_DATA is a snapshot of the AEM "caas" tag namespace
// (previously fetched from /content/cq:tags/caas). The namespace itself
// isn't part of TAG_DATA's own tree, so it's hardcoded here and prepended
// to activeTag to keep inserted tag values identical to the pre-refactor
// AEM-backed behavior (e.g. "caas:product-categories:3d-and-ar").
const NAMESPACE = 'caas';

export function getNodeAtSegments(tree, segments) {
  return segments.reduce((node, seg) => ((node && node[seg]) ? node[seg] : null), tree);
}

export async function getTags(path) {
  const segments = path.split('/').filter(Boolean);
  const activeTag = [NAMESPACE, ...segments].join('/');
  const node = getNodeAtSegments(TAG_DATA, segments);
  if (!node) {
    // eslint-disable-next-line no-console
    console.error(`No tag node found at path "${path}" (segments: ${JSON.stringify(segments)})`);
    return null;
  }

  const tags = Object.keys(node).reduce((acc, key) => {
    if (node[key]['jcr:primaryType'] === 'cq:Tag') {
      acc.push({
        path: `${path}/${key}`,
        activeTag,
        name: key,
        title: node[key]['jcr:title'] || key,
        details: node[key],
      });
    }
    return acc;
  }, []);

  return tags;
}

export const getRootTags = async () => getTags('').catch(() => null);
