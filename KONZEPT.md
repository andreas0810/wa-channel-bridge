# Technisches Konzept — WhatsApp-Kanal ⇄ Website (auslesen & beschreiben)

> Stand: 2026-06-04
> Status: Konzept / vor dem ersten Code
> Autor: Andreas Trabi

## 1. Ziel

**Einen WhatsApp-Kanal automatisiert auslesen *und* beschreiben — und ihn mit
beliebigen externen Websites verbinden. Kanal ⇄ Website, „einmal posten, überall
sichtbar".**

Vereine und Organisationen nutzen WhatsApp-Kanäle, um Mitglieder und
Interessierte schnell zu erreichen. Das Projekt schließt den **kompletten Kreis**
um einen Kanal:

1. **Lesen → Anzeigen** (Phase 1, robust): Kanal-Beiträge fortlaufend abgreifen,
   in ein neutrales `feed.json` überführen und per Embed/Build-Loader auf einer
   oder mehreren externen Websites darstellen — sichtbar auch für
   Nicht-WhatsApp-Nutzer und Suchmaschinen.
2. **Schreiben → Posten** (Phase 2, experimentell): Beiträge **aus der
   Website/einem CMS/einer Automation heraus** in den Kanal veröffentlichen
   (z. B. News-Eintrag, Event-Erinnerung, Renn-Ergebnis) — ohne die WhatsApp-App
   zu öffnen.

Anforderungen, die das Ziel konkretisieren:
- **Automatisiert & bidirektional:** beide Richtungen ohne manuelles Kopieren.
- **Extern/wiederverwendbar:** Ausgabe als neutrales `feed.json` + Einbettung,
  nutzbar auf beliebigen Seiten (eigene Homepage, WordPress, statische Sites),
  über Domains hinweg (CORS).
- **Selbst-gehostet & frei:** keine erzwungene, kostenpflichtige
  Drittanbieter-Abhängigkeit.

Konkreter Auslöser: RV Waldmössingen
(`https://whatsapp.com/channel/0029Vb82qq1G8l5DBLhALK0m`) soll seine
Kanal-Beiträge auf `rv-waldmoessingen.de` anzeigen.

## 1a. Alleinstellung — was es schon gibt und die Lücke (Recherche 2026-06-04)

Die Einzelteile existieren, die **freie, selbst-gehostete, bidirektionale
Komplettlösung für Webseitenbetreiber** jedoch nicht:

| Vorhandenes | Kann | Lücke |
|---|---|---|
| **whapi.cloud** | Kanal lesen + posten (two-way) | kommerziell (~33 €/Mo), nur API (Web-Integration baust du selbst), externer SaaS (DSGVO) |
| **SociableKit** u. ä. | WhatsApp-*Status* einbetten | Status ≠ Kanal, kommerziell, kein Posten |
| **Elfsight / WidgetWhats / WP Social Ninja / OpenWidget** | „Chat-mit-uns"-Button | reine Kontakt-Buttons, kein Kanal-Feed, kein Lesen/Schreiben |
| **WAHA, whatsapp-web.js** | Kanal lesen + posten (Bausteine) | nur Infrastruktur, keine Website-Anzeige/Workflow, Channel-Funktionen teils buggy |

**Das Neue an diesem Projekt:** die Kombination aus *frei + selbst-gehostet +
bidirektional (lesen UND schreiben) + fertige Website-Einbettung + Zielgruppe
Vereine/Webseitenbetreiber* — als ein Paket. Diese Kombination existiert als
Open-Source-Produkt bislang nicht. Wir erfinden keine neue WhatsApp-Fähigkeit,
sondern füllen eine reale **Produkt-Lücke**.

## 2. Begriffsklärung (wichtig!)

WhatsApp hat drei verwandte, aber technisch unterschiedliche Funktionen:

| Funktion | Sichtbarkeit | Web-URL | Für dieses Projekt |
|---|---|---|---|
| **Kanal / Channel** | öffentlich, 1-zu-viele | `whatsapp.com/channel/<id>` | **Das ist unser Ziel** |
| **Broadcast-Liste** | privat, senderseitig | keine | nicht relevant |
| **Gruppe** | geschlossen | `chat.whatsapp.com/<id>` | nicht relevant |

