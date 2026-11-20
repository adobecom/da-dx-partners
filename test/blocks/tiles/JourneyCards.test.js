import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';

setLibs('/libs');
const { default: JourneyCards } = await import('../../../eds/blocks/tiles/JourneyCards.js');

function declareJourneyCards() {
  if (customElements.get('journey-cards')) return;
  customElements.define('journey-cards', JourneyCards);
}
declareJourneyCards();

function makeInstance(cards, actionHandler) {
  const el = document.createElement('journey-cards');
  el.toDoCards = cards;
  el.actionHandler = actionHandler;
  document.body.appendChild(el);
  return el;
}

function flushMicrotasks() {
  return new Promise((resolve) => { setTimeout(resolve); });
}

describe('JourneyCards', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('renders cards with title, description and open task link inside shadow DOM', async () => {
    const el = makeInstance([
      { id: 5, title: 'Title', description: 'Description', actionLink: 'https://example.com' },
    ]);
    await el.updateComplete;

    const card = el.shadowRoot.querySelector('.journey-card');
    expect(card).to.exist;
    expect(card.getAttribute('data-card-id')).to.equal('5');
    expect(card.querySelector('.heading-l').textContent).to.equal('Title');
    expect(card.querySelector('.body-s + .body-s, p.body-s').textContent).to.equal('Description');
    const link = card.querySelector('.open-task-link');
    expect(link.getAttribute('href')).to.equal('https://example.com');
    expect(link.getAttribute('target')).to.equal('_blank');
  });

  it('marks the first card as recommended on the default tab', async () => {
    const el = makeInstance([
      { id: 1, title: 'First', description: 'd' },
      { id: 2, title: 'Second', description: 'd' },
    ]);
    await el.updateComplete;

    const cards = el.shadowRoot.querySelectorAll('.journey-card');
    expect(cards[0].classList.contains('recommended')).to.be.true;
    expect(cards[1].classList.contains('recommended')).to.be.false;
    expect(cards[0].querySelector('.detail-m').textContent).to.equal('Recommended');
  });

  it('does not render a toggle button for never-completing cards on the default tab', async () => {
    const el = makeInstance([
      { id: 3, title: 'Evergreen', description: 'd', neverCompletesCard: true },
    ]);
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('.journey-card-toggle')).to.equal(null);
  });

  it('completes a card and flips the toggle to Undo on success', async () => {
    const actionHandler = sinon.stub().resolves(true);
    const el = makeInstance([{ id: 7, title: 'Title', description: 'd' }], actionHandler);
    await el.updateComplete;

    const toggle = el.shadowRoot.querySelector('.journey-card-toggle');
    expect(toggle.textContent.trim()).to.equal('Mark as completed');

    toggle.click();
    await flushMicrotasks();
    await el.updateComplete;

    expect(actionHandler.calledOnceWithExactly(7, 'complete')).to.be.true;
    expect(toggle.textContent.trim()).to.equal('Undo');
    expect(toggle.dataset.action).to.equal('undo');
  });

  it('reverts the toggle label when the action handler reports failure', async () => {
    const actionHandler = sinon.stub().resolves(false);
    const el = makeInstance([{ id: 8, title: 'Title', description: 'd' }], actionHandler);
    await el.updateComplete;

    const toggle = el.shadowRoot.querySelector('.journey-card-toggle');
    toggle.click();
    await flushMicrotasks();
    await el.updateComplete;

    expect(toggle.textContent.trim()).to.equal('Mark as completed');
    expect(toggle.dataset.action).to.equal('complete');
    expect(toggle.hasAttribute('disabled')).to.be.false;
  });

  it('reverts the toggle label when the action handler throws', async () => {
    const actionHandler = sinon.stub().rejects(new Error('network error'));
    const el = makeInstance([{ id: 9, title: 'Title', description: 'd' }], actionHandler);
    await el.updateComplete;

    const toggle = el.shadowRoot.querySelector('.journey-card-toggle');
    toggle.click();
    await flushMicrotasks();
    await el.updateComplete;

    expect(toggle.textContent.trim()).to.equal('Mark as completed');
  });

  it('opens the action link when the card body is clicked', async () => {
    const openStub = sinon.stub(window, 'open');
    const el = makeInstance([{ id: 11, title: 'Title', description: 'd', actionLink: 'https://example.com/task' }]);
    await el.updateComplete;

    el.shadowRoot.querySelector('.journey-card').click();

    expect(openStub.calledOnceWithExactly('https://example.com/task')).to.be.true;
  });

  it('ignores toggle clicks while a request is already in flight', async () => {
    let resolveAction;
    const actionHandler = sinon.stub().returns(new Promise((resolve) => { resolveAction = resolve; }));
    const el = makeInstance([{ id: 12, title: 'Title', description: 'd' }], actionHandler);
    await el.updateComplete;

    const toggle = el.shadowRoot.querySelector('.journey-card-toggle');
    toggle.click();
    await el.updateComplete;
    expect(toggle.textContent.trim()).to.equal('Processing...');

    toggle.click();
    await el.updateComplete;
    expect(actionHandler.calledOnce).to.be.true;

    resolveAction(true);
    await flushMicrotasks();
    await el.updateComplete;
    expect(toggle.textContent.trim()).to.equal('Undo');
  });
});
