export default function showToast(variant, success, onTryAgain, config) {
  const existingToast = document.querySelector(`.${variant}-toast`);
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = success
    ? `spectrum-Toast spectrum-Toast--positive ${variant}-toast common-toast`
    : `spectrum-Toast spectrum-Toast--negative ${variant}-toast common-toast`;

  const iconWrapper = document.createElement('span');
  iconWrapper.className = `${variant}-toast-icon common-toast-icon ${variant}-toast-icon-left common-toast-icon-left`;

  const iconImg = document.createElement('img');
  iconImg.src = success ? '/eds/img/icons/checkmark.svg' : '/eds/img/icons/alert.svg';
  iconWrapper.appendChild(iconImg);

  const body = document.createElement('div');
  body.className = 'spectrum-Toast-body';

  const content = document.createElement('div');
  content.className = 'spectrum-Toast-content';

  const message = document.createElement('span');
  message.textContent = success ? config.toastPositive : config.toastNegative;
  content.appendChild(message);

  if (!success) {
    const tryAgainBtn = document.createElement('button');
    tryAgainBtn.type = 'button';
    tryAgainBtn.className = `${variant}-try-again-cta common-try-again-cta ${variant}-toast-cta common-toast-cta`;
    tryAgainBtn.textContent = config.tryAgain;
    tryAgainBtn.addEventListener('click', onTryAgain);
    content.appendChild(tryAgainBtn);
  }

  body.appendChild(content);

  const buttons = document.createElement('div');
  buttons.className = 'spectrum-Toast-buttons';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = `${variant}-toast-icon common-toast-icon ${variant}-toast-cta common-toast-cta ${variant}-toast-icon-close common-toast-icon-close`;
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('click', () => toast.remove());

  buttons.appendChild(closeBtn);

  toast.appendChild(iconWrapper);
  toast.appendChild(body);
  toast.appendChild(buttons);

  document.body.appendChild(toast);

  const toastShowClasses = [`${variant}-toast-show`, 'common-toast-show'];

  setTimeout(() => {
    toast.classList.add(...toastShowClasses);
  }, 10);

  if (success) {
    setTimeout(() => {
      toast.classList.remove(...toastShowClasses);
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}