Trotz Projektname „Broadcast" geht es technisch um einen **öffentlichen Kanal**.

## 3. Recherche-Ergebnisse: Was funktioniert (nicht)

Diese Wege wurden geprüft. Die Sackgassen sind dokumentiert, damit sie nicht
erneut probiert werden.

### 3.1 Öffentliche Kanal-Seite scrapen — liefert keine Posts
- `GET https://www.whatsapp.com/channel/<id>` → HTTP 200, ~150 KB HTML.
- Enthält **nur Open-Graph-Metadaten**: Kanalname, Beschreibung, Kanalbild.
- Die eigentlichen Beiträge werden **nicht** im HTML ausgeliefert — auch nicht
  nach vollständigem JavaScript-Rendering im Headless-Browser (verifiziert
  2026-06-04: `body.innerText` enthält nur Navigations-/Footer-Text, 0 Posts,
  0 `<time>`-Elemente).
- **Fazit:** Die Open-Graph-Vorschaukarte ist das Maximum ohne Login. Mehr ist
  über die öffentliche Seite nicht erreichbar. (Das nutzt die RVW-Homepage heute
  bereits über `src/_data/whatsapp.js`.)

### 3.2 Baileys (Protokoll-Reimplementierung) — blockiert
- Self-hosted Bridge auf Basis von Baileys (v6.7.23 / v7.0.0-rc13).
- WhatsApp blockt die **Companion-Registrierung inoffizieller Clients** für die
  etablierte Vereinsnummer: QR → „Verknüpfen derzeit nicht möglich";
  Pairing-Code → „Gerät konnte nicht hinzugefügt werden" (`registered:false`).
- Das offizielle `web.whatsapp.com` koppelt mit **derselben** Nummer problemlos.
- **Fazit:** Reine Anti-Unofficial-Client-Durchsetzung auf Protokollebene. Mit
  Baileys nicht umgehbar. **Nicht erneut versuchen.**

### 3.3 whapi.cloud / kommerzielle Reseller — funktioniert, kostet
- Funktioniert technisch, aber ~33 €/Monat. Für einen Verein dauerhaft zu teuer
  und schafft eine externe Abhängigkeit (DSGVO-Auftragsverarbeiter).

### 3.4 WhatsApp Business Cloud API (offiziell, Meta) — kann keine Kanäle
- Die offizielle API ist für **Konversationen mit der eigenen Business-Nummer**
  gedacht (Senden/Empfangen). **Kanäle/Channels sind nicht enthalten.**
- **Fazit:** Kein gangbarer Weg für das Auslesen fremder/eigener Kanäle.

### 3.5 whatsapp-web.js (Puppeteer-gesteuertes echtes WhatsApp Web) — der Hebel
- Steuert das **echte** WhatsApp Web in einem Headless-Chromium. Die Kopplung
  läuft **identisch** zum offiziellen `web.whatsapp.com` (das mit der
  Vereinsnummer nachweislich koppelt) — nicht über einen Protokoll-Nachbau wie
  Baileys.
- Damit ist die Wahrscheinlichkeit hoch, dass die Kopplung **nicht** wie bei
  Baileys blockiert wird.
- **Lesen von Kanälen ist vorgesehen:** Die Library hat eine `Channel`-Klasse mit
  `fetchMessages(searchOptions)` — „Loads channel messages, sorted from earliest
  to latest" (mit Limit/Sender-Filter) sowie Properties wie `lastMessage`,
  `name`, `description`, `timestamp`, `unreadCount`
  (Quelle: `docs.wwebjs.dev/Channel.html`).
- **Lücke:** Es gibt **keine** Library-Methode, um einem Kanal per Invite-Link zu
  **folgen**. Workaround: dem eigenen Kanal **einmalig manuell** auf dem
  gekoppelten Telefon folgen → danach liefert `fetchMessages()` die Beiträge.
- **Einschränkung/Risiko:** Die Kanal-/Newsletter-Unterstützung ist neuer und
  kann instabil sein (offene Issues zu Channels, z. B. 500-Fehler beim
  *Senden*); UI-Änderungen von WhatsApp können den Zugriff brechen. Jede
  inoffizielle Automation verstößt gegen die WhatsApp-Nutzungsbedingungen und
  kann zur **Sperrung der Nummer** führen → **dedizierte Zweitnummer** verwenden.

