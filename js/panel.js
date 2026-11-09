'use strict';

/* Öğretmen ve öğrenci panellerinin ortak iskeleti (kenar menü, başlık, olay yönetimi) */
const PanelBase = {
  page: 'home',

  mount(page) {
    if (!this.PAGES.some(p => p.id === page)) page = 'home';
    const changed = this.page !== page || App.mounted !== this.role;
    this.page = page;
    if (App.mounted !== this.role) {
      this.buildShell();
      App.mounted = this.role;
    }
    this.renderNav();
    this.renderPage();
    if (changed) window.scrollTo(0, 0);
  },

  buildShell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="shell ${this.theme}">
        <aside class="sidebar">
          <div class="brand">
            <span class="brand-logo" aria-hidden="true">${this.logo}</span>
            <div class="brand-text"><strong>${this.brandTitle}</strong><small id="brand-sub"></small></div>
            <button class="icon-btn only-mobile" data-act="logout" aria-label="Çıkış yap" title="Çıkış yap">⏻</button>
          </div>
          <nav class="nav" id="nav" aria-label="Ana menü"></nav>
          <div class="side-foot"><button class="nav-item" data-act="logout"><span class="nav-ico" aria-hidden="true">🚪</span><span>Çıkış Yap</span></button></div>
        </aside>
        <main class="main">
          <header class="topbar">
            <div class="topbar-text"><h1 id="page-title"></h1><p id="page-sub" class="muted"></p></div>
            <div id="page-actions" class="top-actions"></div>
          </header>
          <div id="page" class="content"></div>
        </main>
      </div>`;
    this.bind(app.firstElementChild);
  },

  renderNav() {
    document.getElementById('brand-sub').textContent = this.brandSub();
    const nav = document.getElementById('nav');
    nav.innerHTML = this.PAGES.map(p => `
      <button class="nav-item ${p.id === this.page ? 'active' : ''}" data-act="go" data-page="${p.id}" ${p.id === this.page ? 'aria-current="page"' : ''}>
        <span class="nav-ico" aria-hidden="true">${p.icon}</span><span>${p.label}</span>
      </button>`).join('');
    const active = nav.querySelector('.active');
    if (active && nav.scrollWidth > nav.clientWidth) active.scrollIntoView({ inline: 'center', block: 'nearest' });
  },

  renderPage() {
    const v = this.views[this.page].call(this);
    document.getElementById('page-title').textContent = v.title;
    document.getElementById('page-sub').textContent = v.sub || '';
    document.getElementById('page-actions').innerHTML = v.actions || '';
    document.getElementById('page').innerHTML = v.html;
    const label = this.PAGES.find(p => p.id === this.page).label;
    document.title = `${label} · ${this.brandTitle}`;
    if (v.after) v.after.call(this);
  },

  go(page) { App.go(`#/${this.role === 'teacher' ? 't' : 's'}/${page}`); },

  bind(shell) {
    const run = (map, key, el, e) => { const fn = map && map[key]; if (fn) fn.call(this, el, e); };
    shell.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (!el || !shell.contains(el)) return;
      const act = el.dataset.act;
      if (act === 'go') return this.go(el.dataset.page);
      if (act === 'logout') return App.logout();
      run(this.act, act, el, e);
    });
    shell.addEventListener('change', e => {
      const el = e.target.closest('[data-change]');
      if (el) run(this.onChange, el.dataset.change, el, e);
    });
    shell.addEventListener('input', e => {
      const el = e.target.closest('[data-input]');
      if (el) run(this.onInput, el.dataset.input, el, e);
    });
    shell.addEventListener('submit', e => {
      const f = e.target.closest('form[data-submit]');
      if (!f) return;
      e.preventDefault();
      const fn = this.onSubmit && this.onSubmit[f.dataset.submit];
      if (fn) fn.call(this, U.formData(f), f, e);
    });
  },
};
