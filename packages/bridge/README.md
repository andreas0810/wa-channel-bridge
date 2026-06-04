# Bridge — WhatsApp-Kanal → feed.json (Phase 1, nur Lesen)

Koppelt einmalig per QR-Code mit WhatsApp, liest die Beiträge deines **eigenen**
Kanals und schreibt sie als `out/feed.json` (+ `out/media/`). Schreibt **nie** in
WhatsApp.

> **Wichtig:** Inoffizielle Automatisierung verstößt gegen die
> WhatsApp-Nutzungsbedingungen; die Nummer kann gesperrt werden. **Eine dedizierte
> Zweitnummer verwenden, nicht die Vereinsnummer.**

## Voraussetzungen
- Node.js >= 20
- Eine Zweitnummer mit WhatsApp, die dem Kanal **folgt** (einmal in der App auf
  „Folgen" tippen — die Bridge kann Kanälen nicht selbst folgen).

## Einrichtung
```bash
cd packages/bridge
npm install            # lädt auch Chromium für Puppeteer (einmalig, größer)
cp .env.example .env   # CHANNEL_INVITE eintragen (Teil aus der Kanal-URL)
npm run once           # startet, zeigt QR-Code im Terminal
```
1. QR mit der **Zweitnummer** scannen (WhatsApp > Verknüpfte Geräte).
2. Mit derselben Nummer dem Kanal **folgen** (falls noch nicht geschehen).
3. `npm run once` erneut ausführen → `out/feed.json` wird geschrieben.

## Konfiguration (`.env`)
| Variable | Bedeutung | Default |
|---|---|---|
| `CHANNEL_INVITE` | Code aus `whatsapp.com/channel/<CODE>` | — |
| `CHANNEL_ID` | Alternativ direkte ID `…@newsletter` | — |
| `POST_LIMIT` | max. Beiträge | `20` |
| `INTERVAL_SEC` | `0` = einmal; `>0` = Watch-Modus (Sekunden) | `0` |
| `OUT_DIR` / `AUTH_DIR` | Ausgabe- / Session-Ordner | `./out`, `./.wwebjs_auth` |
| `HEADLESS` | `false` zeigt Browser (Debug) | `true` |

## Dauerbetrieb
```bash
npm run watch          # alle 300s aktualisieren
```
Oder als Dienst (launchd/systemd) bzw. Docker (siehe `Dockerfile`). Den Inhalt
von `out/` per Sync/FTP auf den Webspace legen — das Embed-Widget liest
`feed.json`.

## Status / bekannte Grenzen
- Kanal-Support in whatsapp-web.js ist neuer und kann brechen (WhatsApp-Updates).
- Wenn kein Kanal gefunden wird: `CHANNEL_ID` setzen **oder** sicherstellen, dass
  die Nummer dem Kanal folgt.
- `feed.json`, `media/`, `out/` und die Session sind in `.gitignore` — niemals
  committen.
