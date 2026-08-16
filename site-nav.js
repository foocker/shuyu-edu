(function () {
  'use strict';

  // Add future bilingual subjects here. The page menu keeps the active language.
  const pages = [
    {
      id: 'geometry',
      labels: { en: 'Geometry', zh: '几何原本' },
      files: { en: 'index.html', zh: 'index-zh.html' }
    },
    {
      id: 'syllogistic',
      labels: { en: 'Ars Syllogistica', zh: '三段论艺术' },
      files: { en: 'ars-syllogistica.html', zh: 'ars-syllogistica-zh.html' }
    }
  ];

  function currentFile() {
    const file = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
    return file || 'index.html';
  }

  function buildUrl(file, keepLocation) {
    const suffix = keepLocation ? window.location.search + window.location.hash : '';
    return encodeURI(file) + suffix;
  }

  function init() {
    const file = currentFile();
    const language = /-zh\.html$/i.test(file) ? 'zh' : 'en';
    const currentPage = pages.find((page) => Object.values(page.files).includes(file)) || pages[0];
    const nav = document.createElement('div');
    nav.className = 'site-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', language === 'zh' ? '站点导航' : 'Site navigation');
    nav.setAttribute('translate', 'no');

    const brand = document.createElement('span');
    brand.className = 'site-nav__brand';
    brand.textContent = 'Shuyu Edu';

    const pageWrap = document.createElement('label');
    pageWrap.className = 'site-nav__page';
    const pageLabel = document.createElement('span');
    pageLabel.className = 'site-nav__sr-only';
    pageLabel.textContent = language === 'zh' ? '选择页面' : 'Choose page';

    const select = document.createElement('select');
    select.className = 'site-nav__select';
    select.setAttribute('aria-label', pageLabel.textContent);
    pages.forEach((page) => {
      const option = document.createElement('option');
      option.value = page.id;
      option.textContent = page.labels[language];
      option.selected = page.id === currentPage.id;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      const target = pages.find((page) => page.id === select.value);
      if (target) window.location.assign(buildUrl(target.files[language], false));
    });
    pageWrap.append(pageLabel, select);

    const spacer = document.createElement('span');
    spacer.className = 'site-nav__spacer';

    const languages = document.createElement('div');
    languages.className = 'site-nav__languages';
    languages.setAttribute('role', 'group');
    languages.setAttribute('aria-label', language === 'zh' ? '切换语言' : 'Switch language');

    const languageOptions = [
      { id: 'en', label: 'EN', title: 'English' },
      { id: 'zh', label: '中文', title: '中文' }
    ];
    languageOptions.forEach((item) => {
      const link = document.createElement('a');
      link.className = 'site-nav__language';
      link.href = buildUrl(currentPage.files[item.id], true);
      link.textContent = item.label;
      link.title = item.title;
      link.hreflang = item.id === 'zh' ? 'zh-CN' : 'en';
      if (item.id === language) link.setAttribute('aria-current', 'page');
      languages.appendChild(link);
    });

    nav.append(brand, pageWrap, spacer, languages);
    document.body.prepend(nav);
    document.body.classList.add('site-nav-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
