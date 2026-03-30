import { getCurrentProgramType, getPartnerCookieObject, partnerIsSignedIn, prodHosts, getLibs } from '../../scripts/utils.js';
import { getConfig, populateLocalizedTextFromListItems, replaceText } from "../utils/utils.js";
import { parseMarkdown, extractAuthoredConfigs } from './utils.js';

async function loadSVG(iconName) {
  const svgPath = '/eds/partners-shared/mnemonics/';
  try {
    const response = await fetch(svgPath + iconName, { method: 'GET' });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('SVG does NOT exist:', response.status);
      return null;
    }

    const svgText = await response.text();

    return svgText;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching SVG:', err);
    return null;
  }
}

const chatIcon = await loadSVG('yukon-chat-icon.svg');
const submitIcon = await loadSVG('submitchaticon.svg');
const arrowIcon = await loadSVG('arrowscrollchaticon.svg');
const DIALOG_CLOSE_ICON_URL = '/eds/partners-shared/mnemonics/dialog-close.svg';

async function localizationPromises(localizedText, config) {
  return Promise.all(Object.keys(localizedText).map(async (key) => {
    try {
      const value = await replaceText(key, config);
      if (value.length) localizedText[key] = value;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Failed to replace text for key: ', key, error);
    }
  }));
}

const miloLibs = getLibs();
const { getModal } = await import(`${miloLibs}/blocks/modal/modal.js`);
const { createTag } = await import(`${miloLibs}/utils/utils.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

let currentAbortController = null; // Store abort controller for ongoing requests
const requestId = crypto.randomUUID();
const configs = {};

const createInputField = (textareaEl, buttonEl) => {
  const container = createTag('div', { class: 'yc-input-field-container' });

  const label = createTag('label', {
    for: 'yc-input-field',
    class: 'yc-input-field-label',
    'aria-describedby': 'yc-label-tooltip',
    tabindex: 0,
  }, chatIcon);

  const tooltip = createTag('div', {
    id: 'yc-label-tooltip',
    class: 'yc-label-tooltip',
    role: 'tooltip',
  }, configs.chatTooltip);

  const textareaWrap = createTag('div', { class: 'yc-textarea-grow-wrap' });
  textareaWrap.appendChild(textareaEl);
  container.appendChild(label);
  container.appendChild(tooltip);
  container.appendChild(textareaWrap);
  container.appendChild(buttonEl);
  return container;
};

function updateScrollButtonPosition(scrollToBottomBtn, modalInputWrapper) {
  if (!scrollToBottomBtn || !modalInputWrapper) return;
  const inputWrapperHeight = modalInputWrapper.offsetHeight;
  const bottomPosition = inputWrapperHeight + 20;
  scrollToBottomBtn.style.bottom = `${bottomPosition}px`;
}

function updateReplicatedValue(textareaWrapper, textarea, scrollToBottomBtn, modalInputWrapper) {
  if (!textareaWrapper || !textarea) return;
  textareaWrapper.dataset.replicatedValue = textarea.value;
  updateScrollButtonPosition(scrollToBottomBtn, modalInputWrapper);
}

function checkScrollPosition(chatHistory, scrollToBottomBtn) {
  if (!chatHistory || !scrollToBottomBtn) return;
  if (chatHistory.scrollHeight - chatHistory.scrollTop - chatHistory.clientHeight < 100) {
    scrollToBottomBtn.classList.remove('show');
  } else {
    scrollToBottomBtn.classList.add('show');
  }
}

function scrollToBottom(chatHistory) {
  if (!chatHistory) return;
  chatHistory.scrollTo({
    top: chatHistory.scrollHeight,
    behavior: 'smooth',
  });
}

function scrollChatToBottom(scrollToBottomBtn) {
  const messages = document.querySelectorAll('.user-message');
  const chat = messages[messages.length - 1];
  // Skip scroll for first message
  if (!chat || messages.length <= 1) return;
  // eslint-disable-next-line no-shadow
  const chatHistory = document.querySelector('.chat-history');
  chatHistory.classList.add('is-scrolling');
  chat.scrollIntoView({
    block: 'start',
    behavior: 'smooth',
  });
  checkScrollPosition(chatHistory, scrollToBottomBtn);
}

function showLoadingMessage(container, scrollToBottomBtn) {
  const loading = document.createElement('div');
  loading.className = 'chat-loader';
  loading.innerHTML = `
    <div class="message-content loading-message">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  container.appendChild(loading);
  scrollChatToBottom(scrollToBottomBtn);
  return loading;
}

function removeLoadingMessage(loadingEl) {
  if (loadingEl) {
    loadingEl.remove();
  }
}

