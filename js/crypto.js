'use strict';

/* Şifreleme: PBKDF2-SHA256 ile anahtar türetme + AES-GCM (tarayıcının Web Crypto API'si) */
const Sec = {
  ITER: 100000,
  te: new TextEncoder(),
  td: new TextDecoder(),

  available() { return !!(window.crypto && window.crypto.subtle); },

  b64(buf) {
    const b = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  },
  unb64(str) {
    const s = atob(str);
    const b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  },

  async sha256Hex(text) {
    const h = await crypto.subtle.digest('SHA-256', this.te.encode(text));
    return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
  },

  baseKey(password) {
    return crypto.subtle.importKey('raw', this.te.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  },

  async hashPassword(password, saltB64) {
    const salt = saltB64 ? this.unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: this.ITER }, await this.baseKey(password), 256);
    return { hash: this.b64(bits), salt: this.b64(salt) };
  },

  async verifyPassword(password, hash, salt) {
    return (await this.hashPassword(password, salt)).hash === hash;
  },

  async aesKey(password, salt, iterations) {
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iterations || this.ITER },
      await this.baseKey(password), { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },

  async encryptJSON(obj, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await this.aesKey(password, salt), this.te.encode(JSON.stringify(obj)));
    return { s: this.b64(salt), i: this.b64(iv), c: this.b64(ct) };
  },

  async decryptJSON(entry, password, iterations) {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.unb64(entry.i) }, await this.aesKey(password, this.unb64(entry.s), iterations), this.unb64(entry.c));
    return JSON.parse(this.td.decode(pt));
  },

  /* Öğrenci numarası dosyada açık yazılmaz, özetiyle aranır */
  lookupId(no) { return this.sha256Hex('ogretmenhesap|' + U.normNo(no)); },
};