### 3.6 WAHA — WhatsApp HTTP API (selbst-gehostet) — mögliche Abkürzung
- Open-Source-Projekt `devlikeapro/waha`: kapselt WhatsApp Web als
  **HTTP-REST-API** in **Docker**, QR-Kopplung, drei Engines (WEBJS = Browser,
  NOWEB = Node/WebSocket, GOWS = Go). Fährt eine echte WhatsApp-Web-Instanz, um
  Blocks zu vermeiden. Channel-/Newsletter-Support ist enthalten.
- **Vorteil:** Spart den Aufbau einer eigenen Bridge — das Projekt müsste dann
  nur den **Feed-Konverter** (REST → `feed.json`) und das **Embed/Widget** bauen.
- **Zu prüfen (M1):** (a) Lizenz/Funktionsumfang — WAHA ist Open-Core, einzelne
  Channel-Funktionen können „WAHA Plus" (kostenpflichtig) sein; (b) ob das
  *Lesen* von Kanal-Beiträgen in der freien Core-Variante geht; (c) Stabilität
  der Channel-Endpunkte (offene Issues vorhanden).
- **Hinweis Landschaft:** Vorhandene „whatsapp-scraper"-Projekte auf GitHub
  (Selenium-basiert) zielen auf **Chats**, nicht auf **Kanäle** — für unser Ziel
  also nicht direkt nutzbar, bestätigen aber die Lücke.

## 4. Lösungsstrategie

Weil WhatsApp seitens Meta aktiv erschwert wird, setzt das Projekt auf **drei
Betriebsarten**. Betreiber wählen je nach Richtung, Risiko und Komfort.

### Modus A (empfohlen, primär): Kanal-Spiegel
„WhatsApp bleibt die Quelle." Ein selbst-gehosteter Dienst folgt dem Kanal mit
einer dedizierten Nummer, liest neue Beiträge (`fetchMessages()`) und stellt sie
als JSON-Feed bereit. Die Website konsumiert den Feed.

Zwei Umsetzungsvarianten (M1 entscheidet):
- **A1 — eigene Bridge** direkt auf `whatsapp-web.js` (volle Kontrolle, schlank).
- **A2 — auf WAHA aufsetzen** (Docker-REST-API als Unterbau, wir bauen nur
  Feed-Konverter + Embed). Schneller, falls Channel-Lesen in WAHA Core läuft.

- **Pro:** Mitglieder posten wie gewohnt in WhatsApp; Homepage aktualisiert sich
  automatisch. Kostenlos, selbst gehostet, datensparsam.
- **Contra:** Best-Effort. ToS-Risiko (Nummernsperre), kann durch
  WhatsApp-Änderungen brechen. Braucht einen kleinen Always-on-Host
  (Raspberry Pi / kleiner VPS / Docker).

### Modus B (robust, Fallback): Homepage als Quelle (Push)
„Einmal posten, überall anzeigen." Ein winziges Admin-Formular schreibt einen
Beitrag, der sofort auf der Website erscheint — und optional als fertiger Text
in WhatsApp geteilt werden kann (Deep-Link/Copy).

- **Pro:** Vollkommen regelkonform, keine Sperrgefahr, 100 % zuverlässig, kein
  Always-on-WhatsApp-Client nötig.
- **Contra:** Workflow ändert sich (erst Formular, dann WhatsApp), nicht „nur
  WhatsApp".

### Modus C (experimentell, Phase 2): Website → Kanal posten („beschreiben")
Die zweite Richtung des Kreises. Beiträge werden **aus der Website / einem CMS /
einer Automation** in den Kanal veröffentlicht — über denselben
gekoppelten Client (`sendMessage` an die Newsletter-JID via whatsapp-web.js bzw.
WAHA-Channel-Endpunkt). Anwendungsfälle: News-Eintrag der Homepage spiegelt sich
in den Kanal, Event-Erinnerungen, RSS/Ergebnisse → Kanal.

- **Pro:** Echte Bidirektionalität, „einmal posten, überall sichtbar"; der
  Verein pflegt nur eine Quelle.
