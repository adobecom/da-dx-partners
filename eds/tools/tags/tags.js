/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import './tag-browser.js';
import { getTags, getRootTags } from './tag-data.js';

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
