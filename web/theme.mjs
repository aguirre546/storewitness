/** Appearance and release notes. Only explicit display choices are stored. */
const APPEARANCE_KEY = 'storewitness-appearance-v1';
const RELEASE_KEY = 'storewitness-release-dismissed-v1';
const RELEASE = '2026-11-23-clarity';
const modes = ['system', 'light', 'dark'];
const root = document.documentElement;
const media = window.matchMedia?.('(prefers-color-scheme: dark)');
function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key, value) { try { localStorage.setItem(key, value); } catch { /* Session still works. */ } }
let choice = modes.includes(read(APPEARANCE_KEY)) ? read(APPEARANCE_KEY) : 'system';

function applyAppearance() {
  const theme = choice === 'system' ? (media?.matches ? 'dark' : 'light') : choice;
  root.dataset.theme = theme;
  root.dataset.appearance = choice;
  root.style.colorScheme = theme;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.append(meta); }
  meta.content = theme === 'dark' ? '#101318' : '#fafafa';
}
applyAppearance();
media?.addEventListener?.('change', () => { if (choice === 'system') applyAppearance(); });

const header = document.querySelector('body > header');
const tools = document.createElement('div');
tools.className = 'appearance-tools';
const appearanceLabel = document.createElement('label');
appearanceLabel.className = 'appearance-label';
appearanceLabel.htmlFor = 'site-appearance';
appearanceLabel.textContent = 'Appearance';
const select = document.createElement('select');
select.id = 'site-appearance';
select.setAttribute('aria-label', 'Appearance');
for (const [value, text] of [['system', 'System theme'], ['light', 'Light theme'], ['dark', 'Dark theme']]) {
  const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option);
}
select.value = choice;
select.addEventListener('change', () => { choice = select.value; applyAppearance(); write(APPEARANCE_KEY, choice); });
const newsButton = document.createElement('button');
newsButton.type = 'button';
newsButton.className = 'release-open';
newsButton.textContent = 'What’s new';
newsButton.setAttribute('aria-haspopup', 'dialog');
newsButton.setAttribute('aria-controls', 'site-release-dialog');
tools.append(appearanceLabel, select, newsButton);
if (header) header.append(tools); else document.body.prepend(tools);

const banner = document.createElement('aside');
banner.className = 'release-banner';
banner.setAttribute('aria-label', 'StoreWitness update');
const bannerText = document.createElement('p');
const bannerTitle = document.createElement('strong'); bannerTitle.textContent = 'Updated scanner. Light and dark themes.';
const bannerCopy = document.createElement('span'); bannerCopy.textContent = 'Explore the updated sign scanner and new appearance settings.';
bannerText.append(bannerTitle, bannerCopy);
const bannerOpen = document.createElement('button'); bannerOpen.type = 'button'; bannerOpen.className = 'release-details'; bannerOpen.textContent = 'See what changed';
const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.className = 'release-dismiss'; dismiss.textContent = '×'; dismiss.setAttribute('aria-label', 'Dismiss update announcement');
banner.append(bannerText, bannerOpen, dismiss);
banner.hidden = read(RELEASE_KEY) === RELEASE;
if (header) header.after(banner); else tools.after(banner);
function dismissBanner() { banner.hidden = true; write(RELEASE_KEY, RELEASE); }
dismiss.addEventListener('click', () => { dismissBanner(); newsButton.focus(); });

const dialog = document.createElement('dialog');
dialog.id = 'site-release-dialog';
dialog.className = 'release-dialog';
dialog.setAttribute('aria-labelledby', 'site-release-title');
dialog.setAttribute('aria-describedby', 'site-release-intro');
// Static trusted copy. No server content or camera information enters this panel.
dialog.innerHTML = `<div class="release-dialog-top"><p class="release-kicker">STOREWITNESS / PRODUCT UPDATE</p><button type="button" class="release-close" aria-label="Close what’s new">×</button></div>
  <p class="release-date">23 November 2026</p><h2 id="site-release-title">Made for clearer checks.</h2>
  <p id="site-release-intro">Updates to help you read the evidence and keep the store’s status useful.</p>
  <ul class="release-list">
    <li><span aria-hidden="true">01</span><div><h3>More control over sign scanning</h3><p>Keep more camera detail, position a target sign area, adjust camera zoom where supported, and review image-quality tips. OPEN, CLOSE and CLOSED are supported; unreadable text stays uncertain.</p></div></li>
    <li><span aria-hidden="true">02</span><div><h3>A comfortable view in any light</h3><p>Choose Light, Dark or System theme. The same setting follows you across StoreWitness pages on this device.</p></div></li>
    <li><span aria-hidden="true">03</span><div><h3>More context for a closure</h3><p>Owners can choose to share a recent outside and inside snapshot for the current closure. Photos have visible capture times and expire after 15 minutes.</p></div></li>
    <li><span aria-hidden="true">04</span><div><h3>Taglish trip alerts</h3><p>The optional voice follows the alarm. Supported phones can vibrate during the alarm and stop vibrating when the voice starts.</p></div></li>
  </ul>
  <p class="release-limit"><strong>A clear sign still matters.</strong> A 10-metre reading range needs a real camera test. Sign size, lens, focus and lighting affect the result. Darkness or an empty view alone does not mean closed.</p>
  <div class="release-dialog-actions"><button type="button" class="release-done">Got it</button><a href="/inspect">Open Camera evidence ↗</a></div>`;
document.body.append(dialog);
let returnFocus = null;
function openNews(event) {
  returnFocus = event?.currentTarget ?? document.activeElement;
  if (dialog.open) return;
  dialog.showModal();
  dialog.querySelector('.release-close').focus();
}
function closeNews() { dialog.close(); }
newsButton.addEventListener('click', openNews);
bannerOpen.addEventListener('click', openNews);
dialog.querySelector('.release-close').addEventListener('click', closeNews);
dialog.querySelector('.release-done').addEventListener('click', () => { dismissBanner(); closeNews(); });
dialog.addEventListener('close', () => {
  const target = returnFocus?.isConnected && !returnFocus.closest('[hidden]') ? returnFocus : newsButton;
  target.focus();
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeNews();
});
window.addEventListener('storage', event => {
  if (event.key === APPEARANCE_KEY || event.key === null) {
    const saved = read(APPEARANCE_KEY); choice = modes.includes(saved) ? saved : 'system'; select.value = choice; applyAppearance();
  }
  if (event.key === RELEASE_KEY || event.key === null) banner.hidden = read(RELEASE_KEY) === RELEASE;
});
