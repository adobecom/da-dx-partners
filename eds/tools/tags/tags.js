/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import './tag-browser.js';
import TAG_DATA from './aem-tags.json' with { type: 'json' };

function getNodeAtSegments(tree, segments) {
  return segments.reduce((node, seg) => ((node && node[seg]) ? node[seg] : null), tree);
}

async function getTags(path) {
  const segments = path.split('/').filter(Boolean);
  const activeTag = segments.join('/');
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

const getRootTags = async () => getTags('').catch(() => null);

function showError(message, link = null) {
  const mainElement = document.body.querySelector('main');
  const errorMessage = document.createElement('p');
  errorMessage.textContent = message;

  if (link) {
    const linkEl = document.createElement('a');
    linkEl.textContent = 'View Here';
    linkEl.href = link;
    linkEl.target = '_blank';
    errorMessage.append(linkEl);
  }

  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Reload';
  reloadButton.addEventListener('click', () => window.location.reload());

  mainElement.append(errorMessage, reloadButton);
}

(async function init() {
  const { actions, token } = await DA_SDK.catch(() => null);
  if (!actions || !token) {
    showError('Please log in to view tags.');
    return;
  }

  const rootTags = await getRootTags();

  if (!rootTags || rootTags.length === 0) {
    showError('Could not load tags.');
    return;
  }

  const daTagBrowser = document.createElement('da-tag-browser');
  daTagBrowser.tabIndex = 0;
  daTagBrowser.rootTags = rootTags;
  daTagBrowser.getTags = async (tag) => getTags(tag.path);
  daTagBrowser.tagValue = 'path';
  daTagBrowser.actions = actions;
  document.body.querySelector('main').append(daTagBrowser);
}());
