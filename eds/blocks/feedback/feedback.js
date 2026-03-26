import { getCurrentProgramType, getPartnerCookieObject, partnerIsSignedIn, getLibs, prodHosts } from '../../scripts/utils.js';
import { getConfig } from '../utils/utils.js';
import showToast from '../../components/Toast.js';

const miloLibs = getLibs();
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

async function renderDialog(feedbackButton, formDefinitionUrl, config) {
  feedbackButton.classList.add('hidden');
  const feedbackDialog = document.createElement('div');
  feedbackDialog.className = 'feedback-dialog';
  feedbackDialog.setAttribute('daa-lh', 'Feedback Dialog');
  const dialogBody = document.createElement('div');
  dialogBody.className = 'feedback-dialog-body';
  const title = document.createElement('h4');
  title.className = 'feedback-title';
  title.textContent = config.dialogTitle;
  const divider = document.createElement('hr');

  const description = document.createElement('span');
  description.className = 'feedback-description';
  description.textContent = config.dialogText;
  const starContainer = document.createElement('div');
  starContainer.className = 'feedback-stars-wrapper';
  let selectedRating = config.savedRating;

  const updateStars = (rating) => {
    starContainer.querySelectorAll('sp-action-button').forEach((btn, idx) => {
      const iconSlot = btn.querySelector('[slot="icon"]');
      const img = iconSlot.querySelector('img');
      if (idx < rating) {
        btn.setAttribute('selected', '');
        img.src = '/eds/img/icons/star.svg';
      } else {
        btn.removeAttribute('selected');
        img.src = '/eds/img/icons/outline-star.svg';
      }
    });
  };
  const sendButton = document.createElement('button');
  // eslint-disable-next-line no-plusplus
  for (let i = 1; i <= 5; i++) {
    const starButton = document.createElement('sp-action-button');
    starButton.setAttribute('quiet', '');
    starButton.setAttribute('data-rating', i);
    const iconWrapper = document.createElement('span');
    iconWrapper.setAttribute('slot', 'icon');
    const img = document.createElement('img');
    img.src = '/eds/img/icons/outline-star.svg';
    iconWrapper.appendChild(img);
    starButton.appendChild(iconWrapper);
    starButton.addEventListener('mouseenter', () => {
      updateStars(i);
    });
    // eslint-disable-next-line no-loop-func
    starButton.addEventListener('mouseleave', () => {
      updateStars(selectedRating);
    });
    // eslint-disable-next-line no-loop-func
    starButton.addEventListener('click', () => {
      selectedRating = i;
      updateStars(selectedRating);
      sendButton.disabled = false;
    });
    starContainer.appendChild(starButton);
  }
  if (config.savedRating > 0) {
    updateStars(config.savedRating);
  }
  const textareaSection = document.createElement('div');
  textareaSection.className = 'feedback-comment-wrapper';
  const textareaHeader = document.createElement('div');
  textareaHeader.className = 'feedback-label-wrapper';
  const textareaLabel = document.createElement('label');
  textareaLabel.textContent = config.dialogComment;
  textareaLabel.className = 'feedback-label-text';
  const charCount = document.createElement('span');
  charCount.className = 'feedback-label-count';
  charCount.textContent = '500';
  textareaHeader.appendChild(textareaLabel);
  textareaHeader.appendChild(charCount);
  const textarea = document.createElement('textarea');
  textarea.className = 'feedback-textarea';
  textarea.maxLength = 500;
  textarea.placeholder = '';
  textarea.value = config.savedComment;
  const initialRemaining = 500 - config.savedComment.length;
  charCount.textContent = initialRemaining.toString();
  textarea.addEventListener('input', () => {
    const remaining = 500 - textarea.value.length;
    charCount.textContent = remaining.toString();
  });
  textareaSection.appendChild(textareaHeader);
  textareaSection.appendChild(textarea);
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'feedback-dialog-actions';
  const cancelButton = document.createElement('button');
  cancelButton.className = 'feedback-dialog-button secondary-cta';
  cancelButton.textContent = config.cancel;
  cancelButton.setAttribute('daa-ll', processTrackingLabels(config.cancel, getConfig(), 30));
  sendButton.className = 'feedback-dialog-button cta';
  sendButton.textContent = config.send;
  sendButton.setAttribute('daa-ll', processTrackingLabels(config.send, getConfig(), 30));
  sendButton.disabled = config.savedRating === 0;
  const closeDialog = () => {
    feedbackDialog.remove();
    feedbackButton.classList.remove('hidden');
  };
  const close = () => {
    config.savedRating = selectedRating;
    config.savedComment = textarea.value;
    closeDialog();
  };
  cancelButton.addEventListener('click', close);
  feedbackDialog.addEventListener('click', (e) => {
    if (e.target === feedbackDialog) {
      close();
    }
  });
  const submitFeedback = async () => {
    document.querySelectorAll('.feedback-dialog-button').forEach((button) => {
      button.disabled = true;
    });
    const constructSubmitUrl = (formDefUrl) => {
      try {
        const url = new URL(formDefUrl);
        const id = window.btoa(url.pathname);
        return `https://forms.adobe.com/adobe/forms/af/submit/${id}`;
      } catch (error) {
        return null;
      }
    };
    const rating = selectedRating;
    const comment = textarea.value;
    const page = window.location.pathname;
    const timestamp = new Date().toISOString();
    let userName = '';
    let userEmail = '';
    if (partnerIsSignedIn()) {
      try {
        const profileData = getPartnerCookieObject(getCurrentProgramType());
        userName = `${profileData.firstName} ${profileData.lastName}`;
        userEmail = profileData.email;
      } catch (error) {
        userName = 'invalid';
        userEmail = 'invalid';
        // eslint-disable-next-line no-console
        console.info('Failed to parse profileData from cookie:', error);
      }
    }
    const payload = {
      rating,
      comment,
      page,
      timestamp,
      userName,
      userEmail,
    };

    const resp = await fetch(constructSubmitUrl(formDefinitionUrl), {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'x-adobe-form-hostname': 'main--dx-partners--adobecom.aem.page',
      },
      body: JSON.stringify({ data: payload }),
    }).catch(() => false);
    if (!resp || !resp.ok) {
      closeDialog();
      showToast('feedback', false, () => {
        renderDialog(feedbackButton, formDefinitionUrl, config);
      }, config);
      return;
    }
    await resp.text();
    config.savedRating = 0;
    config.savedComment = '';
    closeDialog();
    showToast('feedback', true, null, config);
  };

  sendButton.addEventListener('click', submitFeedback);
  buttonsContainer.appendChild(cancelButton);
  buttonsContainer.appendChild(sendButton);
  feedbackDialog.appendChild(title);
  feedbackDialog.appendChild(divider);
  dialogBody.appendChild(description);
  dialogBody.appendChild(starContainer);
  dialogBody.appendChild(textareaSection);
  feedbackDialog.appendChild(dialogBody);
  feedbackDialog.appendChild(buttonsContainer);
  document.body.appendChild(feedbackDialog);
}

