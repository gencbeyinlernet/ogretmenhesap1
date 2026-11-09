'use strict';

/* Genel yardımcılar: tarih, biçimlendirme, modal, bildirim */
const U = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  pad(n) { return String(n).padStart(2, '0'); },
  iso(d) { return `${d.getFullYear()}-${U.pad(d.getMonth() + 1)}-${U.pad(d.getDate())}`; },
  today() { return U.iso(new Date()); },
  parse(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); },
  fmt(s, o) { return s ? U.parse(s).toLocaleDateString('tr-TR', o || { day: 'numeric', month: 'long', year: 'numeric' }) : ''; },
  fmtShort(s) { return U.fmt(s, { day: 'numeric', month: 'short' }); },
  fmtStamp(iso) {
    return iso ? new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  },
  DAYS: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  MONTHS: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  diff(a, b) { return Math.round((U.parse(b) - U.parse(a)) / 86400000); },
  rel(s) {
    const n = U.diff(U.today(), s);
    if (n === 0) return 'Bugün';
    if (n === 1) return 'Yarın';
    if (n === -1) return 'Dün';
    return n > 0 ? `${n} gün sonra` : `${-n} gün önce`;
  },
  toMin(t) { if (!t) return -1; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); },
  fromMin(n) { n = Math.max(0, Math.min(n, 23 * 60 + 59)); return `${U.pad(Math.floor(n / 60))}:${U.pad(n % 60)}`; },
  nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); },
  dur(min) { const h = Math.floor(min / 60), m = min % 60; return h ? `${h} sa ${m ? m + ' dk' : ''}`.trim() : `${m} dk`; },
  avg(list) {
    const n = list.map(Number).filter(x => !isNaN(x));
    return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
  },
  num(n) { return n == null ? '—' : (Math.round(n * 10) / 10).toLocaleString('tr-TR'); },
  scoreCls(n) { return n == null ? '' : n >= 85 ? 'hi' : n >= 50 ? 'mid' : 'lo'; },
  cmp(a, b) { return String(a ?? '').localeCompare(String(b ?? ''), 'tr', { numeric: true, sensitivity: 'base' }); },
  normNo(no) { return String(no ?? '').replace(/\s+/g, '').toLocaleLowerCase('tr'); },
  lower(s) { return String(s ?? '').toLocaleLowerCase('tr'); },
  firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; },
  initials(name) { return String(name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toLocaleUpperCase('tr'); },
  greet() { const h = new Date().getHours(); return h < 5 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'; },
  hue(str) { let h = 0; for (const c of String(str || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; },
  genPass(len = 6) {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // karışan harfler (i, l, o, 0, 1) yok
    let out = '';
    while (out.length < len) {
      for (const x of crypto.getRandomValues(new Uint8Array(len * 2))) {
        if (x < 248 && out.length < len) out += chars[x % 31];
      }
    }
    return out;
  },
  siteUrl() { return location.origin + location.pathname.replace(/index\.html$/, ''); },
  repoUrl() {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    if (!m) return null;
    const repo = location.pathname.split('/').filter(Boolean)[0];
    return `https://github.com/${m[1]}/${repo && repo !== 'index.html' ? repo : m[1] + '.github.io'}`;
  },
  download(name, text, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  },
  formData(form) {
    const o = {};
    new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; });
    form.querySelectorAll('input[type=checkbox][name]').forEach(cb => { o[cb.name] = cb.checked; });
    return o;
  },
  copy(text, msg = 'Kopyalandı') {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => U.toast(msg), () => U.toast('Kopyalanamadı', 'error'));
    else U.toast('Tarayıcınız kopyalamayı desteklemiyor', 'error');
  },
  toast(msg, type = 'ok') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.classList.add('out'), type === 'error' ? 4200 : 2600);
    setTimeout(() => el.remove(), type === 'error' ? 4600 : 3000);
  },
  field(label, control, o = {}) {
    return `<label class="field ${o.full ? 'full' : ''}"><span class="label">${label}</span>${control}${o.hint ? `<small class="hint">${o.hint}</small>` : ''}</label>`;
  },
  _modalN: 0,
  /* o: {title, body, onSubmit(data, box, close), submitText, danger, wide, left, onOpen(box, close), onClose} */
  modal(o) {
    const root = document.getElementById('modal-root');
    const n = ++U._modalN;
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    const tag = o.onSubmit ? 'form' : 'div';
    wrap.innerHTML = `
      <${tag} class="modal ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mt-${n}">
        <header class="modal-head"><h3 id="mt-${n}">${U.esc(o.title)}</h3>
          <button type="button" class="icon-btn" data-close aria-label="Kapat">✕</button></header>
        <div class="modal-body">${o.body || ''}</div>
        <footer class="modal-foot">${o.left || ''}<span class="spacer"></span>
          <button type="button" class="btn ghost" data-close>${o.onSubmit ? (o.cancelText || 'Vazgeç') : 'Kapat'}</button>
          ${o.onSubmit ? `<button type="submit" class="btn ${o.danger ? 'danger' : 'primary'}">${o.submitText || 'Kaydet'}</button>` : ''}
        </footer>
      </${tag}>`;
    root.appendChild(wrap);
    document.body.classList.add('modal-open');
    const box = wrap.firstElementChild;
    const prev = document.activeElement;
    let closed = false;
    const onKey = e => { if (e.key === 'Escape' && root.lastElementChild === wrap) close(); };
    const close = () => {
      if (closed) return;
      closed = true;
      wrap.remove();
      document.removeEventListener('keydown', onKey);
      if (!root.children.length) document.body.classList.remove('modal-open');
      if (prev && prev.isConnected && prev.focus) prev.focus();
      if (o.onClose) o.onClose();
    };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    if (o.onSubmit) {
      box.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = box.querySelector('[type=submit]');
        btn.disabled = true;
        try {
          const r = await o.onSubmit(U.formData(box), box, close);
          if (r !== false) close();
        } catch (err) {
          U.toast(err.message || 'Bir hata oluştu', 'error');
        } finally { btn.disabled = false; }
      });
    }
    if (o.onOpen) o.onOpen(box, close);
    if (o.onSubmit) {
      requestAnimationFrame(() => {
        const f = box.querySelector('.modal-body input:not([type=hidden]):not([type=checkbox]):not([type=radio]), .modal-body textarea, .modal-body select');
        if (f) f.focus();
      });
    }
    return close;
  },
  confirm(msg, okText = 'Sil', danger = true) {
    return new Promise(res => {
      let ok = false;
      U.modal({
        title: 'Emin misiniz?',
        body: `<p>${U.esc(msg)}</p>`,
        submitText: okText,
        danger,
        onSubmit: () => { ok = true; },
        onClose: () => res(ok),
      });
    });
  },
};

