import { getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { html, LitElement, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

function getToggleIconSrc(action) {
  return action === 'undo'
    ? '/eds/img/icons/undo.svg'
    : '/eds/img/icons/checkmark-circle-outline.svg';
}

export default class JourneyCards extends LitElement {
  static properties = {
    toDoCards: { type: Array },
    completedCards: { type: Array },
    actionHandler: { type: Object },
    tab: { type: Number },
    segmentTotalCards: { type: Number },
    cardStates: { state: true },
    blockData: { type: Object },
  };

  constructor() {
    super();
    this.toDoCards = [];
    this.completedCards = [];
    this.actionHandler = null;
    this.tab = 0;
    this.cardStates = new Map();
    this.blockData = {};
    this.segmentTotalCards = 0;
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('cards') || changedProperties.has('tab')) {
      this.syncCardStates();
    }
  }

  createRenderRoot() {
    return this;
  }

  syncCardStates() {
    const nextStates = new Map();
    this.toDoCards.forEach((card, index) => {
      nextStates.set(card.id, this.cardStates.get(card.id) || {
        action: 'complete',
        disabled: false,
        recommended: index === 0 && this.tab === 0,
      });
    });
    this.cardStates = nextStates;
  }

  setTab(number) {
    this.tab = number;
  }

  getButtonLabel(action, tab) {
    if (action === 'undo') {
      return this.blockData?.localizedText['{{undo}}'];
    }
    if (tab === 0 && action === 'complete') {
      return this.blockData?.localizedText['{{mark-complete}}'];
    }
    if (tab === 0 && action === 'open') {
      return this.blockData?.localizedText['{{open}}'];
    }
    if (tab === 1 && action === 'open') {
      return this.blockData?.localizedText['{{revisit-task}}'];
    }
    return '';
  }

  setCardState(cardId, nextState) {
    const next = new Map(this.cardStates);
    next.set(cardId, nextState);
    this.cardStates = next;
  }

  async handleToggle(card, event) {
    event.preventDefault();
    event.stopPropagation();
    const state = this.cardStates.get(card.id);
    if (!state || state.disabled || typeof this.actionHandler !== 'function') return;

    const currentAction = state.action;
    const nextAction = currentAction === 'complete' ? 'undo' : 'complete';

    this.setCardState(card.id, { ...state, disabled: true });

    try {
      const success = await this.actionHandler(Number(card.id), currentAction);
      if (!success) {
        this.setCardState(card.id, { ...state, disabled: false });
        return;
      }
      const nextState = { ...state, action: nextAction, disabled: false };
      this.setCardState(card.id, nextState);
    } catch (error) {
      this.setCardState(card.id, { ...state, disabled: false });
    }
  }

  renderCard(card, index, tab) {
    const state = tab === 0 ? this.cardStates.get(card.id) : { completed: true };
    const actionLink = card.actionLink || '#';
    const trackingTitle = processTrackingLabels(card.title ?? '');

    return html`
      <div
        class="journey-card ${state.recommended && !card.neverCompletesCard ? 'recommended' : ''} ${state.completed ? 'completed' : ''}"
        data-card-id="${card.id || ''}"
        daa-lh="Journey card | ${card.id} | ${trackingTitle}"
      >
        <div class="foreground">
          <div class="body-s">
            ${state.recommended && !card.neverCompletesCard ? html`<p class="detail-m">${this.blockData.localizedText['{{suggested-next}}']}</p>` : ''}
            ${tab === 1 ? html`<p class="detail-m"><img
              class="journey-card-toggle-icon"
              src="/eds/img/icons/checkmark-circle-outline-green.svg"
              alt=""
              aria-hidden="true"
              width="18"
              height="18"
            /> ${this.blockData.localizedText['{{completed}}']}</p>` : ''}
            <h3 class="heading-l">${card.title}</h3>
            <p class="body-s">${card.description}</p>
          </div>
        </div>
        <div class="card-footer">
          <div class="body-s action-area">
            <sp-theme theme="spectrum" color="light" scale="medium">
              <sp-button
                class="open-task-link"
                variant="primary"
                size="m"
                data-card-id="${card.id || ''}"
                daa-ll="${processTrackingLabels(this.getButtonLabel('open', tab))}"
                @click="${() => window.open(actionLink, '_blank', 'noopener')}"
              >  <span class="btn-content">

                ${this.getButtonLabel('open', tab)} <img
                  class="journey-card-btn-icon open-task-icon"
                  src="/eds/img/icons/open-task-arrow.svg"
                  alt=""
                  aria-hidden="true"
                  width="14"
                  height="14"
                /></span></sp-button>
            </sp-theme>
            ${tab === 0 && !card.neverCompletesCard ? html`
              <sp-theme theme="spectrum" color="light" scale="medium">
                <sp-button
                  class="journey-card-toggle"
                  variant="secondary"
                  size="m"
                  ?disabled="${state.disabled}"
                  data-card-id="${card.id || ''}"
                  data-action="${state.action}"
                  aria-disabled="${state.disabled}"
                  daa-ll="${processTrackingLabels(this.getButtonLabel(state.action, tab))}"
                  @click="${(event) => this.handleToggle(card, event)}"
                >  <span class="btn-content">
                  <img
                    class="journey-card-btn-icon"
                    src="${getToggleIconSrc(state.action)}"
                    alt=""
                    aria-hidden="true"
                    width="18"
                    height="18"
                  /> ${this.getButtonLabel(state.action, tab)}</span></sp-button>
              </sp-theme>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    /* eslint-enable indent */
  }

  // eslint-disable-next-line class-methods-use-this
  renderHeader() {
    return html`
      <div class="journey-tabs">
          <sp-theme theme="spectrum" color="light" scale="medium">
            <sp-button-group size="l">
              <sp-button daa-ll="Journey tab | to do"  variant="${this.tab === 0 ? 'primary' : 'secondary'}" size="l" class="journey-board-tab-btn" @click="${() => this.setTab(0)}" aria-label="${this.blockData.localizedText['{{to-do}}']}">
                ${this.blockData.localizedText['{{to-do}}']}</sp-button>
              <sp-button daa-ll="Journey tab | completed" variant="${this.tab === 1 ? 'primary' : 'secondary'}" size="l" class="journey-board-tab-btn" @click="${() => this.setTab(1)}" aria-label="${this.blockData.localizedText['{{completed}}']}">
                ${this.blockData.localizedText['{{completed}}']} (${this.completedCards.filter((card) => !card.neverCompletesCard).length})</sp-button>
            </sp-button-group>
          </sp-theme>
        </div>
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`
      ${this.renderHeader()}
      ${this.tab === 0
    ? html`<div class="journey-board" daa-ll="Journey board | ${processTrackingLabels(this.segment)} | total cards: ${this.segmentTotalCards} | completed cards: ${this.completedCards.length}">
        ${repeat(
    this.toDoCards,
    (card) => card.id,
    (card, index) => this.renderCard(card, index, 0),
  )}
      </div>` : html`<div class="journey-board" daa-ll="Journey board completed cards | ${processTrackingLabels(this.segment)}">
        ${repeat(
    this.completedCards,
    (card) => card.id,
    (card, index) => {
      if (!card.neverCompletesCard) return this.renderCard(card, index, 1); 
      return undefined;
    },
  )}
      </div>`}
    `;
  }
}
