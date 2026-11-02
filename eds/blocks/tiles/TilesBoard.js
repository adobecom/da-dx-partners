function toggleDisabledButtonsStates() {
  const buttons = document.querySelectorAll('.journey-card-toggle');
  buttons.forEach((button) => {
    const isDisabled = button.getAttribute('aria-disabled') === 'true';
    button.setAttribute('aria-disabled', String(!isDisabled));
    // button.classList.toggle('is-loading', !isDisabled);
    button.style.pointerEvents = isDisabled ? 'auto' : 'none';
  });
}

function createCardMarkup(card, onComplete) {
  const title = String(card.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const description = String(card.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const actionLink = card.actionLink || '#';

  const root = document.createElement('div');
  root.className = 'journey-card static-links-copy s-lockup light l-rounded-corners no-border click hover-scale con-block equal-height';
  root.setAttribute('data-card-id', card.id || '');
  root.setAttribute('data-block-status', 'loaded');
  root.setAttribute('daa-lh', 'b3|journey-card');

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
          <a href="${actionLink}" target="_blank" class="con-button outline fill" daa-ll="View-1--${title}">View</a>
        </em>
        ${card.neverCompletesCard ? '' : `<em><a href="#" class="con-button outline fill journey-card-toggle" data-card-id="${card.id || ''}" data-action="complete" aria-disabled="false">
          ${buttonLabel}
        </a></em>`}
      </div>
    </div>
  `;

  const toggle = root.querySelector('.journey-card-toggle');
  if (toggle) {
    toggle.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const { cardId, action } = event.currentTarget.dataset;
      const nextAction = action === 'complete' ? 'undo' : 'complete';
      // event.currentTarget.dataset.action = nextAction;
      const button = event.currentTarget;
      if (typeof onComplete === 'function' && cardId) {
        button.textContent = 'Processing...';
        toggleDisabledButtonsStates();
        const success = await onComplete(Number(cardId), action);
        const nextLabel = success && nextAction === 'undo' ? 'Undo' : 'Mark as completed';
        button.textContent = nextLabel;
        button.dataset.action = nextAction;
        toggleDisabledButtonsStates();
      }
    });
  }

  return root;
}

export default function renderBoard(cards, actionHandler) {
  const section = document.createElement('div');
  section.className = 'section three-up';

  cards.forEach((card) => {
    const tile = createCardMarkup(
      card,
      actionHandler,
      card.completed,
    );
    section.appendChild(tile);
  });
  return section;
}
