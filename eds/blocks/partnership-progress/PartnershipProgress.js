import {getLibs, getPartnerDataCookieValue} from '../../scripts/utils.js';
import { partnershipProgressStyles } from './PartnershipProgressStyles.js';
import { getConfig } from '../utils/utils.js';
import {DX_PARTNER_LEVEL, DX_PRIMARY_BUSINESS} from "../utils/dxConstants.js";

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);
import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`);
import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`);

const LEVEL_ORDER = [
    DX_PARTNER_LEVEL.SILVER.toLowerCase(),
    DX_PARTNER_LEVEL.GOLD.toLowerCase(),
    DX_PARTNER_LEVEL.PLATINUM.toLowerCase(),
];
const PARTNERSHIP_PROGRESS_API =
    'https://partner-registration-stage.adobe.io/api/v1/dxp/partner/membership/level-requirements';

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
    this._onImsReady = this._onImsReady.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('dxp:imsReady', this._onImsReady);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('dxp:imsReady', this._onImsReady);
  }

  _onImsReady() {
    this.fetchData();
  }

  async fetchData() {
    let url = PARTNERSHIP_PROGRESS_API;
    const { env } = getConfig();
    if (env.name === 'prod') {
      url = url.replace('-stage', '');
    }

    this.loading = true;

    try {
      const token = window.adobeIMS?.getAccessToken?.().token;
      if (!token) {
        throw new Error('Missing IMS access token');
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Api-Key': token,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load data: ${res.status}`);
      }

      const json = await res.json();
      this.data = json;
    } catch (e) {
      console.error('[partnership-progress] fetch error', e);
    } finally {
      this.loading = false;
    }
  }

  getProgramData(programType) {
    if (!this.data) return null;

    const currentLevel = getPartnerDataCookieValue('level');
    const targetLevelKey = getTargetLevel(currentLevel).toLowerCase();

    const items = this.data[programType] || [];
    return items.find((item) => item.level?.toLowerCase() === targetLevelKey) || null;
  }

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

  renderMetricRow(label, metric) {
    if (!metric) return html``;

    const value =
        typeof metric.percentage === 'number'
            ? Math.max(0, Math.min(metric.percentage, 100))
            : 0;

    return html`
      <div class="partnership-progress-metric-row">
        <div class="partnership-progress-metric-label">${label}</div>
        <div class="partnership-progress-metric-bar">
          ${this.renderProgressBar(value, label)}
        </div>
      </div>
    `;
  }

  renderProgramProgress(title, programType) {
    const programData = this.getProgramData(programType.toLowerCase());
    if (!programData) return html``;

    const requiredLevelLabel = (programData.level || '').toUpperCase();

    const specializationsMetric = programData.specializations || programData.solutions;
    const credentialsMetric = programData.credentials;
    const deploymentsMetric = programData.customerDeployments;

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
    )}
          ${this.renderMetricRow(this.blockData.localizedText['{{Credentials}}'], credentialsMetric)}
          ${this.renderMetricRow(this.blockData.localizedText['{{Active Customer Deployments}}'], deploymentsMetric)}
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
        ${this.renderProgramProgress(this.blockData.localizedText[`{{Solution}}`], DX_PRIMARY_BUSINESS.SOLUTION)}
        ${this.renderProgramProgress(this.blockData.localizedText[`{{Technology}}`], DX_PRIMARY_BUSINESS.TECHNOLOGY)}
      </div>
    `;
  }
}