export default async function init(el) {
  const formDefinitionUrl = el.querySelector('a[href$="feedback-definition.json"]');

  await Promise.all([
    import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/action-button.js`),
  ]);

  const isProd = prodHosts.includes(window.location.host);

  const config = {
    feedbackStickyButton: 'Share Feedback',
    dialogTitle: 'Rate this page',
    dialogText: 'How satisfied were you with this page? Be as candid as you want, all feedback is kept anonymous.',
    dialogComment: 'Want to share more? (optional)',
    cancel: 'Cancel',
    send: 'Send',
    toastNegative: 'Unable to receive your rating.',
    toastPositive: 'Thank you for your feedback!',
    tryAgain: 'Try again',
    savedRating: 0,
    savedComment: '',
  };

  [...el.children].forEach((row) => {
    if (row.children.length === 2) {
      const key = row.children[0].textContent.trim().toLowerCase();
      const value = row.children[1].textContent.trim();
      if (key === 'feedback-sticky-button') {
        config.feedbackStickyButton = value;
      } else if (key === 'dialog-title') {
        config.dialogTitle = value;
      } else if (key === 'dialog-text') {
        config.dialogText = value;
      } else if (key === 'dialog-comment') {
        config.dialogComment = value;
      } else if (key === 'cancel') {
        config.cancel = value;
      } else if (key === 'send') {
        config.send = value;
      } else if (key === 'toast-negative') {
        config.toastNegative = value;
      } else if (key === 'toast-positive') {
        config.toastPositive = value;
      } else if (key === 'try-again') {
        config.tryAgain = value;
      }
    }
  });

  const url = new URL(formDefinitionUrl);
  const configs = getConfig();
  const { prefix } = configs?.locale || { prefix: '' };
  if (url.pathname.startsWith(prefix)) {
    url.pathname = url.pathname.slice(prefix.length);
  }
  if (!isProd) {
    url.pathname = '/feedback/stage/feedback-definition.json';
  }

  const app = document.createElement('div');
  app.className = 'feedback-mechanism';
  app.setAttribute('daa-lh', 'Feedback');
  const stickyFeedbackButton = document.createElement('button');
  stickyFeedbackButton.className = 'sticky-feedback-button sticky-cta';
  stickyFeedbackButton.textContent = config.feedbackStickyButton;
  stickyFeedbackButton.setAttribute('daa-ll', processTrackingLabels(config.feedbackStickyButton, getConfig(), 30));
  app.appendChild(stickyFeedbackButton);
  stickyFeedbackButton.addEventListener('click', () => renderDialog(stickyFeedbackButton, url, config));
  el.replaceWith(app);

  const currentUrl = new URL(window.location.href);
  const { searchParams } = currentUrl;
  const feedbackParam = searchParams.get('feedback');
  if (feedbackParam === 'true' || feedbackParam === '') {
    await renderDialog(stickyFeedbackButton, url, config);
    searchParams.delete('feedback');
    window.history.replaceState({}, '', decodeURIComponent(currentUrl.toString()));
  }
}