- **Contra/Risiko:** **Fragilster Teil.** Posten in Kanäle ist über inoffizielle
  Clients buggy (WAHA-Issue: Senden an `@newsletter` → 500/verworfen;
  Medien-Senden fällt aus — **Text** am stabilsten). Aktives automatisiertes
  Posten erhöht das **Sperr-Risiko** gegenüber reinem Lesen. Nur **eigene**
  Kanäle (man muss Admin sein). → Erst nach stabilem Modus A, mit Zweitnummer,
  zunächst nur Text, mit manueller Freigabe.

> Empfehlung & Phasen: **Phase 1** = Modus A (lesen+anzeigen) als robustes
> Kernfeature, plus Modus B als immer funktionierende Rückfallebene. **Phase 2** =
> Modus C (posten) als experimentelle Erweiterung, sobald Phase 1 stabil läuft.
> So ist das Projekt sofort nützlich und wird zur bidirektionalen Komplettlösung,
> ohne am fragilsten Teil zu scheitern.

## 5. Architektur (Modus A)

```
 ┌──────────────┐    folgt    ┌─────────────────────┐   schreibt   ┌────────────┐
 │ WhatsApp-     │ ─────────▶ │  Bridge-Service     │ ───────────▶ │ feed.json  │
 │ Kanal         │            │  (Node + whatsapp-  │              │ (+ Bilder) │
 │ (öffentlich)  │            │   web.js, headless) │              └─────┬──────┘
 └──────────────┘            └─────────┬───────────┘                    │
                                       │ REST/statisch                  │ liest
                                       ▼                                ▼
                              ┌─────────────────┐            ┌────────────────────┐
                              │  Feed-API       │ ◀───────── │  Embed-Widget /     │
                              │  /api/posts     │   HTTP     │  Eleventy _data     │
                              └─────────────────┘            │  (Homepage)         │
                                                             └────────────────────┘
```

### Komponenten
1. **Bridge-Service** (Node.js, `whatsapp-web.js`)
   - Einmalige Kopplung per QR-Code (dedizierte Nummer).
   - Session persistent (`LocalAuth`), Auto-Reconnect.
   - Pollt/empfängt neue Kanal-Beiträge, normalisiert sie, lädt Medien lokal.
   - Schreibt `feed.json` und legt Bilder in `media/` ab.
2. **Feed-Ausgabe** — zwei austauschbare Varianten:
   - **Statisch:** nur `feed.json` + `media/` (per FTP/Sync auf Webspace).
   - **API:** kleiner HTTP-Server (`/api/posts`, `/api/posts/:id`) mit CORS +
     Cache-Header, falls dynamisch gewünscht.
3. **Einbindung in die Website** — zwei Varianten:
   - **Build-Zeit:** Eleventy-`_data`-Loader liest `feed.json` → statisches HTML
     (passt zur bestehenden RVW-Architektur, beste Performance/DSGVO).
   - **Client-seitig:** `embed.js` Web-Component `<wa-channel-feed src="...">`
     für beliebige CMS (WordPress etc.) ohne Build.

### Datenmodell (ein Beitrag)
```json
{
  "id": "string (stabile Kanal-Message-ID)",
  "timestamp": "ISO-8601",
  "text": "string (Markdown-sicher escaped)",
  "media": [
    { "type": "image|video|document", "url": "media/<hash>.jpg", "mime": "..." }
  ],
  "links": ["https://..."],
  "raw": { "...optional, Rohfelder zum Debuggen..." }
}
```
`feed.json` = `{ "channel": {name, description, image}, "updatedAt": ISO,
"posts": [ ...neueste zuerst, konfigurierbares Limit... ] }`

### Betrieb / Deployment
- Zielplattformen: **Docker** (empfohlen), Raspberry Pi, kleiner VPS, oder lokal
  als `launchd`/`systemd`-Dienst.
- Ressourcen: 1 vCPU / ~512 MB–1 GB RAM (Chromium headless).
- Persistenz: Volume für WhatsApp-Session + `media/`.
- Healthcheck + Auto-Restart; QR-Re-Pairing-Hinweis per Log/Notification.

