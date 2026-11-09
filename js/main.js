'use strict';

const Session = {
  KEY: 'ogretmenHesap.session',
  get() {
    for (const st of [sessionStorage, localStorage]) {
      try { const v = JSON.parse(st.getItem(this.KEY) || 'null'); if (v) return v; } catch (e) { /* yok say */ }
    }
    return null;
  },
  set(v, remember) {
    try { (remember ? localStorage : sessionStorage).setItem(this.KEY, JSON.stringify(v)); } catch (e) { /* yok say */ }
  },
  clear() {
    try { sessionStorage.removeItem(this.KEY); localStorage.removeItem(this.KEY); } catch (e) { /* yok say */ }
  },
};

/* ============================== GİRİŞ EKRANI ============================== */
const Login = {
  tab: null,
  pub: null,

  subtitle() {
    const t = Store.hasTeacher() ? Store.data.teacher : (this.pub && this.pub.teacher);
    if (t && t.name) return U.esc([t.name, t.branch && t.branch + ' Öğretmeni', t.school].filter(Boolean).join(' · '));
    return 'Öğretmen paneli ve öğrenci portalı';
  },

  render() {
    App.mounted = null;
    document.title = 'Giriş · Öğretmen Hesabım';
    if (!this.tab) this.tab = Store.hasTeacher() ? 't' : 's';
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-page ${this.tab === 's' ? 'theme-student' : 'theme-teacher'}">
        <div class="login-card">
          <div class="login-brand">
            <div class="logo" aria-hidden="true">${this.tab === 's' ? '🎒' : '🎓'}</div>
            <h1>Öğretmen Hesabım</h1>
            <p class="muted" id="login-sub">${this.subtitle()}</p>
          </div>
          <div class="seg" role="tablist" aria-label="Giriş türü">
            <button role="tab" type="button" aria-selected="${this.tab === 't'}" class="${this.tab === 't' ? 'active' : ''}" data-tab="t">👩‍🏫 Öğretmen</button>
            <button role="tab" type="button" aria-selected="${this.tab === 's'}" class="${this.tab === 's' ? 'active' : ''}" data-tab="s">🎒 Öğrenci</button>
          </div>
          <div class="login-pane" role="tabpanel">${this.tab === 't' ? this.teacherPane() : this.studentPane()}</div>
        </div>
        <p class="login-foot muted small">${this.tab === 't'
          ? '🔒 Öğretmen verileriniz yalnızca bu cihazdaki tarayıcıda saklanır.'
          : '🔒 Bilgilerin şifrelidir, yalnızca senin şifrenle açılır.'}</p>
      </div>`;
    const page = app.firstElementChild;
    page.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { this.tab = b.dataset.tab; this.render(); }));
    const f = page.querySelector('form');
    f.addEventListener('submit', e => { e.preventDefault(); this['submit_' + f.id](U.formData(f), f); });
    page.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => this[b.dataset.act]()));
    const first = f.querySelector('input');
    if (first && window.matchMedia('(min-width: 700px)').matches) first.focus();
    if (!this.pub) this.loadPub();
  },

  async loadPub() {
    try {
      this.pub = await App.fetchPublished();
      const el = document.getElementById('login-sub');
      if (el) el.innerHTML = this.subtitle();
    } catch (e) { this.pub = { students: {} }; }
  },

  teacherPane() {
    if (!Store.hasTeacher()) {
      return `
        <form id="setup" class="stack">
          <div class="note-box">👋 Bu cihazda henüz öğretmen hesabı yok. Bilgilerinizi girerek hesabınızı oluşturun.</div>
          ${U.field('Ad Soyad', '<input class="input" name="name" required autocomplete="name">')}
          <div class="form-grid">
            ${U.field('Branş', '<input class="input" name="branch" placeholder="Örn. Matematik">')}
            ${U.field('Okul', '<input class="input" name="school">')}
          </div>
          ${U.field('Şifre', '<input class="input" type="password" name="pass" required minlength="4" autocomplete="new-password">', { hint: 'En az 4 karakter. Panelinize bu şifreyle girersiniz.' })}
          ${U.field('Şifre (tekrar)', '<input class="input" type="password" name="pass2" required minlength="4" autocomplete="new-password">')}
          <button class="btn primary block" type="submit">Hesabımı Oluştur</button>
          <p class="center small muted">Başka cihazda yedeğiniz mi var? <button type="button" class="link" data-act="restore">Yedekten geri yükle</button></p>
        </form>`;
    }
    return `
      <form id="tlogin" class="stack">
        <p class="center">Hoş geldiniz, <strong>${U.esc(Store.data.teacher.name)}</strong></p>
        ${U.field('Şifre', '<input class="input" type="password" name="pass" required autocomplete="current-password">')}
        <label class="check"><input type="checkbox" name="remember"> Bu cihazda oturumum açık kalsın</label>
        <button class="btn primary block" type="submit">Giriş Yap</button>
        <p class="center small"><button type="button" class="link" data-act="forgot">Şifremi unuttum</button></p>
      </form>`;
  },

  studentPane() {
    return `
      <form id="slogin" class="stack">
        ${U.field('Okul numaran', '<input class="input" name="no" required inputmode="numeric" autocomplete="username">')}
        ${U.field('Şifren', '<input class="input" type="password" name="pass" required autocomplete="current-password" autocapitalize="off" spellcheck="false">')}
        <button class="btn primary block" type="submit">Giriş Yap</button>
        <p class="center small muted">Şifreni öğretmeninden alabilirsin.</p>
      </form>`;
  },

  busy(form, on, text) {
    const b = form.querySelector('[type=submit]');
    if (on) { b.dataset.label = b.textContent; b.textContent = text; b.disabled = true; }
    else { b.textContent = b.dataset.label || b.textContent; b.disabled = false; }
  },

  async submit_setup(f, form) {
    if (!Sec.available()) return U.toast('Bu tarayıcı güvenli şifrelemeyi desteklemiyor. Siteyi https adresinden açın.', 'error');
    if (f.pass !== f.pass2) return U.toast('Şifreler aynı değil.', 'error');
    this.busy(form, true, 'Oluşturuluyor…');
    const h = await Sec.hashPassword(f.pass);
    Store.data.teacher = { name: f.name, branch: f.branch, school: f.school, passHash: h.hash, passSalt: h.salt, created: new Date().toISOString() };
    if (!Store.save(true)) { this.busy(form, false); return; }
    Session.set({ role: 'teacher' }, false);
    U.toast('Hesabınız oluşturuldu. Hoş geldiniz!');
    App.go('#/t/home');
  },

  async submit_tlogin(f, form) {
    const t = Store.data.teacher;
    this.busy(form, true, 'Kontrol ediliyor…');
    const ok = await Sec.verifyPassword(f.pass, t.passHash, t.passSalt).catch(() => false);
    if (!ok) {
      this.busy(form, false);
      U.toast('Şifre hatalı.', 'error');
      form.querySelector('[name=pass]').select();
      return;
    }
    Session.set({ role: 'teacher' }, f.remember);
    App.go('#/t/home');
  },

  async submit_slogin(f, form) {
    this.busy(form, true, 'Kontrol ediliyor…');
    try {
      const payload = await App.studentLogin(f.no, f.pass);
      Session.set({ role: 'student', payload }, false);
      App.go('#/s/home');
    } catch (e) {
      this.busy(form, false);
      U.toast(e.message, 'error');
    }
  },

  restore() { App.restoreBackup(() => { this.tab = 't'; this.render(); }); },

  forgot() {
    U.modal({
      title: 'Şifremi unuttum',
      body: `<p>Verileriniz sunucuda değil, <strong>bu tarayıcıda</strong> şifreli olarak durduğu için şifre sıfırlama e-postası gönderilemez.</p>
        <ul class="steps"><li>Yedek dosyanız varsa <b>yedekten geri yükleyip</b> o yedeğin şifresiyle girebilirsiniz.</li>
        <li>Yoksa bu cihazdaki verileri silip <b>sıfırdan başlayabilirsiniz</b>.</li></ul>`,
      left: '<button type="button" class="btn danger-ghost" data-reset>Verileri sil, yeniden başla</button><button type="button" class="btn" data-restore>Yedekten yükle</button>',
      onOpen: (box, close) => {
        box.querySelector('[data-restore]').addEventListener('click', () => { close(); this.restore(); });
        box.querySelector('[data-reset]').addEventListener('click', async () => {
          if (!(await U.confirm('Bu cihazdaki tüm öğretmen verileri kalıcı olarak silinecek. Emin misiniz?', 'Evet, sil'))) return;
          try { localStorage.removeItem(Store.KEY); } catch (e) { /* yok say */ }
          Store.load(); close(); this.tab = 't'; this.render(); U.toast('Veriler silindi. Yeni hesap oluşturabilirsiniz.');
        });
      },
    });
  },
};

/* ============================== UYGULAMA ============================== */
const App = {
  mounted: null,

  start() {
    Store.load();
    window.addEventListener('hashchange', () => this.route());
    window.addEventListener('storage', e => { if (e.key === Store.KEY && this.mounted === 'teacher') { Store.load(); Teacher.renderNav(); Teacher.renderPage(); } });
    this.route();
    setInterval(() => {
      const busy = document.querySelector('#modal-root > *') || (document.activeElement && document.activeElement.closest('#page'));
      if (busy) return;
      if (this.mounted === 'teacher' && Teacher.page === 'home') Teacher.renderPage();
      if (this.mounted === 'student' && Student.page === 'home') Student.renderPage();
    }, 60000);
  },

  go(hash) {
    if (location.hash === hash) this.route();
    else location.hash = hash;
  },

  route() {
    const sess = Session.get();
    const [role, page] = location.hash.replace(/^#\/?/, '').split('/');
    if (sess && sess.role === 'teacher' && Store.hasTeacher()) return Teacher.mount(role === 't' ? page : 'home');
    if (sess && sess.role === 'student' && sess.payload) return Student.mount(role === 's' ? page : 'home');
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    Login.render();
  },

  logout() {
    Session.clear();
    this.mounted = null;
    Login.tab = null;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    Login.render();
  },

  async fetchPublished() {
    const r = await fetch('ogrenci-veri.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  },

  async studentLogin(no, pass) {
    if (!Sec.available()) throw new Error('Bu tarayıcı güvenli girişi desteklemiyor. Siteyi https adresinden açın.');
    // 1) Öğretmenle aynı cihazdaysa doğrudan yerel veriden
    const local = Store.data.students.find(s => U.normNo(s.no) === U.normNo(no));
    if (local && local.pass === pass) return Store.studentPayload(local);
    // 2) Yayınlanmış şifreli dosyadan
    let file;
    try { file = await this.fetchPublished(); Login.pub = file; }
    catch (e) { throw new Error('Öğrenci bilgileri yüklenemedi. İnternet bağlantını kontrol et.'); }
    if (!file || !file.students || !Object.keys(file.students).length) {
      throw new Error('Öğretmenin henüz öğrenci bilgilerini yayınlamadı.');
    }
    const entry = file.students[await Sec.lookupId(no)];
    if (!entry) throw new Error('Okul numarası ya da şifre hatalı.');
    try { return await Sec.decryptJSON(entry, pass, file.kdf && file.kdf.iterations); }
    catch (e) { throw new Error('Okul numarası ya da şifre hatalı.'); }
  },

  restoreBackup(onDone) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.addEventListener('change', async () => {
      const file = inp.files[0];
      if (!file) return;
      let obj;
      try { obj = JSON.parse(await file.text()); } catch (e) { return U.toast('Dosya okunamadı: geçerli bir yedek değil.', 'error'); }
      if (!obj || !obj.teacher || !obj.teacher.passHash || !Array.isArray(obj.students)) {
        return U.toast('Bu dosya geçerli bir öğretmen yedeği değil.', 'error');
      }
      if (Store.hasTeacher() && !(await U.confirm('Bu cihazdaki mevcut veriler yedekteki verilerle değiştirilecek. Devam edilsin mi?', 'Geri yükle'))) return;
      Store.data = Store.normalize(obj);
      Store.save(false);
      U.toast(`Yedek yüklendi: ${Store.data.teacher.name}, ${Store.data.students.length} öğrenci`);
      if (onDone) onDone();
    });
    inp.click();
  },
};

App.start();
