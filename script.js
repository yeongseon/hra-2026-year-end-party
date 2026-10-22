'use strict';

// 행사 정보가 확정되면 이 값만 수정하세요. 세부 프로그램은 별도 기획 이후 추가합니다.
const EVENT = Object.freeze({
  title: 'HRA 2026 Year-End Party',
  date: '추후 안내',
  location: '추후 안내',
  dressCode: '추후 안내',
});

for (const element of document.querySelectorAll('[data-event]')) {
  element.textContent = EVENT[element.dataset.event];
}

const dialog = document.querySelector('#invitation');
const openButton = document.querySelector('#open-invitation');
const closeButton = document.querySelector('#close-invitation');
const status = document.querySelector('#status');
const manualCopy = document.querySelector('#manual-copy');
let openingTimer;
let previousOverflow = '';

openButton.addEventListener('click', () => {
  if (dialog.open || openButton.classList.contains('opening')) return;
  openButton.classList.add('opening');
  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
  openingTimer = window.setTimeout(() => {
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.scrollTop = 0;
    closeButton.focus({ preventScroll: true });
    openButton.classList.remove('opening');
  }, delay);
});

closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  window.clearTimeout(openingTimer);
  document.body.style.overflow = previousOverflow;
  status.textContent = '';
  manualCopy.hidden = true;
  openButton.focus({ preventScroll: true });
});

// Native dialog makes the background inert; explicitly wrap focus at both ends.
dialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button, input')].filter((item) => item.getClientRects().length);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function invitationURL() {
  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  return url.href;
}

async function copyURL() {
  manualCopy.hidden = true;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(invitationURL());
    status.textContent = '초대장 URL을 복사했습니다.';
  } catch {
    manualCopy.hidden = false;
    const input = document.querySelector('#invitation-url');
    input.value = invitationURL();
    input.focus();
    input.select();
    status.textContent = '자동 복사를 사용할 수 없습니다. 주소를 직접 복사해주세요.';
  }
}

document.querySelector('#copy-url').addEventListener('click', copyURL);
document.querySelector('#share-invitation').addEventListener('click', async () => {
  if (!navigator.share) {
    await copyURL();
    return;
  }
  try {
    await navigator.share({ title: EVENT.title, text: "You're Invited to a Magical Night.", url: invitationURL() });
    status.textContent = '초대장을 공유했습니다.';
  } catch (error) {
    if (error.name === 'AbortError') {
      status.textContent = '공유를 취소했습니다.';
      return;
    }
    await copyURL();
  }
});
