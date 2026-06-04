#!/usr/bin/env node
'use strict';

// WhatsApp-Kanal -> feed.json (Phase 1: nur Lesen).
// Koppelt einmalig per QR (dedizierte Zweitnummer!), liest die Beitraege des
// eigenen Kanals und schreibt feed.json + Medien. Schreibt NIE in WhatsApp.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { postFromMessage } = require('./normalize');

const CFG = {
  // Code aus der Kanal-URL: whatsapp.com/channel/<DIESER_TEIL>
  channelInvite: process.env.CHANNEL_INVITE || '',
  // Optional direkte Kanal-ID, z. B. 1203630xxxxxxxxx@newsletter
  channelId: process.env.CHANNEL_ID || '',
  limit: parseInt(process.env.POST_LIMIT || '20', 10),
  outDir: process.env.OUT_DIR || path.resolve(__dirname, '..', 'out'),
  authDir: process.env.AUTH_DIR || path.resolve(__dirname, '..', '.wwebjs_auth'),
  intervalSec: parseInt(process.env.INTERVAL_SEC || '0', 10), // 0 = Einmal-Lauf
  headless: process.env.HEADLESS !== 'false',
};

const mediaDir = path.join(CFG.outDir, 'media');
const feedPath = path.join(CFG.outDir, 'feed.json');

function log(msg) {
  process.stdout.write(`[bridge] ${new Date().toISOString()} ${msg}\n`);
}

function ensureDirs() {
  fs.mkdirSync(mediaDir, { recursive: true });
}

function mimeExt(mime) {
  const map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'video/mp4': 'mp4', 'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3', 'application/pdf': 'pdf',
  };
  return map[mime] || (mime && mime.split('/')[1]) || 'bin';
}

function mediaType(mime) {
  if (!mime) return 'document';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

async function saveMedia(msg) {
  if (!msg || !msg.hasMedia) return [];
  try {
    const media = await msg.downloadMedia();
    if (!media || !media.data) return [];
    const ext = mimeExt(media.mimetype);
    const hash = crypto.createHash('sha1').update(media.data).digest('hex').slice(0, 16);
    const fname = `${hash}.${ext}`;
    fs.writeFileSync(path.join(mediaDir, fname), Buffer.from(media.data, 'base64'));
    return [{ type: mediaType(media.mimetype), url: `media/${fname}`, mime: media.mimetype }];
  } catch (e) {
    log(`Medien-Download fehlgeschlagen: ${e.message}`);
    return [];
  }
}

async function resolveChannel(client) {
  // 1) Direkte ID, falls gesetzt
  if (CFG.channelId) {
    try {
      const c = await client.getChatById(CFG.channelId);
      if (c) return c;
    } catch (e) {
      log(`getChatById fehlgeschlagen: ${e.message}`);
    }
  }
  // 2) Per Invite-Code (Teil aus der Kanal-URL)
  if (CFG.channelInvite && typeof client.getChannelByInviteCode === 'function') {
    try {
      const c = await client.getChannelByInviteCode(CFG.channelInvite);
      if (c) return c;
    } catch (e) {
      log(`getChannelByInviteCode fehlgeschlagen: ${e.message}`);
    }
  }
  // 3) Fallback: gefolgte Kanaele durchsuchen
  try {
    const chats = await client.getChats();
    const channels = chats.filter(
      (c) => c.isChannel || (c.id && c.id.server === 'newsletter')
    );
    log(`Gefolgte Kanaele: ${channels.map((c) => c.name).filter(Boolean).join(', ') || '(keine)'}`);
    if (channels.length === 1) return channels[0];
  } catch (e) {
    log(`getChats fehlgeschlagen: ${e.message}`);
  }
  return null;
}

async function saveChannelImage(channel) {
  try {
    if (typeof channel.getProfilePicUrl !== 'function') return null;
    const url = await channel.getProfilePicUrl();
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(CFG.outDir, 'channel.jpg'), buf);
    return 'channel.jpg';
  } catch (e) {
    log(`Kanalbild fehlgeschlagen: ${e.message}`);
    return null;
  }
}

async function syncOnce(client) {
  const channel = await resolveChannel(client);
  if (!channel) {
    log('Kein Kanal gefunden. Entweder CHANNEL_ID setzen ODER dem eigenen Kanal');
    log('einmalig auf dem gekoppelten Telefon folgen, dann erneut starten.');
    return false;
  }
  log(`Kanal: ${channel.name || '(ohne Namen)'}`);

  let messages = [];
  try {
    messages = await channel.fetchMessages({ limit: CFG.limit });
  } catch (e) {
    log(`fetchMessages fehlgeschlagen: ${e.message}`);
  }

  const posts = [];
  for (const msg of messages.slice().reverse()) { // neueste zuerst
    const media = await saveMedia(msg);
    posts.push(postFromMessage(msg, media));
  }

  const image = await saveChannelImage(channel);
  const feed = {
    channel: {
      name: channel.name || '',
      description: channel.description || '',
      image: image || null,
    },
    updatedAt: new Date().toISOString(),
    posts,
  };
  fs.writeFileSync(feedPath, JSON.stringify(feed, null, 2));
  log(`feed.json geschrieben: ${posts.length} Beitraege -> ${feedPath}`);
  return true;
}

function main() {
  ensureDirs();
  if (!CFG.channelInvite && !CFG.channelId) {
    log('Hinweis: weder CHANNEL_INVITE noch CHANNEL_ID gesetzt -> Fallback ueber gefolgte Kanaele.');
  }
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: CFG.authDir }),
    puppeteer: {
      headless: CFG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (q) => {
    log('QR scannen (WhatsApp > Einstellungen > Verknuepfte Geraete > Geraet verknuepfen):');
    qrcode.generate(q, { small: true });
  });
  client.on('auth_failure', (m) => log(`Auth-Fehler: ${m}`));
  client.on('disconnected', (r) => log(`Getrennt: ${r}`));
  client.on('ready', async () => {
    log('Verbunden.');
    try {
      await syncOnce(client);
    } catch (e) {
      log(`Sync-Fehler: ${e.message}`);
    }
    if (CFG.intervalSec > 0) {
      log(`Watch-Modus: alle ${CFG.intervalSec}s.`);
      setInterval(() => {
        syncOnce(client).catch((e) => log(`Sync-Fehler: ${e.message}`));
      }, CFG.intervalSec * 1000);
    } else {
      log('Einmal-Lauf fertig.');
      await client.destroy();
      process.exit(0);
    }
  });

  client.initialize();
}

main();