function showChatError(chatHistory, text) {
  if (!chatHistory) return;

  const chatMessage = document.createElement('div');
  chatMessage.className = 'chat-message yukon-message new-message';

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  const messageText = document.createElement('div');
  messageText.className = 'message-text error-message';
  messageText.textContent = text;

  messageContent.appendChild(messageText);
  chatMessage.appendChild(messageContent);
  chatHistory.appendChild(chatMessage);
}

const appendUserMessage = (messageText, chatHistory, scrollToBottomBtn) => {
  if (!chatHistory) return null;
  const userMessage = document.createElement('div');
  userMessage.className = 'chat-message user-message';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = messageText;

  userMessage.appendChild(content);

  // Find last chat-message
  const messages = chatHistory.querySelectorAll('.chat-message');
  const lastMessage = messages[messages.length - 1];

  if (lastMessage && lastMessage.nextSibling) {
    lastMessage.parentNode.insertBefore(
      userMessage,
      lastMessage.nextSibling,
    );
  } else if (lastMessage) {
    chatHistory.appendChild(userMessage);
  } else {
    chatHistory.prepend(userMessage);
  }

  chatHistory.scrollTop = chatHistory.scrollHeight;
  checkScrollPosition(chatHistory, scrollToBottomBtn);
  return userMessage;
};

// Enable/disable button based on textarea content
const updateButtonState = (textArea, inputFieldButton) => {
  const hasContent = textArea.value.trim().length > 0;
  if (hasContent) {
    inputFieldButton.removeAttribute('disabled');
  } else {
    inputFieldButton.setAttribute('disabled', '');
  }
};

// eslint-disable-next-line no-shadow, max-len
const sendMessage = async (textArea, chatHistory, sharedInputField, scrollToBottomBtn, modalInputWrapper, inputFieldButton, localizedText) => {
  if (!chatHistory) return;
  const question = textArea.value.trim();
  if (!question) return;
  const textareaWrapper = sharedInputField.querySelector('.yc-textarea-grow-wrap');
  textArea.value = '';
  updateReplicatedValue(textareaWrapper, textArea, scrollToBottomBtn, modalInputWrapper);
  updateButtonState(textArea, inputFieldButton);
  textArea.setAttribute('disabled', '');
  // Create new abort controller for this request
  currentAbortController = new AbortController();
  const { signal } = currentAbortController;
  // Show loading indicator first, right after user message
  const loadingElement = showLoadingMessage(chatHistory, scrollToBottomBtn);
  let level = 'partner-level-public';
  if (partnerIsSignedIn()) {
    try {
      const profileData = getPartnerCookieObject(getCurrentProgramType());
      level = `partner-level-${profileData.level.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '')}`;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.info('Failed to parse profileData from cookie:', error);
    }
  }
  try {
    const tags = [level].filter((tag) => tag && tag !== '').join(',');

    const origin = prodHosts.includes(window.location.host) ? 'https://partners.adobe.com' : 'https://partners.stage.adobe.com';
    const url = new URL(`${origin}/services/gravity/yukonAIAssistant`);
    url.searchParams.append('question', question);
    url.searchParams.append('tags', tags);
    url.searchParams.append('requestId', requestId);
    url.searchParams.append('yukonProfile', configs.yukonProfile);

    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      signal,
    });

    if (!resp || !resp.ok) {
      removeLoadingMessage(loadingElement);
      if (resp?.status === 504) {
        showChatError(chatHistory, localizedText['{{timeout-error}}']);
      } else {
        showChatError(chatHistory, localizedText['{{server-error}}']);
      }
      textArea.removeAttribute('disabled');
      inputFieldButton.removeAttribute('disabled');
      return;
    }

    // Create the yukon message container
    const chatMessage = document.createElement('div');
    chatMessage.className = 'chat-message yukon-message new-message';
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    chatMessage.appendChild(messageContent);
    messageContent.appendChild(messageText);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let sourcesProcessed = false;
    let accumulatedMarkdown = '';
    let messageAdded = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      // eslint-disable-next-line no-restricted-syntax
      for (const line of lines) {
        // eslint-disable-next-line no-continue
        if (!line.trim()) continue;
        try {
          if (line.startsWith('<!DOCTYPE html') || line.startsWith('<html')) {
            removeLoadingMessage(loadingElement);
            showChatError(chatHistory, localizedText['{{server-error}}']);
            reader.cancel();
            break;
          }
          // eslint-disable-next-line no-continue
          if (!line || !line.startsWith('[')) continue;
          const data = JSON.parse(line);
          const generatedText = data[0]?.generated_text || '';
          const source = data[0]?.source || {};
          if (generatedText) {
            accumulatedMarkdown += generatedText;
            if (loadingElement && !messageAdded) {
              removeLoadingMessage(loadingElement);
              chatHistory.appendChild(chatMessage);
              messageAdded = true;
            }
            // eslint-disable-next-line no-await-in-loop
            messageText.innerHTML = await parseMarkdown(accumulatedMarkdown);
          }
          if (source && Object.keys(source).length > 0) {
            if (!sourcesProcessed) {
              sourcesProcessed = true;
            }
          }
        } catch (parseError) {
          // eslint-disable-next-line no-console
          console.debug('Skipping non-JSON line:', line);
        }
      }
    }
    textArea.removeAttribute('disabled');
    inputFieldButton.removeAttribute('disabled');
    currentAbortController = null;
    if (chatHistory) {
      chatHistory.classList.remove('is-scrolling');
    }
  } catch (error) {
    if (loadingElement) {
      removeLoadingMessage(loadingElement);
    }
    // Don't show error if request was aborted (modal closed)
    if (error.name === 'AbortError') {
      textArea.removeAttribute('disabled');
      currentAbortController = null;
      return;
    }
    if (error instanceof TypeError) {
      showChatError(chatHistory, localizedText['{{network-error}}']);
    } else {
      showChatError(chatHistory, localizedText['{{server-error}}']);
    }
    textArea.removeAttribute('disabled');
    inputFieldButton.removeAttribute('disabled');
    currentAbortController = null;
    // eslint-disable-next-line no-console
    console.error('Yukon API error:', error);
    // eslint-disable-next-line no-console
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
};

