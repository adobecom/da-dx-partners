import { expect } from '@esm-bundle/chai';
import LoadingSpinner from '../../eds/components/LoadingSpinner.js';

// ---------------------------------------------------------------------------
// Helper: create and connect a spinner to the DOM so lifecycle fires.
// ---------------------------------------------------------------------------
function makeSpinner({ text, theme } = {}) {
  const el = document.createElement('loading-spinner');
  if (text !== undefined) el.setAttribute('text', text);
  if (theme !== undefined) el.setAttribute('theme', theme);
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
describe('LoadingSpinner – custom element registration', () => {
  it('is registered as "loading-spinner"', () => {
    expect(customElements.get('loading-spinner')).to.equal(LoadingSpinner);
  });
});

// ---------------------------------------------------------------------------
describe('LoadingSpinner – connectedCallback', () => {
  it('calls applyTheme and render when connected to DOM', () => {
    const spinner = makeSpinner();
    expect(spinner.innerHTML).to.include('class="spinner"');
  });

  it('renders a spinner div with aria-hidden="true"', () => {
    const spinner = makeSpinner();
    const div = spinner.querySelector('div.spinner');
    expect(div).to.not.be.null;
    expect(div.getAttribute('aria-hidden')).to.equal('true');
  });
});

// ---------------------------------------------------------------------------
describe('LoadingSpinner – render()', () => {
  it('renders spinner div without text paragraph when no text attribute', () => {
    const spinner = makeSpinner();
    expect(spinner.querySelector('p.spinner-text')).to.be.null;
  });

  it('renders spinner text paragraph when text attribute is set', () => {
    const spinner = makeSpinner({ text: 'Loading…' });
    const p = spinner.querySelector('p.spinner-text');
    expect(p).to.not.be.null;
    expect(p.textContent).to.equal('Loading…');
  });

  it('does not render text paragraph when text attribute is empty string', () => {
    const spinner = makeSpinner({ text: '' });
    expect(spinner.querySelector('p.spinner-text')).to.be.null;
  });
});

// ---------------------------------------------------------------------------
describe('LoadingSpinner – applyTheme()', () => {
  it('applies light theme CSS properties when no theme attribute', () => {
    const spinner = makeSpinner();
    expect(spinner.style.getPropertyValue('--spinner-track-color')).to.equal('rgb(0 0 0 / 10%)');
    expect(spinner.style.getPropertyValue('--spinner-active-color')).to.equal('#006bff');
    expect(spinner.style.getPropertyValue('--spinner-text-color')).to.equal('#4b4b4b');
  });

  it('applies light theme CSS properties when theme="light"', () => {
    const spinner = makeSpinner({ theme: 'light' });
    expect(spinner.style.getPropertyValue('--spinner-track-color')).to.equal('rgb(0 0 0 / 10%)');
    expect(spinner.style.getPropertyValue('--spinner-active-color')).to.equal('#006bff');
    expect(spinner.style.getPropertyValue('--spinner-text-color')).to.equal('#4b4b4b');
  });

  it('applies dark theme CSS properties when theme="dark"', () => {
    const spinner = makeSpinner({ theme: 'dark' });
    expect(spinner.style.getPropertyValue('--spinner-track-color')).to.equal('rgb(255 255 255 / 30%)');
    expect(spinner.style.getPropertyValue('--spinner-active-color')).to.equal('#fff');
    expect(spinner.style.getPropertyValue('--spinner-text-color')).to.equal('#fff');
  });
});

// ---------------------------------------------------------------------------
describe('LoadingSpinner – attributeChangedCallback', () => {
  it('re-renders text paragraph when the text attribute is set after connection', () => {
    const spinner = makeSpinner();
    expect(spinner.querySelector('p.spinner-text')).to.be.null;

    spinner.setAttribute('text', 'Updated text');
    const p = spinner.querySelector('p.spinner-text');
    expect(p).to.not.be.null;
    expect(p.textContent).to.equal('Updated text');
  });

  it('switches to dark theme when theme attribute changes after connection', () => {
    const spinner = makeSpinner({ theme: 'light' });
    expect(spinner.style.getPropertyValue('--spinner-active-color')).to.equal('#006bff');

    spinner.setAttribute('theme', 'dark');
    expect(spinner.style.getPropertyValue('--spinner-active-color')).to.equal('#fff');
  });

  it('switches back to light theme when theme attribute changes to light', () => {
    const spinner = makeSpinner({ theme: 'dark' });
    expect(spinner.style.getPropertyValue('--spinner-active-color')).to.equal('#fff');

    spinner.setAttribute('theme', 'light');
    expect(spinner.style.getPropertyValue('--spinner-active-color')).to.equal('#006bff');
  });

  it('removes text paragraph when text attribute is removed', () => {
    const spinner = makeSpinner({ text: 'Hello' });
    expect(spinner.querySelector('p.spinner-text')).to.not.be.null;

    spinner.removeAttribute('text');
    expect(spinner.querySelector('p.spinner-text')).to.be.null;
  });
});

// ---------------------------------------------------------------------------
describe('LoadingSpinner – observedAttributes', () => {
  it('observes "text" and "theme" attributes', () => {
    expect(LoadingSpinner.observedAttributes).to.include('text');
    expect(LoadingSpinner.observedAttributes).to.include('theme');
  });
});
