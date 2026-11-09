'use strict';

const EVENT_TYPES = {
  toplanti: { label: 'Toplantı', color: '#6366f1' },
  nobet: { label: 'Nöbet', color: '#f59e0b' },
  sinav: { label: 'Sınav', color: '#ef4444' },
  veli: { label: 'Veli Görüşmesi', color: '#10b981' },
  kisisel: { label: 'Kişisel', color: '#ec4899' },
  diger: { label: 'Diğer', color: '#64748b' },
};
const HW_COLOR = '#0ea5e9';
const ATT_TYPES = { yok: 'Gelmedi', gec: 'Geç kaldı', izinli: 'İzinli' };
const NOTE_COLORS = { sari: 'Sarı', mavi: 'Mavi', yesil: 'Yeşil', pembe: 'Pembe', mor: 'Mor', gri: 'Gri' };
const GRADE_TITLES = ['1. Yazılı', '2. Yazılı', '3. Yazılı', '1. Performans', '2. Performans', 'Proje', 'Sözlü', 'Deneme Sınavı'];

const esc = U.esc;

const Teacher = Object.assign(Object.create(PanelBase), {
  role: 'teacher',
  theme: 'theme-teacher',
  logo: '🎓',
  brandTitle: 'Öğretmen Hesabım',
  PAGES: [
    { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'program', label: 'Ders Programı', icon: '🗓️' },
    { id: 'ajanda', label: 'Ajanda', icon: '📅' },
    { id: 'notlarim', label: 'Notlarım', icon: '📝' },
    { id: 'ogrenciler', label: 'Öğrencilerim', icon: '👥' },
    { id: 'yoklama', label: 'Yoklama', icon: '✅' },
    { id: 'notgiris', label: 'Not Girişi', icon: '💯' },
    { id: 'odev', label: 'Ödev & Duyuru', icon: '📢' },
    { id: 'ayarlar', label: 'Profil & Ayarlar', icon: '⚙️' },
  ],
  st: {
    calMonth: '', calSel: '', stClass: '', stSearch: '', showPass: false, noteSearch: '',
    yClass: '', yDate: '', gClass: '', gTitle: '', gDate: '', showSat: false,
  },

  brandSub() { const t = Store.data.teacher || {}; return [t.name, t.branch].filter(Boolean).join(' · '); },

  classDatalist(id = 'dl-classes') {
    return `<datalist id="${id}">${Store.classes(true).map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist>`;
  },
  classOptions(selected, allLabel) {
    return (allLabel ? `<option value="">${allLabel}</option>` : '') +
      Store.classes(true).map(c => `<option value="${esc(c)}" ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join('');
  },
  studentsOf(cls) { return Store.data.students.filter(s => s.className === cls).sort((a, b) => U.cmp(a.no, b.no)); },
  findGrade(s, title) { const t = U.lower(title); return s.grades.find(g => U.lower(g.title) === t); },

  /* ============================== SAYFALAR ============================== */
  views: {
    home() {
      const d = Store.data, t = d.teacher, today = U.today(), dow = new Date().getDay();
      const slots = Store.daySlots(dow);
      const pending = d.todos.filter(x => !x.done);
      const todos = [
        ...pending.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (b.created || '').localeCompare(a.created || '')),
        ...d.todos.filter(x => x.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 5),
      ];
      const upcoming = this.upcoming(14);
      const unpub = Store.unpublished();

      const html = `
        ${unpub ? `<div class="banner warn"><span>📤 Öğrenci portalında henüz yayınlanmamış değişiklikleriniz var.</span>
          <button class="btn sm" data-act="publish">Yayın dosyasını oluştur</button></div>` : ''}
        <div class="stats">
          ${V.stat('📚', slots.length, 'Bugünkü ders', 'program')}
          ${V.stat('👥', d.students.length, 'Öğrenci', 'ogrenciler')}
          ${V.stat('☑️', pending.length, 'Bekleyen görev', 'home')}
          ${V.stat('📅', upcoming.length, 'Yaklaşan (14 gün)', 'ajanda')}
        </div>
        <div class="grid-2">
          <section class="card">
            <div class="card-head"><h2>Bugünkü Derslerim</h2><button class="link" data-act="go" data-page="program">Haftalık program →</button></div>
            ${slots.length ? V.slotList(slots, true) : V.empty(dow === 0 || dow === 6 ? 'Bugün hafta sonu, iyi dinlenmeler! ☕' : 'Bugün için programda ders yok.',
              `<button class="btn sm" data-act="slotAdd">+ Ders ekle</button>`)}
          </section>
          <section class="card">
            <div class="card-head"><h2>Yapılacaklar</h2>${d.todos.some(x => x.done) ? '<button class="link" data-act="todoClear">Tamamlananları temizle</button>' : ''}</div>
            <form class="inline-form" data-submit="todoAdd">
              <input class="input grow" name="text" placeholder="Yeni görev ekle…" aria-label="Yeni görev" required maxlength="200">
              <input class="input" type="date" name="due" aria-label="Son tarih" title="Son tarih (isteğe bağlı)">
              <button class="btn primary" type="submit" aria-label="Görev ekle">Ekle</button>
            </form>
            ${todos.length ? `<ul class="todos">${todos.map(x => `
              <li class="todo ${x.done ? 'done' : ''}">
                <label><input type="checkbox" data-change="todoToggle" data-id="${x.id}" ${x.done ? 'checked' : ''}><span>${esc(x.text)}</span></label>
                ${x.due && !x.done ? `<span class="tag ${x.due < today ? 'danger' : x.due === today ? 'warn' : 'muted'}">${U.rel(x.due)}</span>` : ''}
                <button class="icon-btn sm" data-act="todoDel" data-id="${x.id}" aria-label="Görevi sil" title="Sil">✕</button>
              </li>`).join('')}</ul>` : '<p class="empty-sm">Görev listeniz boş.</p>'}
          </section>
          <section class="card">
            <div class="card-head"><h2>Yaklaşanlar</h2><button class="link" data-act="go" data-page="ajanda">Ajanda →</button></div>
            ${upcoming.length ? `<div class="list">${upcoming.slice(0, 8).map(it => this.agendaItem(it, true)).join('')}</div>`
              : V.empty('Önümüzdeki 14 gün için kayıt yok.', '<button class="btn sm" data-act="evAdd">+ Etkinlik ekle</button>')}
          </section>
          <section class="card">
            <div class="card-head"><h2>Hızlı Not</h2><small class="muted" id="scratch-state"></small></div>
            <textarea class="input scratch" data-input="scratch" aria-label="Hızlı not" placeholder="Aklınıza geleni buraya yazın, otomatik kaydedilir…">${esc(d.scratch)}</textarea>
          </section>
        </div>`;
      return {
        title: `${U.greet()}, ${U.firstName(t.name)} Hocam`,
        sub: [`${U.fmt(today)}, ${U.DAYS[dow]}`, t.school].filter(Boolean).join(' · '),
        html,
      };
    },

    program() {
      const d = Store.data;
      let total = 0;
      for (let i = 0; i <= 6; i++) total += d.schedule[i].length;
      return {
        title: 'Ders Programı',
        sub: total ? `Haftada toplam ${total} ders saati · Düzenlemek için derse tıklayın` : 'Haftalık ders programınızı oluşturun',
        actions: `${!d.schedule[6].length ? `<button class="btn" data-act="toggleSat">${this.st.showSat ? 'Cumartesiyi gizle' : 'Cumartesi ekle'}</button>` : ''}
          <button class="btn primary" data-act="slotAdd">+ Ders Ekle</button>`,
        html: `${V.weekGrid(d.schedule, { showSat: this.st.showSat })}
          <p class="hint">💡 Sınıf/şube yazdığınız dersler, o sınıftaki öğrencilerin portalında “Ders Programı” olarak görünür.</p>`,
      };
    },

    ajanda() {
      const today = U.today();
      if (!this.st.calMonth) this.st.calMonth = today.slice(0, 7);
      if (!this.st.calSel) this.st.calSel = today;
      const [y, m] = this.st.calMonth.split('-').map(Number);
      const first = new Date(y, m - 1, 1);
      const offset = (first.getDay() + 6) % 7;
      const dim = new Date(y, m, 0).getDate();
      const n = Math.ceil((offset + dim) / 7) * 7;
      const map = this.agendaMap();
      let cells = '';
      for (let i = 0; i < n; i++) {
        const dt = new Date(y, m - 1, 1 - offset + i);
        const iso = U.iso(dt);
        const items = map[iso] || [];
        const cls = [dt.getMonth() !== m - 1 && 'other', iso === today && 'today', iso === this.st.calSel && 'sel',
          (dt.getDay() === 0 || dt.getDay() === 6) && 'weekend'].filter(Boolean).join(' ');
        cells += `<button class="cal-cell ${cls}" data-act="calSel" data-date="${iso}" aria-label="${U.fmt(iso)}${items.length ? ', ' + items.length + ' kayıt' : ''}">
          <span class="cal-num">${dt.getDate()}</span>
          <span class="cal-items">${items.slice(0, 2).map(it => `<span class="cal-item" style="--c:${it.color}">${esc(it.title)}</span>`).join('')}${items.length > 2 ? `<span class="cal-more">+${items.length - 2}</span>` : ''}</span>
          <span class="cal-dots">${items.slice(0, 4).map(it => `<i style="background:${it.color}"></i>`).join('')}</span>
        </button>`;
      }
      const sel = this.st.calSel, selItems = map[sel] || [];
      const upcoming = this.upcoming(30);
      return {
        title: 'Ajanda',
        sub: 'Toplantı, nöbet, sınav ve görüşmeleriniz',
        actions: `<button class="btn primary" data-act="evAdd" data-date="${sel}">+ Etkinlik Ekle</button>`,
        html: `<div class="agenda">
          <section class="card cal">
            <div class="cal-head">
              <button class="icon-btn" data-act="calNav" data-dir="-1" aria-label="Önceki ay">‹</button>
              <h2>${U.MONTHS[m - 1]} ${y}</h2>
              <button class="icon-btn" data-act="calNav" data-dir="1" aria-label="Sonraki ay">›</button>
              <span class="spacer"></span><button class="btn sm" data-act="calToday">Bugün</button>
            </div>
            <div class="cal-grid cal-wd">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(x => `<span>${x}</span>`).join('')}</div>
            <div class="cal-grid">${cells}</div>
            <div class="legend">${Object.values(EVENT_TYPES).map(t => `<span><i style="background:${t.color}"></i>${t.label}</span>`).join('')}<span><i style="background:${HW_COLOR}"></i>Ödev teslimi</span></div>
          </section>
          <section class="card">
            <div class="card-head"><h2>${U.fmt(sel)} <small class="muted">${U.DAYS[U.parse(sel).getDay()]}</small></h2>
              <button class="btn sm primary" data-act="evAdd" data-date="${sel}">+ Ekle</button></div>
            ${selItems.length ? `<div class="list">${selItems.map(it => this.agendaItem(it)).join('')}</div>` : '<p class="empty-sm">Bu gün için kayıt yok.</p>'}
            <h3 class="sub-h">Önümüzdeki 30 gün</h3>
            ${upcoming.length ? `<div class="list">${upcoming.map(it => this.agendaItem(it, true)).join('')}</div>` : '<p class="empty-sm">Yaklaşan kayıt yok.</p>'}
          </section>
        </div>`,
      };
    },

    notlarim() {
      return {
        title: 'Notlarım',
        sub: 'Kişisel notlarınız — yalnızca siz görürsünüz',
        actions: '<button class="btn primary" data-act="noteAdd">+ Yeni Not</button>',
        html: `<div class="toolbar"><input type="search" class="input grow" data-input="noteSearch" placeholder="Notlarda ara…" aria-label="Notlarda ara" value="${esc(this.st.noteSearch)}"></div>
          <div id="notes-list">${this.notesListHtml()}</div>`,
      };
    },

    ogrenciler() {
      const d = Store.data, classes = Store.classes();
      if (this.st.stClass && !classes.includes(this.st.stClass)) this.st.stClass = '';
      return {
        title: 'Öğrencilerim',
        sub: `${d.students.length} öğrenci · ${classes.length} sınıf`,
        actions: `<button class="btn" data-act="printCards">🖨️ Giriş kartları</button>
          <button class="btn" data-act="stBulk">Toplu ekle</button>
          <button class="btn primary" data-act="stAdd">+ Öğrenci</button>`,
        html: `<div class="toolbar">
            <select class="input" data-change="stClass" aria-label="Sınıf filtresi"><option value="">Tüm sınıflar</option>
              ${classes.map(c => `<option value="${esc(c)}" ${c === this.st.stClass ? 'selected' : ''}>${esc(c)} (${d.students.filter(s => s.className === c).length})</option>`).join('')}</select>
            <input type="search" class="input grow" data-input="stSearch" placeholder="Ad veya numara ara…" aria-label="Öğrenci ara" value="${esc(this.st.stSearch)}">
            <label class="check"><input type="checkbox" data-change="stShowPass" ${this.st.showPass ? 'checked' : ''}> Şifreleri göster</label>
          </div>
          <div id="st-list">${this.studentListHtml()}</div>`,
      };
    },

    yoklama() {
      const d = Store.data, classes = Store.classes();
      if (!classes.length) return { title: 'Yoklama', html: this.noStudents() };
      if (!classes.includes(this.st.yClass)) this.st.yClass = classes[0];
      if (!this.st.yDate) this.st.yDate = U.today();
      const date = this.st.yDate, cls = this.st.yClass;
      const list = this.studentsOf(cls);
      const taken = d.rollcalls.find(r => r.className === cls && r.date === date);
      const opts = [['var', 'Var'], ['yok', 'Yok'], ['gec', 'Geç'], ['izinli', 'İzinli']];
      const recent = d.rollcalls.filter(r => r.className === cls).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
      return {
        title: 'Yoklama',
        sub: `${cls} · ${U.fmt(date)} ${U.DAYS[U.parse(date).getDay()]}`,
        html: `<div class="toolbar">
            <select class="input" data-change="yClass" aria-label="Sınıf">${classes.map(c => `<option ${c === cls ? 'selected' : ''} value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
            <input type="date" class="input" data-change="yDate" value="${date}" aria-label="Tarih">
            ${taken ? '<span class="tag ok">✓ Bu tarihte yoklama alınmış</span>' : '<span class="tag muted">Yoklama henüz alınmadı</span>'}
          </div>
          <form data-submit="yoklamaSave" class="card">
            <div class="att-list">${list.map(s => {
              const cur = (s.attendance.find(a => a.date === date) || {}).type || 'var';
              return `<div class="att-row"><span class="mono muted">${esc(s.no)}</span><strong class="grow">${esc(s.name)}</strong>
                <div class="seg-radio" role="radiogroup" aria-label="${esc(s.name)}">${opts.map(([v, l]) => `
                  <label class="opt-${v}"><input type="radio" name="a_${s.id}" value="${v}" ${cur === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
                </div></div>`;
            }).join('')}</div>
            <div class="form-actions"><button type="button" class="btn" data-act="yAllPresent">Hepsi var</button><span class="spacer"></span>
              <button type="submit" class="btn primary">Yoklamayı Kaydet</button></div>
          </form>
          ${recent.length ? `<section class="card"><div class="card-head"><h2>Son yoklamalar · ${esc(cls)}</h2></div>
            <div class="table-wrap"><table class="table"><thead><tr><th>Tarih</th><th class="num">Gelmedi</th><th class="num">Geç</th><th class="num">İzinli</th><th></th></tr></thead>
            <tbody>${recent.map(r => `<tr class="click" data-act="yOpen" data-date="${r.date}"><td>${U.fmt(r.date)} <small class="muted">${U.DAYS[U.parse(r.date).getDay()]}</small></td>
              <td class="num">${r.yok || '—'}</td><td class="num">${r.gec || '—'}</td><td class="num">${r.izinli || '—'}</td><td class="num"><span class="link">Aç</span></td></tr>`).join('')}</tbody></table></div></section>` : ''}`,
      };
    },

    notgiris() {
      const d = Store.data, classes = Store.classes();
      if (!classes.length) return { title: 'Not Girişi', html: this.noStudents() };
      if (!classes.includes(this.st.gClass)) this.st.gClass = classes[0];
      if (!this.st.gDate) this.st.gDate = U.today();
      const cls = this.st.gClass, title = this.st.gTitle;
      const list = this.studentsOf(cls);
      const titles = [];
      list.forEach(s => s.grades.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(g => {
        if (!titles.some(t => U.lower(t) === U.lower(g.title))) titles.push(g.title);
      }));
      const allTitles = [...new Set([...GRADE_TITLES, ...titles])];
      const entry = title ? `
        <form data-submit="gradesSave" class="card">
          <div class="card-head"><h2>${esc(title)} · ${esc(cls)}</h2><small class="muted">Boş bırakılan puan silinir · Enter ile sonraki öğrenciye geçin</small></div>
          <div class="grade-list">${list.map(s => {
            const g = this.findGrade(s, title);
            return `<label class="grade-row"><span class="mono muted">${esc(s.no)}</span><span class="grow">${esc(s.name)}</span>
              <input type="number" class="input score-in" name="g_${s.id}" min="0" max="100" step="0.5" inputmode="decimal" value="${g ? esc(g.score) : ''}" aria-label="${esc(s.name)} puanı"></label>`;
          }).join('')}</div>
          <div class="form-actions"><span class="muted small" id="g-avg"></span><span class="spacer"></span><button class="btn primary" type="submit">Notları Kaydet</button></div>
        </form>` : `<div class="card">${V.empty('Not girmek için yukarıdan bir değerlendirme seçin ya da yeni bir ad yazın (örn. “1. Yazılı”).',
          `<div class="chips">${allTitles.slice(0, 8).map(t => `<button class="chip" data-act="gPick" data-title="${esc(t)}">${esc(t)}</button>`).join('')}</div>`)}</div>`;

      const matrix = titles.length ? `
        <section class="card"><div class="card-head"><h2>Not çizelgesi · ${esc(cls)}</h2><small class="muted">Sütun başlığına tıklayarak o notu düzenleyin</small></div>
          <div class="table-wrap"><table class="table matrix"><thead><tr><th>No</th><th>Ad Soyad</th>
            ${titles.map(t => `<th class="num"><button class="link" data-act="gPick" data-title="${esc(t)}">${esc(t)}</button></th>`).join('')}<th class="num">Ort.</th></tr></thead>
          <tbody>${list.map(s => {
            const a = U.avg(s.grades.map(g => g.score));
            return `<tr><td class="mono muted">${esc(s.no)}</td><td>${esc(s.name)}</td>
              ${titles.map(t => { const g = this.findGrade(s, t); return `<td class="num">${g ? `<span class="score ${U.scoreCls(Number(g.score))}">${esc(g.score)}</span>` : '<span class="muted">—</span>'}</td>`; }).join('')}
              <td class="num"><strong>${U.num(a)}</strong></td></tr>`;
          }).join('')}</tbody>
          <tfoot><tr><td></td><td>Sınıf ortalaması</td>${titles.map(t => `<td class="num">${U.num(U.avg(list.map(s => this.findGrade(s, t)).filter(Boolean).map(g => g.score)))}</td>`).join('')}
            <td class="num"><strong>${U.num(U.avg(list.flatMap(s => s.grades.map(g => g.score))))}</strong></td></tr></tfoot></table></div>
        </section>` : '';

      return {
        title: 'Not Girişi',
        sub: `${cls} · ${list.length} öğrenci`,
        html: `<div class="toolbar">
            <select class="input" data-change="gClass" aria-label="Sınıf">${classes.map(c => `<option ${c === cls ? 'selected' : ''} value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
            <input class="input grow" list="dl-gt" data-change="gTitle" value="${esc(title)}" placeholder="Değerlendirme adı (örn. 1. Yazılı)" aria-label="Değerlendirme adı">
            <input type="date" class="input" data-change="gDate" value="${this.st.gDate}" aria-label="Tarih">
          </div>
          <datalist id="dl-gt">${allTitles.map(t => `<option value="${esc(t)}"></option>`).join('')}</datalist>
          ${entry}${matrix}`,
        after() {
          const form = document.querySelector('[data-submit=gradesSave]');
          if (!form) return;
          const inputs = [...form.querySelectorAll('.score-in')];
          const upd = () => {
            const a = U.avg(inputs.map(i => i.value).filter(v => v !== ''));
            const el = document.getElementById('g-avg');
            if (el) el.textContent = a == null ? '' : `Bu değerlendirmenin ortalaması: ${U.num(a)}`;
          };
          inputs.forEach((inp, i) => inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); (inputs[i + 1] || form.querySelector('[type=submit]')).focus(); }
          }));
          form.addEventListener('input', upd);
          upd();
        },
      };
    },

    odev() {
      const d = Store.data, today = U.today();
      const asg = d.assignments.slice().sort((a, b) => {
        const ap = !!(a.due && a.due < today), bp = !!(b.due && b.due < today);
        if (ap !== bp) return ap ? 1 : -1;
        return ap ? (b.due || '').localeCompare(a.due || '') : (a.due || '9999').localeCompare(b.due || '9999');
      });
      const ann = d.announcements.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return {
        title: 'Ödev & Duyuru',
        sub: 'Öğrencilerinize ödev verin, duyuru yapın',
        actions: '<button class="btn" data-act="annAdd">+ Duyuru</button><button class="btn primary" data-act="odevAdd">+ Ödev Ver</button>',
        html: `<div class="grid-2">
          <section class="card"><div class="card-head"><h2>📚 Ödevler</h2><button class="btn sm primary" data-act="odevAdd">+ Ödev ver</button></div>
            ${asg.length ? `<div class="list">${asg.map(a => `
              <button class="item ${a.due && a.due < today ? 'past' : ''}" data-act="odevEdit" data-id="${a.id}">
                <span class="item-main"><strong>${esc(a.title)}</strong>${a.desc ? `<span class="small clamp">${esc(a.desc)}</span>` : ''}
                <span class="tags"><span class="tag">${esc(a.className || 'Tüm sınıflarım')}</span>${V.dueTag(a.due)}</span></span>
              </button>`).join('')}</div>` : V.empty('Henüz ödev vermediniz.')}
          </section>
          <section class="card"><div class="card-head"><h2>📢 Duyurular</h2><button class="btn sm primary" data-act="annAdd">+ Duyuru</button></div>
            ${ann.length ? `<div class="list">${ann.map(a => `
              <button class="item" data-act="annEdit" data-id="${a.id}">
                <span class="item-main"><strong>${esc(a.title)}</strong>${a.body ? `<span class="small clamp">${esc(a.body)}</span>` : ''}
                <span class="tags"><span class="tag">${esc(a.className || 'Tüm sınıflarım')}</span><span class="tag muted">${U.fmt(a.date)}</span></span></span>
              </button>`).join('')}</div>` : V.empty('Henüz duyuru yok.')}
          </section>
        </div>
        <p class="hint">💡 Ödev ve duyurular, öğrenci portalını yayınladığınızda öğrencilerinize görünür (Profil & Ayarlar → Öğrenci Portalı).</p>`,
      };
    },

    ayarlar() {
      const d = Store.data, t = d.teacher, m = d.meta, repo = U.repoUrl();
      const status = !d.students.length ? '<span class="tag muted">Henüz öğrenci yok</span>'
        : Store.unpublished() ? '<span class="tag warn">Yayınlanmamış değişiklik var</span>' : '<span class="tag ok">Güncel</span>';
      return {
        title: 'Profil & Ayarlar',
        sub: 'Bilgileriniz, öğrenci portalı ve yedekleme',
        html: `<div class="grid-2">
          <section class="card">
            <h2>👤 Profil Bilgilerim</h2>
            <form data-submit="profileSave" class="stack">
              <div class="form-grid">
                ${U.field('Ad Soyad', `<input class="input" name="name" required value="${esc(t.name)}" autocomplete="name">`)}
                ${U.field('Branş', `<input class="input" name="branch" value="${esc(t.branch)}" placeholder="Örn. Matematik">`)}
                ${U.field('Okul', `<input class="input" name="school" value="${esc(t.school)}">`)}
                ${U.field('Telefon', `<input class="input" type="tel" name="phone" value="${esc(t.phone)}">`)}
                ${U.field('E-posta', `<input class="input" type="email" name="email" value="${esc(t.email)}">`)}
                ${U.field('Veli görüşme saatim', `<input class="input" name="meetingHours" value="${esc(t.meetingHours)}" placeholder="Örn. Salı 12:40–13:20">`)}
              </div>
              ${U.field('Öğrencilerime mesajım', `<textarea class="input" name="message" rows="3" placeholder="Öğrenci ana sayfasında görünür.">${esc(t.message)}</textarea>`)}
              <label class="check"><input type="checkbox" name="shareContact" ${t.shareContact ? 'checked' : ''}> Telefon ve e-postamı öğrencilerime göster</label>
              <div class="form-actions"><span class="spacer"></span><button class="btn primary" type="submit">Kaydet</button></div>
            </form>
          </section>
          <section class="card">
            <h2>📤 Öğrenci Portalı</h2>
            <p>Öğrencileriniz kendi telefon ya da bilgisayarından giriş yapabilsin diye verileri <strong>şifreli</strong> bir dosyaya dönüştürüp sitenize yüklersiniz. Her öğrencinin verisi yalnızca kendi şifresiyle açılır.</p>
            <dl class="kv"><dt>Durum</dt><dd>${status}</dd><dt>Son değişiklik</dt><dd>${U.fmtStamp(m.changedAt)}</dd><dt>Son yayın dosyası</dt><dd>${U.fmtStamp(m.publishedAt)}</dd></dl>
            <button class="btn primary" data-act="publish">📤 Yayın dosyasını oluştur</button>
            <ol class="steps">
              <li>Butona basın, <code>ogrenci-veri.json</code> dosyası bilgisayarınıza iner.</li>
              <li>${repo ? `<a href="${repo}" target="_blank" rel="noopener">GitHub deponuzu</a>` : 'GitHub deponuzu'} açın → <b>Add file</b> → <b>Upload files</b>.</li>
              <li>Dosyayı sürükleyip bırakın ve <b>Commit changes</b>’e basın (eskisinin yerine geçer).</li>
              <li>1–2 dakika içinde öğrencileriniz güncel bilgileri görür.</li>
            </ol>
            <p class="small muted">Öğrenci giriş adresi: <a href="${esc(U.siteUrl())}" target="_blank" rel="noopener">${esc(U.siteUrl())}</a>
              <button class="link" data-act="copyUrl">Kopyala</button></p>
          </section>
          <section class="card">
            <h2>🔒 Şifre Değiştir</h2>
            <form data-submit="passChange" class="stack">
              ${U.field('Mevcut şifre', '<input class="input" type="password" name="old" required autocomplete="current-password">')}
              ${U.field('Yeni şifre', '<input class="input" type="password" name="pass" required minlength="4" autocomplete="new-password">')}
              ${U.field('Yeni şifre (tekrar)', '<input class="input" type="password" name="pass2" required minlength="4" autocomplete="new-password">')}
              <div class="form-actions"><span class="spacer"></span><button class="btn primary" type="submit">Şifreyi Değiştir</button></div>
            </form>
          </section>
          <section class="card">
            <h2>💾 Yedekleme</h2>
            <p>Tüm verileriniz <strong>bu tarayıcıda</strong> saklanır. Tarayıcı verileri silinirse kaybolur; düzenli yedek alın. Yedekle başka bir cihaza da taşıyabilirsiniz.</p>
            <div class="btn-row"><button class="btn" data-act="backup">⬇️ Yedek indir</button><button class="btn" data-act="restore">⬆️ Yedekten yükle</button></div>
            <hr>
            <button class="btn danger-ghost" data-act="resetAll">Bu cihazdaki tüm verileri sil</button>
          </section>
        </div>`,
      };
    },
  },

  /* ============================== YARDIMCI GÖRÜNÜMLER ============================== */
  noStudents() {
    return `<div class="card">${V.empty('Önce öğrenci eklemelisiniz.', '<button class="btn primary" data-act="go" data-page="ogrenciler">Öğrencilerime git</button>')}</div>`;
  },

  agendaMap() {
    const d = Store.data, map = {};
    const add = (date, it) => { (map[date] = map[date] || []).push(it); };
    d.events.forEach(e => {
      const t = EVENT_TYPES[e.type] || EVENT_TYPES.diger;
      add(e.date, { kind: 'ev', id: e.id, date: e.date, time: e.time || '', title: e.title, note: e.note || '', color: t.color, label: t.label });
    });
    d.assignments.forEach(a => {
      if (a.due) add(a.due, { kind: 'odev', id: a.id, date: a.due, time: '', title: a.title, note: '', color: HW_COLOR, label: 'Ödev teslimi' + (a.className ? ' · ' + a.className : '') });
    });
    Object.values(map).forEach(l => l.sort((a, b) => (a.time || '99').localeCompare(b.time || '99')));
    return map;
  },

  upcoming(days) {
    const today = U.today(), map = this.agendaMap();
    return Object.keys(map).filter(k => k >= today && U.diff(today, k) <= days).sort().flatMap(k => map[k]);
  },

  agendaItem(it, withDate) {
    return `<button class="item" data-act="${it.kind === 'ev' ? 'evEdit' : 'odevEdit'}" data-id="${it.id}">
      <i class="bar" style="background:${it.color}"></i>
      <span class="item-main"><strong>${esc(it.title)}</strong>
        <span class="small muted">${withDate ? `${U.fmtShort(it.date)} (${U.rel(it.date)}) · ` : ''}${it.time ? esc(it.time) + ' · ' : ''}${esc(it.label)}</span>
        ${it.note ? `<span class="small clamp">${esc(it.note)}</span>` : ''}</span></button>`;
  },

  notesListHtml() {
    const q = U.lower(this.st.noteSearch);
    const list = Store.data.notes.filter(n => !q || U.lower(n.title + ' ' + n.body).includes(q))
      .sort((a, b) => (Number(!!b.pinned) - Number(!!a.pinned)) || (b.updated || '').localeCompare(a.updated || ''));
    if (!list.length) return V.empty(q ? 'Aramanıza uygun not bulunamadı.' : 'Henüz not eklemediniz.', q ? '' : '<button class="btn primary" data-act="noteAdd">+ İlk notunuzu ekleyin</button>');
    return `<div class="notes">${list.map(n => `
      <button class="note c-${n.color || 'sari'}" data-act="noteEdit" data-id="${n.id}">
        ${n.pinned ? '<span class="pin" aria-label="Sabitlenmiş">📌</span>' : ''}
        <strong>${esc(n.title || 'Başlıksız')}</strong><span class="note-body">${esc(n.body)}</span><small>${U.fmtStamp(n.updated)}</small>
      </button>`).join('')}</div>`;
  },

  filteredStudents() {
    const q = U.lower(this.st.stSearch);
    return Store.data.students
      .filter(s => !this.st.stClass || s.className === this.st.stClass)
      .filter(s => !q || U.lower(s.name).includes(q) || U.lower(s.no).includes(q))
      .sort((a, b) => U.cmp(a.className, b.className) || U.cmp(a.no, b.no));
  },

  studentListHtml() {
    if (!Store.data.students.length) {
      return `<div class="card">${V.empty('Henüz öğrenci eklemediniz. Tek tek ekleyebilir ya da listeyi yapıştırarak toplu ekleyebilirsiniz.',
        '<div class="btn-row center"><button class="btn" data-act="stBulk">Toplu ekle</button><button class="btn primary" data-act="stAdd">+ Öğrenci ekle</button></div>')}</div>`;
    }
    const list = this.filteredStudents();
    if (!list.length) return `<div class="card">${V.empty('Aramanıza uygun öğrenci bulunamadı.')}</div>`;
    return `<div class="card flush"><div class="table-wrap"><table class="table">
      <thead><tr><th>No</th><th>Ad Soyad</th><th>Sınıf</th><th class="num">Ortalama</th><th class="num">Devamsızlık</th><th>Şifre</th><th class="num">İşlem</th></tr></thead>
      <tbody>${list.map(s => {
        const a = U.avg(s.grades.map(g => g.score));
        const yok = s.attendance.filter(x => x.type === 'yok').length;
        return `<tr class="click" data-act="stDetail" data-id="${s.id}">
          <td class="mono">${esc(s.no)}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.className)}</td>
          <td class="num">${a == null ? '<span class="muted">—</span>' : `<span class="score ${U.scoreCls(a)}">${U.num(a)}</span>`}</td>
          <td class="num">${yok || '<span class="muted">—</span>'}</td>
          <td class="mono">${this.st.showPass ? esc(s.pass) : '••••••'}</td>
          <td class="num nowrap"><button class="icon-btn sm" data-act="stEdit" data-id="${s.id}" title="Düzenle" aria-label="${esc(s.name)} düzenle">✏️</button><button class="icon-btn sm" data-act="stDel" data-id="${s.id}" title="Sil" aria-label="${esc(s.name)} sil">🗑️</button></td>
        </tr>`;
      }).join('')}</tbody></table></div></div>`;
  },

  stDetailHtml(s) {
    const grades = s.grades.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const att = s.attendance.slice().sort((a, b) => b.date.localeCompare(a.date));
    const a = U.avg(s.grades.map(g => g.score));
    const cnt = k => s.attendance.filter(x => x.type === k).length;
    return `
      <div class="detail-head">
        <span class="avatar" style="--c:hsl(${U.hue(s.name)} 60% 50%)">${esc(U.initials(s.name))}</span>
        <div class="grow"><div class="muted small">No ${esc(s.no)} · ${esc(s.className)}</div>
          <div class="small">Giriş şifresi: <code class="mono">${esc(s.pass)}</code> <button type="button" class="link" data-x="copyPass">Kopyala</button></div>
          ${s.parentName || s.parentPhone ? `<div class="small">Veli: ${esc(s.parentName)} ${s.parentPhone ? `· <a href="tel:${esc(s.parentPhone.replace(/\s/g, ''))}">${esc(s.parentPhone)}</a>` : ''}</div>` : ''}
        </div>
      </div>
      <div class="mini-stats">
        <div><strong class="score ${U.scoreCls(a)}">${U.num(a)}</strong><span>Ortalama</span></div>
        <div><strong>${s.grades.length}</strong><span>Not</span></div>
        <div><strong>${cnt('yok')}</strong><span>Gelmedi</span></div>
        <div><strong>${cnt('gec')}</strong><span>Geç</span></div>
        <div><strong>${cnt('izinli')}</strong><span>İzinli</span></div>
      </div>
      <h4 class="sub-h">Notlar</h4>
      ${grades.length ? `<table class="table compact"><tbody>${grades.map(g => `
        <tr><td>${esc(g.title)}</td><td class="muted small">${U.fmt(g.date)}</td><td class="num"><span class="score ${U.scoreCls(Number(g.score))}">${esc(g.score)}</span></td>
        <td class="num"><button type="button" class="icon-btn sm" data-x="gDel" data-id="${g.id}" aria-label="Notu sil">✕</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty-sm">Henüz not girilmedi.</p>'}
      <div class="add-row">
        <input class="input grow" name="gt" list="dl-gt-m" placeholder="Değerlendirme (örn. 1. Yazılı)" aria-label="Değerlendirme adı">
        <input class="input w-score" name="gs" type="number" min="0" max="100" step="0.5" placeholder="Puan" aria-label="Puan">
        <input class="input" name="gd" type="date" value="${U.today()}" aria-label="Tarih">
        <button type="button" class="btn sm primary" data-x="gAdd">Not ekle</button>
      </div>
      <datalist id="dl-gt-m">${GRADE_TITLES.map(t => `<option value="${t}"></option>`).join('')}</datalist>
      <h4 class="sub-h">Devamsızlık</h4>
      ${att.length ? `<table class="table compact"><tbody>${att.map(x => `
        <tr><td>${U.fmt(x.date)} <small class="muted">${U.DAYS[U.parse(x.date).getDay()]}</small></td><td><span class="tag att-${x.type}">${ATT_TYPES[x.type] || x.type}</span></td>
        <td class="small muted">${esc(x.note || '')}</td><td class="num"><button type="button" class="icon-btn sm" data-x="aDel" data-id="${x.id}" aria-label="Kaydı sil">✕</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty-sm">Devamsızlık kaydı yok.</p>'}
      <div class="add-row">
        <input class="input" name="ad" type="date" value="${U.today()}" aria-label="Tarih">
        <select class="input" name="at" aria-label="Tür">${Object.entries(ATT_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <input class="input grow" name="an" placeholder="Açıklama (isteğe bağlı)" aria-label="Açıklama">
        <button type="button" class="btn sm primary" data-x="aAdd">Kaydet</button>
      </div>
      <h4 class="sub-h">Özel not <small class="muted">(öğrenciye gösterilmez)</small></h4>
      <textarea class="input" name="privateNote" rows="3" placeholder="Bu öğrenciyle ilgili notlarınız…">${esc(s.privateNote || '')}</textarea>`;
  },

  /* ============================== MODALLAR ============================== */
  slotModal(day, id) {
    const d = Store.data;
    const ex = id ? (d.schedule[day] || []).find(s => s.id === id) : null;
    const dayVal = ex ? Number(day) : (day != null ? Number(day) : (new Date().getDay() || 1));
    let start = '08:30', end = '09:10';
    if (!ex) {
      const list = Store.daySlots(dayVal);
      if (list.length) {
        const last = list[list.length - 1];
        const len = U.toMin(last.end) - U.toMin(last.start);
        start = U.fromMin(U.toMin(last.end) + 10);
        end = U.fromMin(U.toMin(start) + (len > 0 ? len : 40));
      }
    }
    U.modal({
      title: ex ? 'Dersi Düzenle' : 'Ders Ekle',
      body: `<div class="form-grid">
          ${U.field('Gün', `<select class="input" name="day">${[1, 2, 3, 4, 5, 6, 0].map(n => `<option value="${n}" ${n === dayVal ? 'selected' : ''}>${U.DAYS[n]}</option>`).join('')}</select>`)}
          ${U.field('Ders', `<input class="input" name="lesson" required value="${esc(ex ? ex.lesson : (d.teacher.branch || ''))}" placeholder="Örn. Matematik">`)}
          ${U.field('Başlangıç', `<input class="input" type="time" name="start" required value="${ex ? ex.start : start}">`)}
          ${U.field('Bitiş', `<input class="input" type="time" name="end" required value="${ex ? ex.end : end}">`)}
          ${U.field('Sınıf / Şube', `<input class="input" name="className" list="dl-classes" value="${esc(ex && ex.className)}" placeholder="Örn. 7-A">`, { hint: 'Bu sınıftaki öğrenciler dersi kendi programında görür.' })}
          ${U.field('Derslik', `<input class="input" name="room" value="${esc(ex && ex.room)}" placeholder="Örn. Fen Lab.">`)}
        </div>${this.classDatalist()}`,
      left: ex ? '<button type="button" class="btn danger-ghost" data-del>Sil</button>' : '',
      onOpen: (box, close) => {
        const b = box.querySelector('[data-del]');
        if (b) b.addEventListener('click', async () => {
          if (!(await U.confirm(`${ex.lesson} (${U.DAYS[day]} ${ex.start}) programdan silinsin mi?`))) return;
          d.schedule[day] = d.schedule[day].filter(s => s.id !== id);
          Store.save(true); close(); this.renderPage(); U.toast('Ders silindi');
        });
      },
      onSubmit: f => {
        if (U.toMin(f.end) <= U.toMin(f.start)) { U.toast('Bitiş saati başlangıçtan sonra olmalı.', 'error'); return false; }
        const item = { id: ex ? ex.id : U.uid(), start: f.start, end: f.end, lesson: f.lesson, className: f.className, room: f.room };
        if (ex) d.schedule[day] = d.schedule[day].filter(s => s.id !== id);
        d.schedule[Number(f.day)].push(item);
        Store.save(true); this.renderPage(); U.toast(ex ? 'Ders güncellendi' : 'Ders eklendi');
      },
    });
  },

  eventModal(id, date) {
    const d = Store.data, ex = id ? d.events.find(e => e.id === id) : null;
    U.modal({
      title: ex ? 'Etkinliği Düzenle' : 'Etkinlik Ekle',
      body: `<div class="form-grid">
          ${U.field('Başlık', `<input class="input" name="title" required value="${esc(ex && ex.title)}" placeholder="Örn. Zümre toplantısı">`, { full: true })}
          ${U.field('Tarih', `<input class="input" type="date" name="date" required value="${ex ? ex.date : (date || U.today())}">`)}
          ${U.field('Saat', `<input class="input" type="time" name="time" value="${esc(ex && ex.time)}">`)}
          ${U.field('Tür', `<select class="input" name="type">${Object.entries(EVENT_TYPES).map(([k, v]) => `<option value="${k}" ${(ex ? ex.type : 'toplanti') === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>`)}
          ${U.field('Açıklama', `<textarea class="input" name="note" rows="3">${esc(ex && ex.note)}</textarea>`, { full: true })}
        </div>`,
      left: ex ? '<button type="button" class="btn danger-ghost" data-del>Sil</button>' : '',
      onOpen: (box, close) => this.bindDelete(box, close, 'Bu etkinlik silinsin mi?', () => { d.events = d.events.filter(e => e.id !== id); Store.save(false); }),
      onSubmit: f => {
        const item = { id: ex ? ex.id : U.uid(), title: f.title, date: f.date, time: f.time, type: f.type, note: f.note };
        if (ex) Object.assign(ex, item); else d.events.push(item);
        Store.save(false);
        this.st.calSel = f.date; this.st.calMonth = f.date.slice(0, 7);
        this.renderPage(); U.toast(ex ? 'Etkinlik güncellendi' : 'Etkinlik eklendi');
      },
    });
  },

  noteModal(id) {
    const d = Store.data, ex = id ? d.notes.find(n => n.id === id) : null;
    const color = ex ? ex.color || 'sari' : 'sari';
    U.modal({
      title: ex ? 'Notu Düzenle' : 'Yeni Not',
      wide: true,
      body: `${U.field('Başlık', `<input class="input" name="title" value="${esc(ex && ex.title)}" placeholder="Başlık">`)}
        ${U.field('Not', `<textarea class="input" name="body" rows="10" required>${esc(ex && ex.body)}</textarea>`)}
        <div class="row-between">
          <div class="swatches" role="radiogroup" aria-label="Renk">${Object.entries(NOTE_COLORS).map(([k, v]) => `<label class="swatch c-${k}" title="${v}"><input type="radio" name="color" value="${k}" ${k === color ? 'checked' : ''} aria-label="${v}"><span></span></label>`).join('')}</div>
          <label class="check"><input type="checkbox" name="pinned" ${ex && ex.pinned ? 'checked' : ''}> 📌 Sabitle</label>
        </div>`,
      left: ex ? '<button type="button" class="btn danger-ghost" data-del>Sil</button>' : '',
      onOpen: (box, close) => this.bindDelete(box, close, 'Bu not silinsin mi?', () => { d.notes = d.notes.filter(n => n.id !== id); Store.save(false); }),
      onSubmit: f => {
        const item = { title: f.title, body: f.body, color: f.color || 'sari', pinned: f.pinned, updated: new Date().toISOString() };
        if (ex) Object.assign(ex, item); else d.notes.push(Object.assign({ id: U.uid() }, item));
        Store.save(false); this.renderPage(); U.toast('Not kaydedildi');
      },
    });
  },

  stModal(id) {
    const d = Store.data, ex = id ? d.students.find(s => s.id === id) : null;
    U.modal({
      title: ex ? 'Öğrenciyi Düzenle' : 'Öğrenci Ekle',
      body: `<div class="form-grid">
          ${U.field('Okul numarası', `<input class="input" name="no" required value="${esc(ex && ex.no)}" inputmode="numeric">`)}
          ${U.field('Ad Soyad', `<input class="input" name="name" required value="${esc(ex && ex.name)}">`)}
          ${U.field('Sınıf / Şube', `<input class="input" name="className" required list="dl-classes" value="${esc(ex ? ex.className : this.st.stClass)}" placeholder="Örn. 7-A">`)}
          ${U.field('Giriş şifresi', `<span class="input-row"><input class="input mono" name="pass" required minlength="4" value="${esc(ex ? ex.pass : U.genPass())}"><button type="button" class="btn sm" data-gen>Yeni üret</button></span>`, { hint: 'Öğrenci bu şifreyle giriş yapar.' })}
          ${U.field('Veli adı', `<input class="input" name="parentName" value="${esc(ex && ex.parentName)}">`)}
          ${U.field('Veli telefonu', `<input class="input" type="tel" name="parentPhone" value="${esc(ex && ex.parentPhone)}">`)}
          ${U.field('Özel not', `<textarea class="input" name="privateNote" rows="2">${esc(ex && ex.privateNote)}</textarea>`, { full: true, hint: 'Öğrenciye ve veliye gösterilmez.' })}
        </div>${this.classDatalist()}`,
      onOpen: box => {
        box.querySelector('[data-gen]').addEventListener('click', () => { box.querySelector('[name=pass]').value = U.genPass(); });
      },
      onSubmit: f => {
        if (d.students.some(s => s.id !== id && U.normNo(s.no) === U.normNo(f.no))) {
          U.toast('Bu numarayla kayıtlı başka bir öğrenci var.', 'error'); return false;
        }
        const fields = { no: f.no, name: f.name, className: f.className, pass: f.pass, parentName: f.parentName, parentPhone: f.parentPhone, privateNote: f.privateNote };
        if (ex) Object.assign(ex, fields);
        else d.students.push(Object.assign({ id: U.uid(), grades: [], attendance: [], created: new Date().toISOString() }, fields));
        Store.save(true); this.renderPage(); U.toast(ex ? 'Öğrenci güncellendi' : 'Öğrenci eklendi');
      },
    });
  },

  stDetail(id) {
    const d = Store.data, s = d.students.find(x => x.id === id);
    if (!s) return;
    U.modal({
      title: s.name,
      wide: true,
      body: this.stDetailHtml(s),
      left: '<button type="button" class="btn" data-edit>✏️ Bilgileri düzenle</button>',
      onOpen: (box, close) => {
        const body = box.querySelector('.modal-body');
        const rerender = () => { const y = body.scrollTop; body.innerHTML = this.stDetailHtml(s); body.scrollTop = y; };
        const val = n => (body.querySelector(`[name=${n}]`) || {}).value || '';
        box.addEventListener('click', e => {
          if (e.target.closest('[data-edit]')) { close(); this.stModal(id); return; }
          const el = e.target.closest('[data-x]');
          if (!el) return;
          const x = el.dataset.x;
          if (x === 'copyPass') U.copy(s.pass, 'Şifre kopyalandı');
          if (x === 'gAdd') {
            const title = val('gt').trim(), raw = val('gs'), score = Number(raw);
            if (!title) return U.toast('Değerlendirme adını yazın.', 'error');
            if (raw === '' || isNaN(score) || score < 0 || score > 100) return U.toast('Puan 0–100 arasında olmalı.', 'error');
            const g = this.findGrade(s, title);
            if (g) Object.assign(g, { score, date: val('gd') }); else s.grades.push({ id: U.uid(), title, score, date: val('gd') });
            Store.save(true); rerender(); U.toast(g ? 'Not güncellendi' : 'Not eklendi');
          }
          if (x === 'gDel') { s.grades = s.grades.filter(g => g.id !== el.dataset.id); Store.save(true); rerender(); }
          if (x === 'aAdd') {
            const date = val('ad');
            if (!date) return U.toast('Tarih seçin.', 'error');
            s.attendance = s.attendance.filter(a => a.date !== date);
            s.attendance.push({ id: U.uid(), date, type: val('at'), note: val('an').trim() });
            Store.save(true); rerender(); U.toast('Devamsızlık kaydedildi');
          }
          if (x === 'aDel') { s.attendance = s.attendance.filter(a => a.id !== el.dataset.id); Store.save(true); rerender(); }
        });
        box.addEventListener('change', e => {
          if (e.target.name === 'privateNote') { s.privateNote = e.target.value; Store.save(false); U.toast('Özel not kaydedildi'); }
        });
        box.addEventListener('keydown', e => {
          const row = e.target.closest('.add-row');
          if (e.key === 'Enter' && row && e.target.tagName === 'INPUT') { e.preventDefault(); row.querySelector('[data-x]').click(); }
        });
      },
      onClose: () => this.renderPage(),
    });
  },

  stBulk() {
    const d = Store.data;
    U.modal({
      title: 'Toplu Öğrenci Ekle',
      wide: true,
      body: `${U.field('Sınıf / Şube', `<input class="input" name="className" required list="dl-classes" value="${esc(this.st.stClass)}" placeholder="Örn. 7-A">`)}
        ${U.field('Öğrenci listesi', '<textarea class="input mono" name="list" rows="10" required placeholder="101 Ali Yılmaz&#10;102 Ayşe Demir&#10;103 Mehmet Kaya"></textarea>',
          { hint: 'Her satıra bir öğrenci: okul numarası ve ad soyad. e-Okul ya da Excel listesinden iki sütunu kopyalayıp yapıştırabilirsiniz. Şifreler otomatik oluşturulur.' })}
        ${this.classDatalist()}`,
      submitText: 'Öğrencileri Ekle',
      onSubmit: f => {
        let added = 0;
        const skipped = [];
        f.list.split(/\r?\n/).forEach(line => {
          line = line.trim();
          if (!line) return;
          let no, name, m = line.match(/^(\d[\w-]*)[\s;,.\t]+(.+)$/);
          if (m) { no = m[1]; name = m[2]; }
          else if ((m = line.match(/^(.+?)[\s;,\t]+(\d[\w-]*)$/))) { no = m[2]; name = m[1]; }
          else { skipped.push(line); return; }
          name = name.replace(/^[\s;,.\t]+|[\s;,\t]+$/g, '');
          if (!name || d.students.some(s => U.normNo(s.no) === U.normNo(no))) { skipped.push(line); return; }
          d.students.push({ id: U.uid(), no, name, className: f.className, pass: U.genPass(), parentName: '', parentPhone: '', privateNote: '', grades: [], attendance: [], created: new Date().toISOString() });
          added++;
        });
        if (!added) { U.toast('Hiç öğrenci eklenemedi. Satırlar "numara ad soyad" biçiminde olmalı (aynı numara iki kez eklenemez).', 'error'); return false; }
        this.st.stClass = f.className;
        Store.save(true); this.renderPage();
        U.toast(`${added} öğrenci eklendi${skipped.length ? `, ${skipped.length} satır atlandı` : ''}`);
      },
    });
  },

  hwModal(id) {
    const d = Store.data, ex = id ? d.assignments.find(a => a.id === id) : null;
    U.modal({
      title: ex ? 'Ödevi Düzenle' : 'Ödev Ver',
      body: `<div class="form-grid">
          ${U.field('Başlık', `<input class="input" name="title" required value="${esc(ex && ex.title)}" placeholder="Örn. Kesirler alıştırmaları">`, { full: true })}
          ${U.field('Sınıf', `<select class="input" name="className">${this.classOptions(ex ? ex.className : this.st.stClass, 'Tüm sınıflarım')}</select>`)}
          ${U.field('Son teslim tarihi', `<input class="input" type="date" name="due" value="${esc(ex ? ex.due : '')}">`)}
          ${U.field('Açıklama', `<textarea class="input" name="desc" rows="4" placeholder="Sayfa numaraları, yönergeler…">${esc(ex && ex.desc)}</textarea>`, { full: true })}
        </div>`,
      left: ex ? '<button type="button" class="btn danger-ghost" data-del>Sil</button>' : '',
      onOpen: (box, close) => this.bindDelete(box, close, 'Bu ödev silinsin mi?', () => { d.assignments = d.assignments.filter(a => a.id !== id); Store.save(true); }),
      onSubmit: f => {
        const item = { title: f.title, className: f.className, due: f.due, desc: f.desc };
        if (ex) Object.assign(ex, item); else d.assignments.push(Object.assign({ id: U.uid(), created: new Date().toISOString() }, item));
        Store.save(true); this.renderPage(); U.toast(ex ? 'Ödev güncellendi' : 'Ödev eklendi');
      },
    });
  },

  annModal(id) {
    const d = Store.data, ex = id ? d.announcements.find(a => a.id === id) : null;
    U.modal({
      title: ex ? 'Duyuruyu Düzenle' : 'Yeni Duyuru',
      body: `<div class="form-grid">
          ${U.field('Başlık', `<input class="input" name="title" required value="${esc(ex && ex.title)}">`, { full: true })}
          ${U.field('Sınıf', `<select class="input" name="className">${this.classOptions(ex ? ex.className : '', 'Tüm sınıflarım')}</select>`)}
          ${U.field('Tarih', `<input class="input" type="date" name="date" required value="${ex ? ex.date : U.today()}">`)}
          ${U.field('Duyuru metni', `<textarea class="input" name="body" rows="5" required>${esc(ex && ex.body)}</textarea>`, { full: true })}
        </div>`,
      left: ex ? '<button type="button" class="btn danger-ghost" data-del>Sil</button>' : '',
      onOpen: (box, close) => this.bindDelete(box, close, 'Bu duyuru silinsin mi?', () => { d.announcements = d.announcements.filter(a => a.id !== id); Store.save(true); }),
      onSubmit: f => {
        const item = { title: f.title, className: f.className, date: f.date, body: f.body };
        if (ex) Object.assign(ex, item); else d.announcements.push(Object.assign({ id: U.uid() }, item));
        Store.save(true); this.renderPage(); U.toast(ex ? 'Duyuru güncellendi' : 'Duyuru yayımlandı');
      },
    });
  },

  bindDelete(box, close, msg, fn) {
    const b = box.querySelector('[data-del]');
    if (!b) return;
    b.addEventListener('click', async () => {
      if (!(await U.confirm(msg))) return;
      fn(); close(); this.renderPage(); U.toast('Silindi');
    });
  },

  printCards() {
    const list = this.filteredStudents();
    if (!list.length) return U.toast('Yazdırılacak öğrenci yok.', 'error');
    const w = window.open('', '_blank');
    if (!w) return U.toast('Açılır pencere engellendi. Tarayıcıda bu siteye izin verin.', 'error');
    const url = U.siteUrl(), t = Store.data.teacher;
    w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Öğrenci Giriş Kartları</title>
      <style>body{font-family:system-ui,"Segoe UI",sans-serif;margin:18px;color:#111}h1{font-size:16px;margin:0 0 12px}
      .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.c{border:1.5px dashed #999;border-radius:10px;padding:12px 14px;break-inside:avoid}
      .c h2{font-size:15px;margin:0 0 6px}.r{display:flex;justify-content:space-between;font-size:13px;margin:3px 0}
      .m{font-family:ui-monospace,Consolas,monospace;font-weight:700;font-size:15px;letter-spacing:.06em}.u{font-size:11px;color:#444;margin-top:6px;word-break:break-all}
      .bar{margin-bottom:14px}@media print{.bar{display:none}}</style></head><body>
      <div class="bar"><button onclick="print()">🖨️ Yazdır</button></div>
      <h1>${esc(t.name)}${t.branch ? ' · ' + esc(t.branch) : ''} — Öğrenci giriş bilgileri</h1>
      <div class="grid">${list.map(s => `<div class="c"><h2>${esc(s.name)}</h2>
        <div class="r"><span>Sınıf</span><b>${esc(s.className)}</b></div>
        <div class="r"><span>Okul No</span><span class="m">${esc(s.no)}</span></div>
        <div class="r"><span>Şifre</span><span class="m">${esc(s.pass)}</span></div>
        <div class="u">Giriş adresi: ${esc(url)}</div></div>`).join('')}</div></body></html>`);
    w.document.close();
  },

  async publish(btn) {
    const d = Store.data;
    if (!d.students.length) return U.toast('Önce öğrenci ekleyin.', 'error');
    if (!Sec.available()) return U.toast('Bu tarayıcı şifrelemeyi desteklemiyor. Siteyi https adresinden açın.', 'error');
    const label = btn ? btn.innerHTML : '';
    if (btn) btn.disabled = true;
    try {
      const stamp = new Date().toISOString();
      const t = d.teacher;
      const out = {
        app: 'ogretmenhesap', v: 1, updated: stamp,
        teacher: { name: t.name, branch: t.branch || '', school: t.school || '' },
        kdf: { name: 'PBKDF2-SHA256', iterations: Sec.ITER },
        students: {},
      };
      const list = d.students.filter(s => s.pass);
      let done = 0;
      for (let i = 0; i < list.length; i += 6) {
        await Promise.all(list.slice(i, i + 6).map(async s => {
          out.students[await Sec.lookupId(s.no)] = await Sec.encryptJSON(Store.studentPayload(s, stamp), s.pass);
          done++;
        }));
        if (btn) btn.textContent = `Şifreleniyor… ${done}/${list.length}`;
      }
      U.download('ogrenci-veri.json', JSON.stringify(out));
      d.meta.publishedAt = new Date().toISOString();
      Store.save(false);
      this.renderPage();
      const repo = U.repoUrl();
      U.modal({
        title: 'Yayın dosyası hazır ✅',
        body: `<p><strong>${list.length}</strong> öğrencinin verisi şifrelendi ve <code>ogrenci-veri.json</code> dosyası indirildi.</p>
          <ol class="steps">
            <li>${repo ? `<a href="${repo}" target="_blank" rel="noopener">GitHub deponuzu açın</a>` : 'GitHub deponuzu açın'}.</li>
            <li><b>Add file</b> → <b>Upload files</b>’a tıklayın.</li>
            <li>İndirilen <code>ogrenci-veri.json</code> dosyasını sürükleyip bırakın.</li>
            <li><b>Commit changes</b>’e basın. 1–2 dakika sonra öğrencileriniz güncel bilgileri görür.</li>
          </ol>
          <p class="small muted">Dosyadaki her öğrencinin bilgisi kendi şifresiyle kilitlidir; başkası açamaz. Özel notlarınız ve veli bilgileri dosyaya hiç eklenmez.</p>`,
      });
    } catch (e) {
      U.toast('Dosya oluşturulamadı: ' + e.message, 'error');
    } finally {
      if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = label; }
    }
  },

  /* ============================== OLAYLAR ============================== */
  act: {
    publish(el) { this.publish(el); },
    slotAdd(el) { this.slotModal(el.dataset.day != null ? Number(el.dataset.day) : null); },
    slotEdit(el) { this.slotModal(Number(el.dataset.day), el.dataset.id); },
    toggleSat() { this.st.showSat = !this.st.showSat; this.renderPage(); },
    todoDel(el) { Store.data.todos = Store.data.todos.filter(x => x.id !== el.dataset.id); Store.save(false); this.renderPage(); },
    todoClear() { Store.data.todos = Store.data.todos.filter(x => !x.done); Store.save(false); this.renderPage(); },
    calSel(el) { this.st.calSel = el.dataset.date; this.st.calMonth = el.dataset.date.slice(0, 7); this.renderPage(); },
    calNav(el) {
      const [y, m] = this.st.calMonth.split('-').map(Number);
      const dt = new Date(y, m - 1 + Number(el.dataset.dir), 1);
      this.st.calMonth = U.iso(dt).slice(0, 7);
      this.renderPage();
    },
    calToday() { this.st.calSel = U.today(); this.st.calMonth = this.st.calSel.slice(0, 7); this.renderPage(); },
    evAdd(el) { this.eventModal(null, el.dataset.date); },
    evEdit(el) { this.eventModal(el.dataset.id); },
    noteAdd() { this.noteModal(); },
    noteEdit(el) { this.noteModal(el.dataset.id); },
    stAdd() { this.stModal(); },
    stEdit(el, e) { e.stopPropagation(); this.stModal(el.dataset.id); },
    async stDel(el, e) {
      e.stopPropagation();
      const d = Store.data, s = d.students.find(x => x.id === el.dataset.id);
      if (!s || !(await U.confirm(`${s.name} ve tüm notları/devamsızlık kayıtları silinsin mi?`))) return;
      d.students = d.students.filter(x => x.id !== s.id);
      Store.save(true); this.renderPage(); U.toast('Öğrenci silindi');
    },
    stDetail(el) { this.stDetail(el.dataset.id); },
    stBulk() { this.stBulk(); },
    printCards() { this.printCards(); },
    yAllPresent() { document.querySelectorAll('.att-list input[value=var]').forEach(r => { r.checked = true; }); },
    yOpen(el) { this.st.yDate = el.dataset.date; this.renderPage(); },
    gPick(el) { this.onChange.gTitle.call(this, { value: el.dataset.title }); },
    odevAdd() { this.hwModal(); },
    odevEdit(el) { this.hwModal(el.dataset.id); },
    annAdd() { this.annModal(); },
    annEdit(el) { this.annModal(el.dataset.id); },
    copyUrl() { U.copy(U.siteUrl(), 'Adres kopyalandı'); },
    backup() {
      U.download(`ogretmen-yedek-${U.today()}.json`, JSON.stringify(Store.data, null, 1));
      U.toast('Yedek dosyası indirildi');
    },
    restore() { App.restoreBackup(() => { App.mounted = null; App.route(); }); },
    async resetAll() {
      if (!(await U.confirm('Bu cihazdaki TÜM verileriniz (öğrenciler, notlar, program…) kalıcı olarak silinecek. Önce yedek almanız önerilir.', 'Devam et'))) return;
      if (!(await U.confirm('Son onay: Tüm veriler silinsin mi? Bu işlem geri alınamaz.', 'Evet, hepsini sil'))) return;
      try { localStorage.removeItem(Store.KEY); } catch (e) { /* yok say */ }
      Store.load();
      App.logout();
      U.toast('Tüm veriler silindi');
    },
  },

  onChange: {
    todoToggle(el) {
      const x = Store.data.todos.find(t => t.id === el.dataset.id);
      if (!x) return;
      x.done = el.checked; x.doneAt = el.checked ? new Date().toISOString() : null;
      Store.save(false); this.renderPage();
    },
    stClass(el) { this.st.stClass = el.value; document.getElementById('st-list').innerHTML = this.studentListHtml(); },
    stShowPass(el) { this.st.showPass = el.checked; document.getElementById('st-list').innerHTML = this.studentListHtml(); },
    yClass(el) { this.st.yClass = el.value; this.renderPage(); },
    yDate(el) { if (el.value) { this.st.yDate = el.value; this.renderPage(); } },
    gClass(el) { this.st.gClass = el.value; this.renderPage(); },
    gTitle(el) {
      const title = String(el.value || '').trim();
      this.st.gTitle = title;
      const g = title && this.studentsOf(this.st.gClass).map(s => this.findGrade(s, title)).find(Boolean);
      this.st.gDate = (g && g.date) || U.today();
      this.renderPage();
      const first = document.querySelector('.score-in');
      if (first) first.focus();
    },
    gDate(el) { if (el.value) this.st.gDate = el.value; },
  },

  _scratchTimer: null,
  onInput: {
    scratch(el) {
      Store.data.scratch = el.value;
      const s = document.getElementById('scratch-state');
      if (s) s.textContent = 'Yazılıyor…';
      clearTimeout(this._scratchTimer);
      this._scratchTimer = setTimeout(() => {
        Store.save(false);
        const s2 = document.getElementById('scratch-state');
        if (s2) s2.textContent = 'Kaydedildi ✓';
      }, 500);
    },
    noteSearch(el) { this.st.noteSearch = el.value; document.getElementById('notes-list').innerHTML = this.notesListHtml(); },
    stSearch(el) { this.st.stSearch = el.value; document.getElementById('st-list').innerHTML = this.studentListHtml(); },
  },

  onSubmit: {
    todoAdd(f, form) {
      Store.data.todos.push({ id: U.uid(), text: f.text, due: f.due || '', done: false, created: new Date().toISOString() });
      Store.save(false); this.renderPage();
      const inp = document.querySelector('[data-submit=todoAdd] [name=text]');
      if (inp) inp.focus();
    },
    yoklamaSave(f) {
      const d = Store.data, date = this.st.yDate, cls = this.st.yClass;
      const counts = { yok: 0, gec: 0, izinli: 0 };
      this.studentsOf(cls).forEach(s => {
        const v = f['a_' + s.id] || 'var';
        const old = s.attendance.find(a => a.date === date);
        s.attendance = s.attendance.filter(a => a.date !== date);
        if (v !== 'var') { s.attendance.push(old && old.type === v ? old : { id: U.uid(), date, type: v, note: '' }); counts[v]++; }
      });
      d.rollcalls = d.rollcalls.filter(r => !(r.className === cls && r.date === date));
      d.rollcalls.push(Object.assign({ className: cls, date, at: new Date().toISOString() }, counts));
      Store.save(true); this.renderPage();
      U.toast(`Yoklama kaydedildi · ${counts.yok} gelmedi, ${counts.gec} geç, ${counts.izinli} izinli`);
    },
    gradesSave(f) {
      const title = this.st.gTitle, date = this.st.gDate || U.today();
      let saved = 0, removed = 0;
      const bad = [];
      const list = this.studentsOf(this.st.gClass);
      list.forEach(s => {
        const raw = f['g_' + s.id];
        if (raw == null) return;
        const score = Number(String(raw).replace(',', '.'));
        if (raw !== '' && (isNaN(score) || score < 0 || score > 100)) bad.push(s.name);
      });
      if (bad.length) return U.toast(`Puan 0–100 arasında olmalı: ${bad.join(', ')}`, 'error');
      list.forEach(s => {
        const raw = f['g_' + s.id];
        if (raw == null) return;
        const g = this.findGrade(s, title);
        if (raw === '') { if (g) { s.grades = s.grades.filter(x => x !== g); removed++; } return; }
        const score = Number(String(raw).replace(',', '.'));
        if (g) Object.assign(g, { score, date }); else s.grades.push({ id: U.uid(), title, score, date });
        saved++;
      });
      Store.save(true); this.renderPage();
      U.toast(`${saved} not kaydedildi${removed ? `, ${removed} not silindi` : ''}`);
    },
    profileSave(f) {
      const t = Store.data.teacher;
      Object.assign(t, { name: f.name, branch: f.branch, school: f.school, phone: f.phone, email: f.email, meetingHours: f.meetingHours, message: f.message, shareContact: f.shareContact });
      Store.save(true); this.renderNav(); this.renderPage(); U.toast('Profil kaydedildi');
    },
    async passChange(f, form) {
      const t = Store.data.teacher;
      if (!(await Sec.verifyPassword(f.old, t.passHash, t.passSalt))) return U.toast('Mevcut şifre hatalı.', 'error');
      if (f.pass !== f.pass2) return U.toast('Yeni şifreler aynı değil.', 'error');
      const h = await Sec.hashPassword(f.pass);
      t.passHash = h.hash; t.passSalt = h.salt;
      Store.save(false); form.reset(); U.toast('Şifreniz değiştirildi');
    },
  },
});