export default async function init(el) {
  extractAuthoredConfigs(configs, el.children);
  const config = getConfig();
  const localizedText = {
    '{{send-message}}': 'Send Message',
    '{{open-chat}}': 'Open Chat',
    '{{scroll-to-bottom}}': 'Scroll to bottom',
    '{{timeout-error}}': 'This is taking longer than expected. Please try again in a moment.',
    '{{server-error}}': 'We’re having trouble processing your request right now. Please try again later.',
    '{{network-error}}': 'Network error. Please check your connection and try again.',
  };
  await localizationPromises(localizedText, config);

  populateLocalizedTextFromListItems(el, localizedText);

  const chatBlock = createTag('div', { class: 'yukon-chat-block' });
  chatBlock.setAttribute('daa-lh', 'Yukon Chat Block');
  const chatBlockHeader = createTag('div', { class: 'yc-block-header' }, configs?.blockHeader);
  const pillContainer = createTag('div', { class: 'yukon-chat-pill' });
  const inputField = createTag('section', { class: 'yc-input-field' });

  const textArea = createTag('textarea', {
    id: 'yc-input-field',
    rows: 1,
    placeholder: configs.inputPlaceholder,
  });

  const inputFieldButton = createTag('button', {
    class: 'yc-input-field-button',
    disabled: true,
    'aria-label': localizedText['{{send-message}}'],
    'daa-ll': processTrackingLabels(localizedText['{{send-message}}'], getConfig(), 30),
  }, submitIcon);

  const sharedInputField = createInputField(textArea, inputFieldButton);
  inputField.appendChild(sharedInputField);
  pillContainer.appendChild(inputField);

  if (configs?.blockHeader) chatBlock.appendChild(chatBlockHeader);
  chatBlock.appendChild(pillContainer);
  el.replaceWith(chatBlock);

  let chatHistory;
  let modalInputWrapper;
  let modalInstance = null; // Store modal
  let chatHistoryCreated = false; // Track if chat history was already created
  let scrollToBottomBtn = null;

  const textareaWrapper = sharedInputField.querySelector('.yc-textarea-grow-wrap');
  updateReplicatedValue(textareaWrapper, textArea, scrollToBottomBtn, modalInputWrapper);
  // Function to create modal content
  const createModalContent = () => {
    const fragment = new DocumentFragment();
    // Modal header
    const modalHeader = createTag('div', { class: 'yc-modal-header' });
    const headerTitle = createTag('h1', { class: 'yc-modal-title' }, configs.modalTitle);
    modalHeader.appendChild(headerTitle);
    // Chat dialog body
    const dialogBody = createTag('div', { class: 'yukon-chat-dialog-body' });
    const bodyContainer = createTag('div', { class: 'yukon-chat-container' });
    const chatInterface = createTag('div', { class: 'chat-interface' });
    // Reuse existing chat history or create new one
    if (!chatHistoryCreated) {
      chatHistory = createTag('div', { class: 'chat-history chat-direction-top-down chat-history-left' });
      const privacyNoticeMessage = createTag('div', { class: 'chat-message privacy-notice-message' });
      const privacyNoticeContent = createTag('div', { class: 'message-content privacy-notice-content' });
      const privacyNoticeTitle = createTag('div', { class: 'privacy-notice-title' });
      const privacyNoticeText = createTag('div', { class: 'privacy-notice-text' }, configs.modalPrivacyNotice);
      privacyNoticeContent.appendChild(privacyNoticeTitle);
      privacyNoticeContent.appendChild(privacyNoticeText);
      privacyNoticeMessage.appendChild(privacyNoticeContent);
      chatHistory.appendChild(privacyNoticeMessage);
      // Create scroll to bottom button
      scrollToBottomBtn = createTag('button', {
        class: 'scroll-to-bottom-btn',
        'aria-label': localizedText['{{scroll-to-bottom}}'],
      }, arrowIcon);
      scrollToBottomBtn.addEventListener('click', () => scrollToBottom(chatHistory));
      // Add scroll event listener to chat history
      chatHistory.addEventListener('scroll', () => checkScrollPosition(chatHistory, scrollToBottomBtn));
      chatHistoryCreated = true;
    }
    // Modal input wrapper
    modalInputWrapper = createTag('div', { class: 'modal-input-wrapper' });
    chatInterface.appendChild(chatHistory);
    if (scrollToBottomBtn) {
      chatInterface.appendChild(scrollToBottomBtn);
    }
    chatInterface.appendChild(modalInputWrapper);
    bodyContainer.appendChild(chatInterface);
    dialogBody.appendChild(bodyContainer);
    fragment.appendChild(modalHeader);
    fragment.appendChild(dialogBody);
    return fragment;
  };
  // Function to show modal using getModal
  const showModal = async () => {
    document.body.classList.add('yc-disable-scroll');
    // Check if modal already exists in DOM
    if (modalInstance && document.body.contains(modalInstance)) {
      if (modalInputWrapper && !modalInputWrapper.contains(sharedInputField)) {
        modalInputWrapper.appendChild(sharedInputField);
      }
      setTimeout(() => {
        textArea.focus();
      }, 100);
      return modalInstance;
    }
    const modalContent = createModalContent();
    const modal = await getModal(null, {
      id: 'yukon-chat-modal',
      content: modalContent,
      closeEvent: 'yukon:modal:closed',
      class: 'yukon-chat-modal-wrapper',
      closeCallback: async () => {
        document.body.classList.remove('yc-disable-scroll');
        if (modalInstance) {
          modalInstance.classList.add('closing');
          // eslint-disable-next-line no-promise-executor-return
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        // Abort any ongoing request
        if (currentAbortController) {
          currentAbortController.abort();
          currentAbortController = null;
        }
        // Re-enable textarea if it was disabled
        textArea.removeAttribute('disabled');
        // Move input field back to pill when modal closes
        if (inputField && sharedInputField) {
          inputField.appendChild(sharedInputField);
        }
        textArea.value = '';
        updateButtonState(textArea, inputFieldButton);
        updateReplicatedValue(textareaWrapper, textArea, scrollToBottomBtn, modalInputWrapper);
        if (modalInstance) {
          modalInstance.classList.remove('closing');
        }
      },
    });
    if (!modal) {
      return null;
    }
    const closeBtn = modal.querySelector('.dialog-close');
    if (closeBtn) {
      closeBtn.style.setProperty('--yc-dialog-close-bg', `url("${DIALOG_CLOSE_ICON_URL}")`);
    }
    modalInstance = modal;
    modal.classList.add('yukon-chat-modal');
    requestAnimationFrame(() => {
      modal.classList.add('opening');
      setTimeout(() => {
        modal.classList.remove('opening');
      }, 500);
    });
    if (modalInputWrapper) {
      modalInputWrapper.appendChild(sharedInputField);
      setTimeout(() => {
        updateScrollButtonPosition(scrollToBottomBtn, modalInputWrapper);
      }, 100);
    }
    setTimeout(() => {
      textArea.focus();
    }, 100);
    return modal;
  };
  textArea.addEventListener('input', () => {
    updateButtonState(textArea, inputFieldButton);
    updateReplicatedValue(textareaWrapper, textArea, scrollToBottomBtn, modalInputWrapper);
  });
  // Handle Enter key press
  textArea.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputFieldButton.hasAttribute('disabled')) {
        if (textArea.value === '') return;
        await showModal();
        appendUserMessage(textArea.value, chatHistory, scrollToBottomBtn);
        await sendMessage(
          textArea,
          chatHistory,
          sharedInputField,
          scrollToBottomBtn,
          modalInputWrapper,
          inputFieldButton,
          localizedText,
        );
        updateReplicatedValue(textareaWrapper, textArea, scrollToBottomBtn, modalInputWrapper);
      }
    }
  });

  inputFieldButton.addEventListener('click', async () => {
    if (textArea.value === '') return;
    await showModal();
    appendUserMessage(textArea.value, chatHistory, scrollToBottomBtn);
    await sendMessage(
      textArea,
      chatHistory,
      sharedInputField,
      scrollToBottomBtn,
      modalInputWrapper,
      inputFieldButton,
      localizedText,
    );
    updateReplicatedValue(textareaWrapper, textArea, scrollToBottomBtn, modalInputWrapper);
  });
  updateButtonState(textArea, inputFieldButton);
}
