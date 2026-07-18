const dialog = document.querySelector('#command-dialog');
const triggers = [...document.querySelectorAll('[data-search-trigger]')];
const input = document.querySelector('#command-input');
const results = document.querySelector('#command-results');
const status = document.querySelector('#command-status');
const empty = document.querySelector('#command-empty');
const navLinks = [...document.querySelectorAll('[data-section-nav]')];
const sections = ['top', 'about', 'work', 'method', 'participate']
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const entries = [
  { title: 'ziwei', detail: '标准驱动紫微斗数排盘引擎', keys: '紫微 斗数 排盘', url: 'https://github.com/matharts/ziwei' },
  { title: 'epheon', detail: '标准驱动天文历法引擎', keys: '天文 历法', url: 'https://github.com/matharts/epheon' },
  { title: 'matharts', detail: '生态基础设施与核心标准库', keys: '基础设施 核心 标准', url: 'https://github.com/matharts/matharts' },
  { title: 'skills', detail: '可复用 Agent Skills 与能力模块', keys: 'Agent AI 技能 能力', url: 'https://github.com/matharts/skills' },
  { title: 'sync-labels', detail: '组织级 GitHub 标签同步', keys: '标签 GitHub Action 治理', url: 'https://github.com/matharts/sync-labels-action' },
  { title: '.github', detail: '组织治理、社区文件与贡献入口', keys: '社区 治理 贡献 自动化', url: 'https://github.com/matharts/.github' },
  { title: '了解组织', detail: '中国数术数字基础设施', keys: '定位 组织 介绍 数术', url: '#about' },
  { title: '公开成果', detail: '浏览六项公开工作', keys: '仓库 项目 开源', url: '#work' },
  { title: '组织治理', detail: '公开优先、证据优先、职责明确', keys: '公开 证据 权限 职责 治理', url: '#method' },
  { title: '贡献方式', detail: '参与 MathArts 开源协作', keys: '贡献 开发 讨论', url: 'https://github.com/matharts/.github/blob/main/CONTRIBUTING.md' }
];

let visible = entries;
let activeIndex = 0;
let restoreTarget = null;
let scrollTicking = false;

function syncSelection() {
  const items = [...results.children];
  items.forEach((item, index) => {
    const selected = index === activeIndex;
    item.dataset.active = String(selected);
    item.setAttribute('aria-selected', String(selected));
  });

  const activeItem = items[activeIndex];
  if (activeItem) {
    input.setAttribute('aria-activedescendant', activeItem.id);
    activeItem.scrollIntoView({ block: 'nearest' });
  } else {
    input.removeAttribute('aria-activedescendant');
  }
}

function render(query = '') {
  const needle = query.trim().toLocaleLowerCase('zh-CN');
  visible = entries.filter((entry) => `${entry.title} ${entry.detail} ${entry.keys}`.toLocaleLowerCase('zh-CN').includes(needle));
  activeIndex = 0;
  results.replaceChildren();

  visible.forEach((entry, index) => {
    const link = document.createElement('a');
    link.className = 'command__item';
    link.id = `command-option-${entries.indexOf(entry)}`;
    link.href = entry.url;
    link.setAttribute('role', 'option');
    if (entry.url.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }

    const title = document.createElement('strong');
    title.textContent = entry.title;
    const detail = document.createElement('small');
    detail.textContent = entry.detail;
    link.append(title, detail);
    link.addEventListener('pointerenter', () => {
      activeIndex = index;
      syncSelection();
    });
    link.addEventListener('click', () => dialog.close());
    results.append(link);
  });

  results.hidden = visible.length === 0;
  empty.hidden = visible.length !== 0;
  status.textContent = needle
    ? (visible.length ? `${visible.length} 项匹配` : '零项匹配')
    : '六个项目 · 四个页面入口';
  syncSelection();
}

function openDialog(event) {
  const trigger = event?.currentTarget;
  const parentMenu = trigger?.closest('details');
  restoreTarget = parentMenu?.querySelector('summary') || trigger || document.activeElement;
  parentMenu?.removeAttribute('open');

  if (!dialog.open) dialog.showModal();
  input.setAttribute('aria-expanded', 'true');
  document.querySelectorAll('.page-shell, .rail, .mobile-head').forEach((element) => { element.inert = true; });
  render(input.value);
  requestAnimationFrame(() => input.focus({ preventScroll: true }));
}

function setCurrentSection(id) {
  navLinks.forEach((link) => {
    if (link.getAttribute('href') === `#${id}`) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function updateCurrentSection() {
  const marker = window.scrollY + window.innerHeight * 0.35;
  let current = sections[0];
  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section;
  });
  if (current) setCurrentSection(current.id);
  scrollTicking = false;
}

function requestSectionUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateCurrentSection);
}

triggers.forEach((trigger) => trigger.addEventListener('click', openDialog));
input.addEventListener('input', () => render(input.value));
window.addEventListener('scroll', requestSectionUpdate, { passive: true });
window.addEventListener('resize', requestSectionUpdate);

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const id = link.getAttribute('href').slice(1);
    setCurrentSection(id);
  });
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
    event.preventDefault();
    dialog.open ? dialog.close() : openDialog();
    return;
  }
  if (!dialog.open || visible.length === 0) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeIndex = (activeIndex + 1) % visible.length;
    syncSelection();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeIndex = (activeIndex - 1 + visible.length) % visible.length;
    syncSelection();
  } else if (event.key === 'Enter' && document.activeElement === input) {
    event.preventDefault();
    results.children[activeIndex]?.click();
  }
});

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

dialog.addEventListener('close', () => {
  input.setAttribute('aria-expanded', 'false');
  document.querySelectorAll('.page-shell, .rail, .mobile-head').forEach((element) => { element.inert = false; });
  input.value = '';
  render();
  if (restoreTarget?.isConnected) restoreTarget.focus({ preventScroll: true });
});

document.querySelectorAll('.mobile-head__menu a').forEach((link) => {
  link.addEventListener('click', () => link.closest('details')?.removeAttribute('open'));
});

render();
updateCurrentSection();
