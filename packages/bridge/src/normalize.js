'use strict';

// Engine-neutrale Abbildung einer WhatsApp-Nachricht auf einen Feed-Beitrag.
// Bewusst frei von whatsapp-web.js-Spezifika, damit ein spaeterer Wechsel auf
// einen anderen Unterbau (z. B. WAHA) das Feed-Format nicht aendert.

const URL_RE = /https?:\/\/[^\s<>"')]+/g;

function extractLinks(text) {
  if (!text) return [];
  const found = text.match(URL_RE) || [];
  return [...new Set(found)];
}

// msg: whatsapp-web.js Message; media: bereits gespeicherte Medien-Eintraege
function postFromMessage(msg, media) {
  const tsSec = msg && typeof msg.timestamp === 'number' ? msg.timestamp : null;
  const text = (msg && msg.body) || '';
  const id =
    (msg && msg.id && (msg.id._serialized || msg.id.id)) ||
    (tsSec ? String(tsSec) : String(Date.now()));
  return {
    id,
    timestamp: tsSec ? new Date(tsSec * 1000).toISOString() : null,
    text,
    media: Array.isArray(media) ? media : [],
    links: extractLinks(text),
  };
}

module.exports = { postFromMessage, extractLinks, URL_RE };
