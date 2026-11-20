import {getLibs} from "../../scripts/utils.js";

const miloLibs = getLibs();
const { html, LitElement, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

function getButtonLabel(action) {
  return action === 'undo' ? 'Undo' : 'Mark as completed';
}

export default class JourneyCards extends LitElement {
  static properties = {
    toDoCards: { type: Array },
    completedCards: { type: Array },
    actionHandler: { type: Object },
    // Reserved for the upcoming to-do/completed tabs; defaults to the
    // current single-board behavior until tab switching is wired up.
    tab: { type: Number },
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
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('cards') || changedProperties.has('tab')) {
      console.log('tab changed');
console.log('this.completedc ards', this.completedCards);
console.log('this todo', this.toDoCards);
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
        label: this.tab === 0 ? 'Mark as completed' : 'Revisit task',
        recommended: index === 0 && this.tab === 0,
      });
    });
    this.cardStates = nextStates;
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
    const originalLabel = state.label;
    const nextLabel = getButtonLabel(nextAction);

    this.setCardState(card.id, { ...state, disabled: true, label: 'Processing...' });

    try {
      const success = await this.actionHandler(Number(card.id), currentAction);
      if (!success) {
        this.setCardState(card.id, { ...state, disabled: false, label: originalLabel });
        return;
      }
      const nextState = { ...state, action: nextAction, disabled: false, label: nextLabel };
      this.setCardState(card.id, nextState);
    } catch (error) {
      this.setCardState(card.id, { ...state, disabled: false, label: originalLabel });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  openCard(actionLink) {
    window.open(actionLink);
  }

  renderCard(card, index) {
    const state = this.cardStates.get(card.id) || {
      action: 'complete',
      disabled: false,
      label: this.tab === 0 ? 'Mark as completed' : 'Revisit task',
      recommended: index === 0 && this.tab === 0,
    };
    const actionLink = card.actionLink || '#';
    const showToggle = !(card.neverCompletesCard && this.tab === 0);
    const trackingTitle = processTrackingLabels(card.title ?? '');

    /* eslint-disable indent */
    return html`
      <div
        class="journey-card ${state.recommended ? 'recommended' : ''}"
        data-card-id="${card.id || ''}"
        daa-lh="Journey Card ${card.id} | ${trackingTitle}"
        @click="${() => this.openCard(actionLink)}"
      >
        <div class="foreground">
          <div class="body-s">
            ${state.recommended ? html`<p class="detail-m">Recommended</p>` : ''}
            <h3 class="heading-l">${card.title}</h3>
            <p class="body-s">${card.description}</p>
          </div>
        </div>
        <div class="card-footer">
          <div class="body-s action-area">
            <em>
              <a
                href="${actionLink}"
                target="_blank"
                class="open-task-link con-button outline fill"
                daa-ll="Open-task-${card.id}--${trackingTitle}"
              >Open task</a>
            </em>
            ${showToggle ? html`
              <sp-theme theme="spectrum" color="light" scale="medium">
                <sp-button
                  class="journey-card-toggle"
                  variant="secondary"
                  size="m"
                  ?disabled="${state.disabled}"
                  data-card-id="${card.id || ''}"
                  data-action="${state.action}"
                  aria-disabled="${state.disabled}"
                  daa-ll="${getButtonLabel(state.action)}-${card.id}--${trackingTitle}"
                  @click="${(event) => this.handleToggle(card, event)}"
                >${state.label}</sp-button>
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
            <sp-button-group>
              <sp-button variant="${this.tab === 0 ? 'primary' : 'secondary'}" size="m" @click="${() => this.setTab(0)}" aria-label="${this.blockData.localizedText['{{to-do}}']}">
                ${this.blockData.localizedText['{{to-do}}']}</sp-button>
              <sp-button variant="${this.tab === 1 ? 'primary' : 'secondary'}" size="m" @click="${() => this.setTab(1)}" aria-label="${this.blockData.localizedText['{{completed}}']}">
                ${this.blockData.localizedText['{{completed}}']} (${this.completedCards.length})</sp-button>
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
    ? html`<div class="journey-board">
        ${repeat(
    this.toDoCards,
    (card) => card.id,
    (card, index) => this.renderCard(card, index),
  )}
      </div>` : html`<div class="journey-board">
        ${repeat(
    this.completedCards,
    (card) => card.id,
    (card, index) => this.renderCard(card, index),
  )}
      </div>`}
    `;
  }

  setTab(number) {
    this.tab = number;
  }
}
