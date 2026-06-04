'use strict';

// Eleventy-_data-Loader: liest ein feed.json zur Build-Zeit und stellt es als
// globale Daten bereit. Datei nach src/_data/whatsappChannel.js kopieren
// (oder per require einbinden). Pfad ueber WA_FEED_PATH konfigurierbar.
//
// Nutzung im Template (Nunjucks):
//   {% for post in whatsappChannel.posts %}
//     <p>{{ post.text }}</p>
//   {% endfor %}

const fs = require('fs');
const path = require('path');

module.exports = function () {
  const feedPath =
    process.env.WA_FEED_PATH ||
    path.resolve(process.cwd(), '.cache', 'feed.json');

  const empty = { channel: {}, updatedAt: null, posts: [] };

  try {
    if (!fs.existsSync(feedPath)) {
      console.warn(`[whatsapp-channel] feed.json nicht gefunden: ${feedPath} -> leer.`);
      return empty;
    }
    const raw = fs.readFileSync(feedPath, 'utf8');
    const feed = JSON.parse(raw);
    feed.posts = Array.isArray(feed.posts) ? feed.posts : [];
    return feed;
  } catch (e) {
    console.warn(`[whatsapp-channel] feed.json nicht lesbar: ${e.message} -> leer.`);
    return empty;
  }
};
