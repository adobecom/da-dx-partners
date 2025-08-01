import { toFragment, trigger, closeAllDropdowns, logErrorFor } from '../../utilities/utilities.js';

// MWPW-157751
import { getLibs } from '../../../../scripts/utils.js';

const miloLibs = getLibs();
const { replaceKeyArray } = await import(`${miloLibs}/features/placeholders.js`);

const { getConfig, getFedsPlaceholderConfig } = await import(`${miloLibs}/utils/utils.js`);

const getLanguage = (ietfLocale) => {
  if (!ietfLocale.length) return 'en';

  const nonStandardLocaleMap = { 'no-NO': 'nb' };

  if (nonStandardLocaleMap[ietfLocale]) {
    return nonStandardLocaleMap[ietfLocale];
  }

  return ietfLocale.split('-')[0];
};

const decorateProfileLink = (service, path = '') => {
  const defaultServiceUrls = {
    adminconsole: 'https://adminconsole.adobe.com',
    account: 'https://account.adobe.com',
  };

  if (!service.length || !defaultServiceUrls[service]) return '';

  let serviceUrl;
  const { env } = getConfig();

  if (!env?.[service]) {
    serviceUrl = defaultServiceUrls[service];
  } else {
    serviceUrl = new URL(defaultServiceUrls[service]);
    serviceUrl.hostname = env[service];
  }

  return `${serviceUrl}${path}`;
};

const decorateAction = (label, path) => toFragment`<li><a class="feds-profile-action" href="${decorateProfileLink('adminconsole', path)}">${label}</a></li>`;

class ProfileDropdown {
  constructor({
    rawElem,
    decoratedElem,
    avatar,
    sections,
    buttonElem,
    openOnInit,
  } = {}) {
    this.placeholders = {};
    this.profileData = {};
    this.avatar = avatar;
    this.buttonElem = buttonElem;
    this.decoratedElem = decoratedElem;
    this.sections = sections;
    this.openOnInit = openOnInit;
    this.localMenu = rawElem.querySelector('h5')?.parentElement;
    logErrorFor(this.init.bind(this), 'ProfileDropdown.init()', 'gnav-profile', 'error');
  }

  async init() {
    await this.getData();
    this.setButtonLabel();
    this.dropdown = this.decorateDropdown();
    this.addEventListeners();

    if (this.openOnInit) trigger({ element: this.buttonElem, type: 'profile' }); // MWPW-157752

    this.decoratedElem.append(this.dropdown);
  }

  async getData() {
    [
      [
        this.placeholders.profileButton,
        this.placeholders.signOut,
        this.placeholders.viewAccount,
        this.placeholders.manageTeams,
        this.placeholders.manageEnterprise,
        this.placeholders.profileAvatar,
      ],
      [
        this.placeholders.editProfile, // MWPW-157751
      ],
      { displayName: this.profileData.displayName, email: this.profileData.email },
    ] = await Promise.all([
      replaceKeyArray(
        ['profile-button', 'sign-out', 'view-account', 'manage-teams', 'manage-enterprise', 'profile-avatar'],
        getFedsPlaceholderConfig(),
      ),
      // MWPW-157751
      replaceKeyArray(
        ['edit-profile'],
        getConfig(),
      ),
      // End
      window.adobeIMS.getProfile(),
    ]);
  }

  setButtonLabel() {
    if (this.buttonElem) this.buttonElem.setAttribute('aria-label', this.profileData.displayName);
  }

  decorateDropdown() {
    // MWPW-157751
    const { locale } = getConfig();
    const lang = getLanguage(locale.ietf);
    // End

    // TODO: the account name and email might need a bit of adaptive behavior;
    // historically we shrunk the font size and displayed the account name on two lines;
    // the email had some special logic as well;
    // for MVP, we took a simpler approach ("Some very long name, very l...")
    this.avatarElem = toFragment`<img
      data-cs-mask
      class="feds-profile-img"
      src="${this.avatar}"
      tabindex="0"
      alt="${this.placeholders.profileAvatar}"
      data-url="${decorateProfileLink('account', `?lang=${lang}`)}"></img>`;
    // MWPW-157753 - only Edit user profile link should be clickable
    return toFragment`
      <div id="feds-profile-menu" class="feds-profile-menu">
        <div class="feds-profile-header">
          ${this.avatarElem}
          <div class="feds-profile-details">
            <p data-cs-mask class="feds-profile-name">${this.profileData.displayName}</p>
            <p data-cs-mask class="feds-profile-email">${this.decorateEmail(this.profileData.email)}</p>
          </div>
        </div>
        ${this.localMenu ? this.decorateLocalMenu() : ''}
        <ul class="feds-profile-actions">
          ${this.sections?.manage?.items?.team?.id ? decorateAction(this.placeholders.manageTeams, '/team') : ''}
          ${this.sections?.manage?.items?.enterprise?.id ? decorateAction(this.placeholders.manageEnterprise) : ''}
          ${this.decorateSignOut()}
        </ul>
      </div>
    `;
  }

  decorateEmail() {
    const maxCharacters = 12;
    const emailParts = this.profileData.email.split('@');
    const username = emailParts[0].length <= maxCharacters
      ? emailParts[0]
      : `${emailParts[0].slice(0, maxCharacters)}…`;
    const domainArr = emailParts[1].split('.');
    const tld = domainArr.pop();
    let domain = domainArr.join('.');
    domain = domain.length <= maxCharacters
      ? domain
      : `${domain.slice(0, maxCharacters)}…`;

    return `${username}@${domain}.${tld}`;
  }

  decorateLocalMenu() {
    if (this.localMenu) this.localMenu.classList.add('feds-local-menu');

    return this.localMenu;
  }

  decorateSignOut() {
    const signOutLink = toFragment`
      <li>
        <a href="#" class="feds-profile-action" daa-ll="${this.placeholders.signOut}">${this.placeholders.signOut}</a>
      </li>
    `;

    signOutLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new Event('feds:signOut'));
      window.adobeIMS.signOut();
    });

    return signOutLink;
  }

  addEventListeners() {
    this.buttonElem.addEventListener('click', (e) => trigger({ element: this.buttonElem, event: e, type: 'profile' })); // MWPW-157752
    this.buttonElem.addEventListener('keydown', (e) => e.code === 'Escape' && closeAllDropdowns());
    this.dropdown.addEventListener('keydown', (e) => e.code === 'Escape' && closeAllDropdowns());
    this.avatarElem.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.assign(this.avatarElem.dataset?.url);
    });
  }
}

export default ProfileDropdown;
