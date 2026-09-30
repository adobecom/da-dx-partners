import { getLibs, getPartnerCookieValue, invokeAfterImsIsReady } from '../../scripts/utils.js';
import { partnershipProgressStyles } from './PartnershipProgressStyles.js';
import { DX_PARTNER_LEVEL, DX_PRIMARY_BUSINESS } from '../utils/dxConstants.js';
import { getPartnershipData } from '../utils/partnershipDataService.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);
import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`);
import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`);

const LEVEL_ORDER = [
  DX_PARTNER_LEVEL.SILVER.toLowerCase(),
  DX_PARTNER_LEVEL.GOLD.toLowerCase(),
  DX_PARTNER_LEVEL.PLATINUM.toLowerCase(),
];

function getTargetLevel(currentLevel) {
  const norm = String(currentLevel).toLowerCase();
  const idx = LEVEL_ORDER.indexOf(norm);
  if (idx >= LEVEL_ORDER.length - 1) return DX_PARTNER_LEVEL.PLATINUM.toLowerCase();
  return LEVEL_ORDER[idx + 1];
}

export default class PartnershipProgress extends LitElement {
  static styles = [partnershipProgressStyles];

  static properties = {
    blockData: { type: Object },
    data: { type: Object },
    loading: { type: Boolean },
    error: { type: String },
  };

  constructor() {
    super();
    this.data = null;
    this.loading = false;
    // eslint-disable-next-line no-underscore-dangle
    this._onImsReady = this._onImsReady.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    // eslint-disable-next-line no-underscore-dangle
    invokeAfterImsIsReady(this._onImsReady);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  // eslint-disable-next-line no-underscore-dangle
  _onImsReady() {
    this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      this.data = await getPartnershipData();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[partnership-progress] fetch error', e);
    } finally {
      this.loading = false;
    }
  }

  getProgramData(programType) {
    if (!this.data) return null;

    const currentLevel = getPartnerCookieValue('level');
    const targetLevelKey = getTargetLevel(currentLevel).toLowerCase();

    const items = this.data[programType] || [];
    return items.find((item) => item.level?.toLowerCase() === targetLevelKey) || null;
  }

  // eslint-disable-next-line class-methods-use-this
  renderProgressBar(percentage, label) {
    const value = Number.isFinite(percentage) ? percentage : 0;
    const pct = Math.max(0, Math.min(100, value));

    return html`
      <div
        class="partnership-progress-bar-wrapper"
        role="progressbar"
        aria-label=${label}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${pct}
      >
        <div class="partnership-progress-track-bar">
          <div class="partnership-progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }

  renderMetricRow(label, metric, helperText = '') {
    if (metric === null || metric === undefined) return html``;

    const value = typeof metric === 'number'
      ? Math.max(0, Math.min(metric, 100))
      : typeof metric.percentage === 'number'
        ? Math.max(0, Math.min(metric.percentage, 100))
        : 0;

    return html`
      <div class="partnership-progress-metric-row">
        <div class="partnership-progress-metric-label">${label}</div>
        <div class="partnership-progress-metric-bar">
          <div class="partnership-progress-metric-bar-inner">
            ${this.renderProgressBar(value, label)}
          </div>
          ${helperText
            ? html`<span class="partnership-progress-metric-helper-text" style="white-space: nowrap; flex: 0 0 auto;">${helperText}</span>`
            : html``}
        </div>
      </div>
    `;
  }

  renderProgramProgress(title, programType) {
    const programData = this.getProgramData(programType.toLowerCase());
    if (!programData) return html``;

    const getRequiredHelperText = (metric) => {
      const total = Number(metric?.total);
      const required = Number(metric?.required);
      if (!Number.isFinite(total) || !Number.isFinite(required)) return '';
      return `${total} of ${required} required`;
    };

    const requiredLevelLabel = (programData.level || '').toUpperCase();
    const isTechnology = programType.toLowerCase() === DX_PRIMARY_BUSINESS.TECHNOLOGY.toLowerCase();

    const specializationsMetric = programData.specializations || programData.solutions;
    const credentialsMetric = programData.credentials;
    const deploymentsMetric = programData.customerDeployments;
    const appAssuredMetric = programData.appAssurances ?? { total: 0, required: 0, percentage: 0 };
    const appAssuredLabel = this.blockData.localizedText['{{App Assured}}'] || 'App Assured';
    const specializationsHelperText = getRequiredHelperText(specializationsMetric);
    const credentialsHelperText = getRequiredHelperText(credentialsMetric);
    const deploymentsHelperText = getRequiredHelperText(deploymentsMetric);
    const appAssuredHelperText = getRequiredHelperText(appAssuredMetric);

    return html`
      <section class="partnership-progress-track">
        <div class="partnership-progress-track-title-wrapper">
          <div class="partnership-progress-track-title">${title}</div>
        </div>

        <div class="partnership-progress-header-row">
          <span>${this.blockData.localizedText['{{Requirements}}']}</span>
          <span>${requiredLevelLabel}</span>
        </div>

        <div class="partnership-progress-rows">
          ${this.renderMetricRow(
    specializationsMetric && programData.specializations
      ? this.blockData.localizedText['{{Specializations}}']
      : this.blockData.localizedText['{{Exchange Marketplace listings}}'],
    specializationsMetric,
    specializationsHelperText,
  )}
          ${this.renderMetricRow(this.blockData.localizedText['{{Credentials}}'], credentialsMetric, credentialsHelperText)}
          ${this.renderMetricRow(this.blockData.localizedText['{{Active Customer Deployments}}'], deploymentsMetric, deploymentsHelperText)}
          ${isTechnology ? this.renderMetricRow(appAssuredLabel, appAssuredMetric, appAssuredHelperText) : html``}
        </div>
      </section>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="progress-circle-wrapper">
        <sp-theme theme="spectrum" color="light" scale="medium">
          <sp-progress-circle label="Cards loading" indeterminate="" size="l" role="progressbar"></sp-progress-circle>
        </sp-theme>
      </div>`;
    }

    if (!this.data) {
      return html``;
    }

    return html`
      <div class="partnership-progress-container">
        ${this.renderProgramProgress(this.blockData.localizedText['{{Solution}}'], DX_PRIMARY_BUSINESS.SOLUTION)}
        ${this.renderProgramProgress(this.blockData.localizedText['{{Technology}}'], DX_PRIMARY_BUSINESS.TECHNOLOGY)}
      </div>
    `;
  }
}
