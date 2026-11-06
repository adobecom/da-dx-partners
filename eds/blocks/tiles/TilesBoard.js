import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

function getButtonLabel(action) {
  return action === 'undo' ? 'Undo' : 'Mark as completed';
}

function setButtonState(button, { disabled, label }) {
  button.setAttribute('aria-disabled', String(disabled));
  if (typeof label !== 'undefined') {
    button.textContent = label;
  }
}

async function handleJourneyCardToggle(event, onComplete, title, cardId) {
  event.preventDefault();
  event.stopPropagation();

  const button = event.currentTarget;
  const { action = 'complete' } = button.dataset;
  const nextAction = action === 'complete' ? 'undo' : 'complete';
  const originalLabel = getButtonLabel(action);
  const nextLabel = getButtonLabel(nextAction);

  if (button.getAttribute('aria-disabled') === 'true') {
    return;
  }

  if (typeof onComplete !== 'function' || !cardId) {
    return;
  }

  setButtonState(button, { disabled: true, label: 'Processing...' });

  try {
    const success = await onComplete(Number(cardId), action);
    if (!success) {
      setButtonState(button, { disabled: false, label: originalLabel });
      return;
    }

    button.dataset.action = nextAction;
    button.setAttribute('daa-ll', `${nextLabel}-${cardId}--${processTrackingLabels(title)}`);
    setButtonState(button, { disabled: false, label: nextLabel });
  } catch (error) {
    setButtonState(button, { disabled: false, label: originalLabel });
  }
}

function createCardMarkup(card, onComplete, index) {
  const title = String(card.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const description = String(card.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const actionLink = card.actionLink || '#';

  const root = document.createElement('div');
  root.className = 'journey-card';
  root.setAttribute('data-card-id', card.id || '');
  // set button label plus card title
  root.setAttribute('daa-lh', `Journey Card ${card.id} | ${processTrackingLabels(card.title ?? '')}`);

  const buttonLabel = 'Mark as completed';

  root.innerHTML = `
   <div class="foreground">
     <div class="body-s">
       <h3 class="heading-l">${title}</h3>
       <p class="body-s">${description}</p>
     </div>
   </div>
   <div class="card-footer">
     <div class="body-s action-area">
       <em>
<!--        should it open on new tab or existing-->
         <a href="${actionLink}" target="_blank" class="con-button outline fill" daa-ll="View-${card.id}--${processTrackingLabels(title)}">View</a>
       </em>
       ${card.neverCompletesCard ? '' : `<em><a href="#" class="con-button outline fill journey-card-toggle" data-card-id="${card.id || ''}"
daa-ll="Complete-${card.id}--${processTrackingLabels(title)}" 
data-action="complete" aria-disabled="false">
         ${buttonLabel}
       </a></em>`}
     </div>
   </div>
 `;

  const toggle = root.querySelector('.journey-card-toggle');
  if (toggle) {
    toggle.addEventListener('click', (event) => handleJourneyCardToggle(event, onComplete, title, card.id));
  }
  root.addEventListener('click', () => {
    // should it open in new tab or on existing : window.location.assign(links[0].href)
    // should card be clickable
    (() => (window.open(actionLink)))();
  });
  // will this be on block metadata or on card metadata? for now just hardcoeded
  const backgroundMap = {
    1: 'rgb(255, 250, 235)',
    2: 'rgb(255, 247, 209)',
    3: 'rgb(255, 238, 183)',
    4: 'rgb(249, 241, 249)',
    5: 'rgb(248, 230, 249)',
    6: 'rgb(241, 213, 242)',
    7: 'rgb(240, 255, 248)',
    8: 'rgb(231, 255, 239)',
    9: 'rgb(216, 255, 230)',
  };
  root.style.background = backgroundMap[index + 1];
  return root;
}

export default function renderBoard(cards, actionHandler) {
  const journeyBoard = document.createElement('div');
  journeyBoard.className = 'journey-board';

  cards.forEach((card, index) => {
    const tile = createCardMarkup(
      card,
      actionHandler,
      index,
    );
    journeyBoard.appendChild(tile);
  });
  return journeyBoard;
}