/* Ortak görünüm parçaları */
const V = {
  stat(icon, value, label, page) {
    return `<button class="stat" data-act="go" data-page="${page}">
      <span class="stat-icon" aria-hidden="true">${icon}</span>
      <span class="stat-val">${value}</span><span class="stat-label">${label}</span></button>`;
  },
  empty(text, extra = '') { return `<div class="empty"><p>${text}</p>${extra}</div>`; },
  slotList(slots, live) {
    if (!slots.length) return '';
    const now = U.nowMin();
    let nextFound = false;
    return `<ul class="slots">${slots.map(s => {
      const a = U.toMin(s.start), b = U.toMin(s.end);
      let st = '', badge = '';
      if (live) {
        if (now >= a && now < b) { st = 'now'; badge = '<span class="badge primary">Şimdi</span>'; }
        else if (now >= b) { st = 'past'; badge = '<span class="badge">Bitti</span>'; }
        else if (!nextFound) { nextFound = true; st = 'next'; badge = `<span class="badge info">${U.dur(a - now)} sonra</span>`; }
      }
      const meta = [s.className, s.room].filter(Boolean).join(' · ');
      return `<li class="slot ${st}" style="--c:hsl(${U.hue(s.className || s.lesson)} 65% 52%)">
        <span class="slot-time">${U.esc(s.start)}<small>${U.esc(s.end)}</small></span>
        <span class="slot-main"><strong>${U.esc(s.lesson)}</strong>${meta ? `<small>${U.esc(meta)}</small>` : ''}</span>${badge}</li>`;
    }).join('')}</ul>`;
  },
  weekGrid(schedule, editable) {
    const dow = new Date().getDay();
    const days = [1, 2, 3, 4, 5];
    if ((schedule[6] || []).length || (editable && editable.showSat)) days.push(6);
    if ((schedule[0] || []).length) days.push(0);
    return `<div class="week">${days.map(day => {
      const slots = (schedule[day] || []).slice().sort((a, b) => U.toMin(a.start) - U.toMin(b.start));
      return `<section class="day-col ${day === dow ? 'today' : ''}">
        <header class="day-head"><span>${U.DAYS[day]}</span><small>${slots.length ? slots.length + ' ders' : ''}</small></header>
        <div class="day-slots">${slots.map(s => {
          const meta = [s.className, s.room].filter(Boolean).join(' · ');
          const inner = `<span class="slot-time">${U.esc(s.start)} – ${U.esc(s.end)}</span><strong>${U.esc(s.lesson)}</strong>${meta ? `<small>${U.esc(meta)}</small>` : ''}`;
          const style = `style="--c:hsl(${U.hue(s.className || s.lesson)} 65% 52%)"`;
          return editable
            ? `<button class="slot-card" ${style} data-act="slotEdit" data-day="${day}" data-id="${s.id}">${inner}</button>`
            : `<div class="slot-card" ${style}>${inner}</div>`;
        }).join('') || '<p class="empty-sm">Ders yok</p>'}</div>
        ${editable ? `<button class="add-slot" data-act="slotAdd" data-day="${day}">+ Ders ekle</button>` : ''}
      </section>`;
    }).join('')}</div>`;
  },
  dueTag(due) {
    if (!due) return '';
    const n = U.diff(U.today(), due);
    const cls = n < 0 ? 'muted' : n <= 2 ? 'danger' : n <= 7 ? 'warn' : 'info';
    return `<span class="tag ${cls}">Teslim: ${U.fmtShort(due)} · ${U.rel(due)}</span>`;
  },
};
