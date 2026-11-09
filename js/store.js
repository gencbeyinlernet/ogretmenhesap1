'use strict';

/* Öğretmen verileri: yalnızca bu tarayıcının localStorage alanında tutulur */
const Store = {
  KEY: 'ogretmenHesap.v1',
  data: null,

  defaults() {
    return {
      version: 1,
      teacher: null,
      schedule: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
      todos: [],
      events: [],
      notes: [],
      scratch: '',
      students: [],
      assignments: [],
      announcements: [],
      rollcalls: [],
      meta: { changedAt: null, publishedAt: null },
    };
  },

  normalize(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const d = Object.assign(this.defaults(), src);
    d.schedule = Object.assign(this.defaults().schedule, src.schedule || {});
    for (let i = 0; i <= 6; i++) if (!Array.isArray(d.schedule[i])) d.schedule[i] = [];
    d.meta = Object.assign(this.defaults().meta, src.meta || {});
    ['todos', 'events', 'notes', 'students', 'assignments', 'announcements', 'rollcalls'].forEach(k => {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    d.students.forEach(s => {
      if (!s.id) s.id = U.uid();
      if (!Array.isArray(s.grades)) s.grades = [];
      if (!Array.isArray(s.attendance)) s.attendance = [];
    });
    if (typeof d.scratch !== 'string') d.scratch = '';
    return d;
  },

  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { /* bozuk veri */ }
    this.data = this.normalize(raw);
    return this.data;
  },

  /* forStudents: öğrencilerin göreceği bir şey değiştiyse "yayınlanmamış değişiklik" işaretlenir */
  save(forStudents) {
    if (forStudents) this.data.meta.changedAt = new Date().toISOString();
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      U.toast('Veriler kaydedilemedi! Tarayıcı depolama alanı kapalı veya dolu.', 'error');
      return false;
    }
  },

  hasTeacher() { return !!(this.data && this.data.teacher && this.data.teacher.passHash); },

  classes(includeSchedule) {
    const set = new Set(this.data.students.map(s => s.className).filter(Boolean));
    if (includeSchedule) {
      for (let i = 0; i <= 6; i++) this.data.schedule[i].forEach(s => s.className && set.add(s.className));
    }
    return [...set].sort(U.cmp);
  },

  daySlots(day) {
    return (this.data.schedule[day] || []).slice().sort((a, b) => U.toMin(a.start) - U.toMin(b.start));
  },

  unpublished() {
    const m = this.data.meta;
    return this.data.students.length > 0 && !!m.changedAt && (!m.publishedAt || m.changedAt > m.publishedAt);
  },

  /* Bir öğrencinin görebileceği verilerin tamamı (özel notlar ve veli bilgisi hariç) */
  studentPayload(s, stamp) {
    const d = this.data, t = d.teacher || {}, cls = s.className || '';
    const forMe = x => !x.className || x.className === cls;
    const schedule = {};
    for (let day = 0; day <= 6; day++) {
      const list = this.daySlots(day).filter(x => x.className && x.className === cls)
        .map(x => ({ start: x.start, end: x.end, lesson: x.lesson, room: x.room || '' }));
      if (list.length) schedule[day] = list;
    }
    return {
      v: 1,
      updated: stamp || new Date().toISOString(),
      teacher: {
        name: t.name || '', branch: t.branch || '', school: t.school || '',
        message: t.message || '', meetingHours: t.meetingHours || '',
        email: t.shareContact ? (t.email || '') : '', phone: t.shareContact ? (t.phone || '') : '',
      },
      student: { no: s.no, name: s.name, className: cls },
      grades: s.grades.map(g => ({ title: g.title, score: g.score, date: g.date || '' })),
      attendance: s.attendance.map(a => ({ date: a.date, type: a.type, note: a.note || '' })),
      assignments: d.assignments.filter(forMe).map(a => ({ title: a.title, desc: a.desc || '', due: a.due || '', className: a.className || '' })),
      announcements: d.announcements.filter(forMe).map(a => ({ title: a.title, body: a.body || '', date: a.date || '' })),
      schedule,
    };
  },
};
