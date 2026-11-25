import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../eds/scripts/utils.js';

const miloLibs = setLibs('/libs');
const { setConfig } = await import(`${miloLibs}/utils/utils.js`);
setConfig({ locales: { '': { ietf: 'en-US' } }, miloLibs });
await Promise.all([
  import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
  import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
  import(`${miloLibs}/features/spectrum-web-components/dist/button-group.js`),
]);
const { default: JourneyCards } = await import('../../../eds/blocks/journey-cards/JourneyCards.js');

function declareJourneyCards() {
  if (customElements.get('journey-cards')) return;
  customElements.define('journey-cards', JourneyCards);
}
declareJourneyCards();

const localizedText = {
  '{{to-do}}': 'To Do',
  '{{completed}}': 'Completed',
  '{{suggested-next}}': 'Suggested next',
  '{{open}}': 'Open',
  '{{mark-complete}}': 'Mark complete',
  '{{undo}}': 'Undo',
  '{{revisit-task}}': 'Revisit task',
};

function makeInstance({
  toDoCards = [],
  completedCards = [],
  actionHandler = null,
  tab = 0,
} = {}) {
  const el = document.createElement('journey-cards');
  el.blockData = { localizedText };
  el.toDoCards = toDoCards;
  el.completedCards = completedCards;
  el.actionHandler = actionHandler;
  el.tab = tab;
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

  it('renders cards with title, description and an open task button', async () => {
    const el = makeInstance({
      toDoCards: [
        { id: 5, title: 'Title', description: 'Description', actionLink: 'https://example.com' },
      ],
    });
    await el.updateComplete;

    const card = el.querySelector('.journey-card');
    expect(card).to.exist;
    expect(card.querySelector('.heading-l').textContent).to.equal('Title');
    expect(card.querySelector('p.body-s').textContent).to.equal('Description');

    const openStub = sinon.stub(window, 'open');
    const link = card.querySelector('.open-task-link');
    expect(link.textContent.trim()).to.contain('Open');
    link.click();
    expect(openStub.calledOnceWithExactly('https://example.com', '_blank', 'noopener')).to.be.true;
  });

  it('marks the first card as recommended on the default tab', async () => {
    const el = makeInstance({
      toDoCards: [
        { id: 1, title: 'First', description: 'd' },
        { id: 2, title: 'Second', description: 'd' },
      ],
    });
    await el.updateComplete;

    const cards = el.querySelectorAll('.journey-card');
    expect(cards[0].classList.contains('recommended')).to.be.true;
    expect(cards[1].classList.contains('recommended')).to.be.false;
    expect(cards[0].querySelector('.detail-m').textContent).to.equal('Suggested next');
  });

  it('does not render a toggle button for never-completing cards on the default tab', async () => {
    const el = makeInstance({
      toDoCards: [
        { id: 3, title: 'Evergreen', description: 'd', neverCompletesCard: true },
      ],
    });
    await el.updateComplete;

    expect(el.querySelector('.journey-card-toggle')).to.equal(null);
  });

  it('completes a card and flips the toggle to Undo on success', async () => {
    const actionHandler = sinon.stub().resolves(true);
    const el = makeInstance({
      toDoCards: [{ id: 7, title: 'Title', description: 'd' }],
      actionHandler,
    });
    await el.updateComplete;

    const toggle = el.querySelector('.journey-card-toggle');
    expect(toggle.textContent.trim()).to.contain('Mark complete');

    toggle.click();
    await flushMicrotasks();
    await el.updateComplete;

    expect(actionHandler.calledOnceWithExactly(7, 'complete')).to.be.true;
    expect(toggle.textContent.trim()).to.contain('Undo');
  });

  it('reverts the toggle label when the action handler reports failure', async () => {
    const actionHandler = sinon.stub().resolves(false);
    const el = makeInstance({
      toDoCards: [{ id: 8, title: 'Title', description: 'd' }],
      actionHandler,
    });
    await el.updateComplete;

    const toggle = el.querySelector('.journey-card-toggle');
    toggle.click();
    await flushMicrotasks();
    await el.updateComplete;

    expect(toggle.textContent.trim()).to.contain('Mark complete');
    expect(toggle.hasAttribute('disabled')).to.be.false;
  });

  it('reverts the toggle label when the action handler throws', async () => {
    const actionHandler = sinon.stub().rejects(new Error('network error'));
    const el = makeInstance({
      toDoCards: [{ id: 9, title: 'Title', description: 'd' }],
      actionHandler,
    });
    await el.updateComplete;

    const toggle = el.querySelector('.journey-card-toggle');
    toggle.click();
    await flushMicrotasks();
    await el.updateComplete;

    expect(toggle.textContent.trim()).to.contain('Mark complete');
  });

  it('ignores toggle clicks while a request is already in flight', async () => {
    let resolveAction;
    const actionHandler = sinon.stub().returns(new Promise((resolve) => { resolveAction = resolve; }));
    const el = makeInstance({
      toDoCards: [{ id: 12, title: 'Title', description: 'd' }],
      actionHandler,
    });
    await el.updateComplete;

    const toggle = el.querySelector('.journey-card-toggle');
    toggle.click();
    await el.updateComplete;
    expect(toggle.hasAttribute('disabled')).to.be.true;

    toggle.click();
    await el.updateComplete;
    expect(actionHandler.calledOnce).to.be.true;

    resolveAction(true);
    await flushMicrotasks();
    await el.updateComplete;
    expect(toggle.textContent.trim()).to.contain('Undo');
    expect(toggle.hasAttribute('disabled')).to.be.false;
  });

  it('switches tabs and renders the completed cards list', async () => {
    const el = makeInstance({
      toDoCards: [{ id: 1, title: 'To do card', description: 'd' }],
      completedCards: [{ id: 2, title: 'Completed card', description: 'd' }],
    });
    await el.updateComplete;

    expect(el.querySelector('.journey-board-tab-btn[variant="primary"]').textContent).to.contain('To Do');

    const completedTabBtn = el.querySelectorAll('.journey-board-tab-btn')[1];
    expect(completedTabBtn.textContent).to.contain('Completed');
    expect(completedTabBtn.textContent).to.contain('1');

    completedTabBtn.click();
    await el.updateComplete;

    expect(el.tab).to.equal(1);
    const card = el.querySelector('.journey-card');
    expect(card.querySelector('.heading-l').textContent).to.equal('Completed card');
    expect(card.querySelector('.journey-card-toggle')).to.equal(null);
  });

  it('excludes never-completing cards from the completed tab count and list', async () => {
    const el = makeInstance({
      completedCards: [
        { id: 2, title: 'Completed card', description: 'd' },
        { id: 3, title: 'Evergreen', description: 'd', neverCompletesCard: true },
      ],
    });
    await el.updateComplete;

    const completedTabBtn = el.querySelectorAll('.journey-board-tab-btn')[1];
    expect(completedTabBtn.textContent).to.contain('1');

    el.setTab(1);
    await el.updateComplete;

    const cards = el.querySelectorAll('.journey-card');
    expect(cards.length).to.equal(1);
    expect(cards[0].querySelector('.heading-l').textContent).to.equal('Completed card');
  });
});
