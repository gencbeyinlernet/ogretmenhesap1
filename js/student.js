'use strict';

const Student = Object.assign(Object.create(PanelBase), {
  role: 'student',
  theme: 'theme-student',
  logo: '🎒',
  brandTitle: 'Öğrenci Portalı',
  PAGES: [
    { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'notlar', label: 'Notlarım', icon: '💯' },
    { id: 'devam', label: 'Devamsızlık', icon: '📋' },
    { id: 'odev', label: 'Ödevlerim', icon: '📚' },
    { id: 'duyuru', label: 'Duyurular', icon: '📢' },
    { id: 'program', label: 'Ders Programı', icon: '🗓️' },
  ],

  p() { const s = Session.get(); return (s && s.payload) || {}; },
  brandSub() { const st = this.p().student || {}; return [st.name, st.className].filter(Boolean).join(' · '); },

  hwList(list) {
    return `<div class="list">${list.map(a => `
      <div class="item static ${a.due && a.due < U.today() ? 'past' : ''}"><span class="item-main"><strong>${U.esc(a.title)}</strong>
        ${a.desc ? `<span class="small pre">${U.esc(a.desc)}</span>` : ''}
        <span class="tags">${V.dueTag(a.due)}</span></span></div>`).join('')}</div>`;
  },
  annList(list) {
    return `<div class="list">${list.map(a => `
      <div class="item static"><span class="item-main"><strong>${U.esc(a.title)}</strong>
        <span class="small pre">${U.esc(a.body)}</span><span class="tags"><span class="tag muted">${U.fmt(a.date)}</span></span></span></div>`).join('')}</div>`;
  },

  views: {
    home() {
      const p = this.p(), t = p.teacher || {}, st = p.student || {}, today = U.today();
      const avg = U.avg((p.grades || []).map(g => g.score));
      const yok = (p.attendance || []).filter(a => a.type === 'yok').length;
      const pending = (p.assignments || []).filter(a => !a.due || a.due >= today).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
      const ann = (p.announcements || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
      const slots = ((p.schedule || {})[new Date().getDay()] || []).slice().sort((a, b) => U.toMin(a.start) - U.toMin(b.start));
      return {
        title: `Merhaba, ${U.firstName(st.name)} 👋`,
        sub: `${st.className || ''} · Okul No: ${st.no || ''}`,
        html: `
          <div class="stats">
            ${V.stat('💯', U.num(avg), 'Not ortalamam', 'notlar')}
            ${V.stat('📋', yok, 'Devamsızlık', 'devam')}
            ${V.stat('📚', pending.length, 'Bekleyen ödev', 'odev')}
            ${V.stat('📢', (p.announcements || []).length, 'Duyuru', 'duyuru')}
          </div>
          <div class="grid-2">
            <section class="card teacher-card">
              <div class="card-head"><h2>Öğretmenim</h2></div>
              <div class="detail-head"><span class="avatar" style="--c:hsl(${U.hue(t.name)} 55% 45%)">${U.esc(U.initials(t.name))}</span>
                <div><strong>${U.esc(t.name)}</strong><div class="muted small">${U.esc([t.branch && t.branch + ' Öğretmeni', t.school].filter(Boolean).join(' · '))}</div></div></div>
              ${t.message ? `<blockquote class="bubble">${U.esc(t.message)}</blockquote>` : ''}
              <dl class="kv">
                ${t.meetingHours ? `<dt>Görüşme saati</dt><dd>${U.esc(t.meetingHours)}</dd>` : ''}
                ${t.phone ? `<dt>Telefon</dt><dd><a href="tel:${U.esc(t.phone.replace(/\s/g, ''))}">${U.esc(t.phone)}</a></dd>` : ''}
                ${t.email ? `<dt>E-posta</dt><dd><a href="mailto:${U.esc(t.email)}">${U.esc(t.email)}</a></dd>` : ''}
              </dl>
            </section>
            <section class="card">
              <div class="card-head"><h2>Bugünkü derslerim</h2><button class="link" data-act="go" data-page="program">Haftalık →</button></div>
              ${slots.length ? V.slotList(slots, true) : V.empty('Bugün bu öğretmenle dersin yok.')}
            </section>
            <section class="card">
              <div class="card-head"><h2>Yaklaşan ödevler</h2><button class="link" data-act="go" data-page="odev">Tümü →</button></div>
              ${pending.length ? this.hwList(pending.slice(0, 4)) : V.empty('Bekleyen ödevin yok 🎉')}
            </section>
            <section class="card">
              <div class="card-head"><h2>Son duyurular</h2><button class="link" data-act="go" data-page="duyuru">Tümü →</button></div>
              ${ann.length ? this.annList(ann) : V.empty('Henüz duyuru yok.')}
            </section>
          </div>
          <p class="muted small center">Bilgiler en son ${U.fmtStamp(p.updated)} tarihinde güncellendi.</p>`,
      };
    },

    notlar() {
      const p = this.p();
      const grades = (p.grades || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const avg = U.avg(grades.map(g => g.score));
      return {
        title: 'Notlarım',
        sub: grades.length ? `${grades.length} değerlendirme · Ortalama ${U.num(avg)}` : '',
        html: grades.length ? `
          <section class="card avg-card"><span class="muted">Not ortalamam</span><strong class="score big ${U.scoreCls(avg)}">${U.num(avg)}</strong></section>
          <section class="card flush"><div class="table-wrap"><table class="table">
            <thead><tr><th>Değerlendirme</th><th>Tarih</th><th class="num">Puan</th><th class="bar-col"></th></tr></thead>
            <tbody>${grades.map(g => { const n = Number(g.score); return `<tr><td><strong>${U.esc(g.title)}</strong></td><td class="muted">${U.fmt(g.date)}</td>
              <td class="num"><span class="score ${U.scoreCls(n)}">${U.esc(g.score)}</span></td>
              <td class="bar-col"><span class="meter"><i class="${U.scoreCls(n)}" style="width:${Math.max(0, Math.min(100, n))}%"></i></span></td></tr>`; }).join('')}</tbody>
          </table></div></section>` : `<div class="card">${V.empty('Henüz notun girilmedi.')}</div>`,
      };
    },

    devam() {
      const p = this.p();
      const list = (p.attendance || []).slice().sort((a, b) => b.date.localeCompare(a.date));
      const cnt = k => list.filter(a => a.type === k).length;
      return {
        title: 'Devamsızlık',
        html: `<div class="stats three">
            <div class="stat static"><span class="stat-icon">❌</span><span class="stat-val">${cnt('yok')}</span><span class="stat-label">Gelmedi</span></div>
            <div class="stat static"><span class="stat-icon">⏰</span><span class="stat-val">${cnt('gec')}</span><span class="stat-label">Geç kaldı</span></div>
            <div class="stat static"><span class="stat-icon">📝</span><span class="stat-val">${cnt('izinli')}</span><span class="stat-label">İzinli</span></div>
          </div>
          <section class="card">${list.length ? `<table class="table"><tbody>${list.map(a => `
            <tr><td>${U.fmt(a.date)} <small class="muted">${U.DAYS[U.parse(a.date).getDay()]}</small></td>
            <td><span class="tag att-${a.type}">${ATT_TYPES[a.type] || a.type}</span></td><td class="muted small">${U.esc(a.note)}</td></tr>`).join('')}</tbody></table>`
            : V.empty('Hiç devamsızlığın yok, harika! 🌟')}</section>`,
      };
    },

    odev() {
      const p = this.p(), today = U.today();
      const all = p.assignments || [];
      const open = all.filter(a => !a.due || a.due >= today).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
      const past = all.filter(a => a.due && a.due < today).sort((a, b) => b.due.localeCompare(a.due));
      return {
        title: 'Ödevlerim',
        sub: `${open.length} bekleyen ödev`,
        html: `<section class="card"><div class="card-head"><h2>Bekleyen</h2></div>${open.length ? this.hwList(open) : V.empty('Bekleyen ödevin yok 🎉')}</section>
          ${past.length ? `<section class="card"><div class="card-head"><h2>Süresi geçenler</h2></div>${this.hwList(past)}</section>` : ''}`,
      };
    },

    duyuru() {
      const list = (this.p().announcements || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return { title: 'Duyurular', html: `<section class="card">${list.length ? this.annList(list) : V.empty('Henüz duyuru yok.')}</section>` };
    },

    program() {
      const sch = this.p().schedule || {};
      const has = Object.values(sch).some(l => l && l.length);
      return {
        title: 'Ders Programı',
        sub: 'Öğretmeninle olan derslerin',
        html: has ? V.weekGrid(sch, null) : `<div class="card">${V.empty('Ders programı henüz eklenmedi.')}</div>`,
      };
    },
  },
});
