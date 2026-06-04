/*
 * <wa-channel-feed src="feed.json" limit="10" locale="de-DE">
 * Zeigt einen WhatsApp-Kanal-Feed (feed.json) auf einer beliebigen Website.
 * Abhaengigkeitsfrei, Shadow DOM, kein Tracking. MIT-Lizenz.
 */
(function () {
  'use strict';

  const URL_RE = /https?:\/\/[^\s<>"')]+/g;

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // Text escapen, Zeilenumbrueche erhalten, URLs verlinken.
  function renderText(text) {
    const escaped = escapeHtml(text);
    const linked = escaped.replace(URL_RE, (u) => {
      const safe = u.replace(/&amp;/g, '&'); // href roh, Anzeige escaped
      return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${u}</a>`;
    });
    return linked.replace(/\n/g, '<br>');
  }

  function relTime(iso, locale) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diff = (Date.now() - d.getTime()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const units = [
      ['year', 31536000], ['month', 2592000], ['day', 86400],
      ['hour', 3600], ['minute', 60],
    ];
    for (const [unit, secs] of units) {
      if (Math.abs(diff) >= secs || unit === 'minute') {
        return rtf.format(-Math.round(diff / secs), unit);
      }
    }
    return '';
  }

  function mediaHtml(media, base) {
    if (!Array.isArray(media) || !media.length) return '';
    return media.map((m) => {
      const url = resolveUrl(m.url, base);
      if (m.type === 'image') {
        return `<img class="wacf-media" loading="lazy" src="${escapeHtml(url)}" alt="">`;
      }
      if (m.type === 'video') {
        return `<video class="wacf-media" controls preload="none" src="${escapeHtml(url)}"></video>`;
      }
      return `<a class="wacf-file" href="${escapeHtml(url)}" target="_blank" rel="noopener">Anhang</a>`;
    }).join('');
  }

  function resolveUrl(url, base) {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    try { return new URL(url, base).href; } catch { return url; }
  }

  const STYLE = `
    :host { display:block; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#111; }
    .wacf-head { display:flex; align-items:center; gap:.6rem; margin-bottom:.8rem; }
    .wacf-head img { width:44px; height:44px; border-radius:50%; object-fit:cover; }
    .wacf-name { font-weight:600; }
    .wacf-desc { font-size:.85rem; color:#555; }
    .wacf-post { padding:.8rem 0; border-top:1px solid #eee; }
    .wacf-text { white-space:normal; line-height:1.45; }
    .wacf-text a { color:#128c7e; }
    .wacf-time { font-size:.75rem; color:#888; margin-top:.35rem; }
    .wacf-media { display:block; max-width:100%; border-radius:8px; margin-top:.5rem; }
    .wacf-empty, .wacf-error { color:#888; font-size:.9rem; padding:.5rem 0; }
    .wacf-error { color:#b00; }
  `;

  class WaChannelFeed extends HTMLElement {
    static get observedAttributes() { return ['src', 'limit', 'locale']; }

    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.render('<div class="wacf-empty">Lade Kanal-Feed …</div>');
      this.load();
    }

    attributeChangedCallback() { if (this.isConnected) this.load(); }

    render(inner) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>${inner}`;
    }

    async load() {
      const src = this.getAttribute('src');
      if (!src) { this.render('<div class="wacf-error">Kein src gesetzt.</div>'); return; }
      const locale = this.getAttribute('locale') || 'de-DE';
      const limit = parseInt(this.getAttribute('limit') || '0', 10);
      const base = new URL(src, location.href).href;
      try {
        const res = await fetch(src, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const feed = await res.json();
        const posts = (feed.posts || []).slice(0, limit > 0 ? limit : undefined);
        const ch = feed.channel || {};
        const head = `
          <div class="wacf-head">
            ${ch.image ? `<img src="${escapeHtml(resolveUrl(ch.image, base))}" alt="">` : ''}
            <div>
              <div class="wacf-name">${escapeHtml(ch.name || 'WhatsApp-Kanal')}</div>
              ${ch.description ? `<div class="wacf-desc">${escapeHtml(ch.description)}</div>` : ''}
            </div>
          </div>`;
        const body = posts.length
          ? posts.map((p) => `
              <article class="wacf-post">
                <div class="wacf-text">${renderText(p.text)}</div>
                ${mediaHtml(p.media, base)}
                <div class="wacf-time">${escapeHtml(relTime(p.timestamp, locale))}</div>
              </article>`).join('')
          : '<div class="wacf-empty">Noch keine Beitraege.</div>';
        this.render(head + body);
      } catch (e) {
        this.render(`<div class="wacf-error">Feed konnte nicht geladen werden: ${escapeHtml(e.message)}</div>`);
      }
    }
  }

  if (!customElements.get('wa-channel-feed')) {
    customElements.define('wa-channel-feed', WaChannelFeed);
  }
})();