## 6. Sicherheit & Datensparsamkeit
- Bridge bindet nur an `127.0.0.1`, Veröffentlichung via statischem Sync oder
  Reverse-Proxy mit Token.
- Keine personenbezogenen Daten Dritter speichern, die über den Kanalinhalt
  hinausgehen.
- Medien lokal hosten (kein Hotlinking auf `mmg.whatsapp.net`) → DSGVO + Stabil.
- Konfigurierbares Beitragslimit / Aufbewahrungsdauer.

## 7. Rechtliches / Hinweise (keine Rechtsberatung)
- Inoffizielle Automatisierung verstößt gegen die **WhatsApp-Nutzungs-
  bedingungen**; die genutzte Nummer kann gesperrt werden → **Zweitnummer**.
- Nur **öffentliche, eigene** Kanäle spiegeln; Urheber-/Persönlichkeitsrechte an
  geteilten Inhalten beachten.
- Im Website-Datenschutz transparent machen, dass Inhalte aus dem eigenen
  WhatsApp-Kanal gespiegelt werden.

## 8. Roadmap / Meilensteine
- **M0 — Konzept** (dieses Dokument). ✅
- **M1 — Spike:** Mit Zweitnummer koppeln, dem eigenen Kanal folgen, via
  `fetchMessages()` Beiträge als JSON dumpen. Zwei Fragen klären:
  (1) Geht die Kopplung durch (anders als Baileys)?
  (2) A1 (eigene whatsapp-web.js-Bridge) oder A2 (WAHA als Unterbau)?
  → Go/No-Go für Modus A + Wahl der Variante.
- **M2 — Bridge:** persistenter Dienst, `feed.json` + Medien-Download, Docker.
- **M3 — Einbindung:** Eleventy-`_data`-Loader + Web-Component `embed.js`.
- **M4 — Modus B:** Mini-Admin-Push als regelkonformer Fallback.
- **M5 — Doku/Community:** Setup-Guide, `CONTRIBUTING`, Issue-Templates,
  Beispiel-Deployment für RV Waldmössingen als Referenz.
- **M6 — Modus C (Phase 2):** Posten Website → Kanal, zunächst nur Text, mit
  manueller Freigabe. Spike: Text via `sendMessage` an Newsletter-JID. Erst nach
  stabilem M2.

## 9. Repo-Struktur (geplant)
```
/
├─ README.md
├─ KONZEPT.md                ← dieses Dokument
├─ LICENSE                   ← MIT
├─ CONTRIBUTING.md
├─ packages/
│  ├─ bridge/                ← Node-Dienst (whatsapp-web.js), Dockerfile
│  ├─ embed/                 ← <wa-channel-feed> Web-Component
│  └─ eleventy-data/         ← _data-Loader für 11ty
├─ examples/
│  └─ rvw-waldmoessingen/    ← Referenz-Einbindung
└─ docs/
```

## 10. Offene Fragen
1. Geht die whatsapp-web.js-Kopplung mit einer **Zweitnummer** durch? (M1-Spike)
2. Liest `fetchMessages()` **Kanal-Beiträge** zuverlässig (nicht nur Chats)?
3. A1 (eigene Bridge) oder A2 (WAHA als Unterbau)? Channel-Lesen in WAHA Core?
4. Statischer Sync oder kleiner API-Server für die Feed-Ausgabe?
5. Welche Always-on-Hardware steht bereit (Pi / vorhandener Mac-Dienst / VPS)?

## 11. Quellen (Recherche 2026-06-04)
- whatsapp-web.js — `Channel`-Klasse, `fetchMessages()`:
  https://docs.wwebjs.dev/Channel.html
- whatsapp-web.js — Repo: https://github.com/pedroslopez/whatsapp-web.js
- WAHA (WhatsApp HTTP API, selbst-gehostet, Docker, Channel-Support):
  https://waha.devlike.pro/ · https://github.com/devlikeapro/waha
- WAHA Issue zu Channel-Bugs (Senden, WEBJS-Engine):
  https://github.com/devlikeapro/waha/issues/1863
- Bestehende GitHub-„whatsapp-scraper" (Selenium, nur Chats — nicht Kanäle):
  https://github.com/topics/whatsapp-scraper
