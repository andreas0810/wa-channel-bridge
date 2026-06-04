# WhatsApp-Kanal ⇄ Website

**Ziel:** Einen öffentlichen **WhatsApp-Kanal automatisiert auslesen *und*
beschreiben** — und ihn mit beliebigen externen Websites verbinden.
„Einmal posten, überall sichtbar."

Ein freies, selbst-gehostetes Werkzeug für **Webseitenbetreiber, Vereine und
Organisationen**:
- **Lesen → Anzeigen:** Kanal wird automatisch ausgelesen, in ein neutrales
  Format (`feed.json`) überführt und per Embed-Widget oder Build-Loader in jede
  Seite (Homepage, WordPress, statische Sites …) eingebunden — fortlaufend.
- **Schreiben → Posten** (Phase 2): Beiträge aus Website/CMS/Automation in den
  Kanal veröffentlichen, ohne die WhatsApp-App zu öffnen.

**Warum neu?** Die Einzelteile existieren, die *freie, selbst-gehostete,
bidirektionale* Komplettlösung für Webseitenbetreiber nicht — die einzige
vergleichbare (whapi.cloud) ist kommerziell, API-only und extern. Details in
[KONZEPT.md §1a](./KONZEPT.md).

> Mitglieder/Redaktion posten wie gewohnt in WhatsApp — die Infos erscheinen
> automatisch auch auf der/den Website(s), sichtbar für Nicht-WhatsApp-Nutzer und
> Suchmaschinen.

## Warum?

Es gibt keine fertige, kostenlose Schnittstelle, die einen öffentlichen
WhatsApp-Kanal ausliest und in eine Website einbettet. WhatsApp erschwert das
Auslesen aktiv (kein offizielles Channel-API, inoffizielle Clients werden
blockiert). Dieses Projekt sammelt die funktionierenden Wege und macht sie als
nachnutzbares, selbst-gehostetes Werkzeug verfügbar.

Die vollständige Analyse und Architektur steht in **[KONZEPT.md](./KONZEPT.md)**.

## Ansatz (Kurzfassung)

- **Modus A — Kanal-Spiegel (empfohlen):** Ein selbst-gehosteter Dienst auf Basis
  von [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) folgt
  dem Kanal mit einer dedizierten Nummer, liest neue Beiträge und stellt sie als
  `feed.json` bereit. Ein Embed-Widget bzw. ein Eleventy-Loader bringt sie auf die
  Seite.
- **Modus B — Push-Fallback (robust):** Ein kleines Admin-Formular als regel-
  konforme Rückfallebene, falls der Spiegel-Weg ausfällt.
- **Modus C — Posten (experimentell, Phase 2):** Beiträge aus Website/CMS in den
  Kanal veröffentlichen (`sendMessage`/WAHA). Fragilster Teil, erst nach Phase 1.

## Status

**Phase 1 begonnen (M1/M3).** Kein Schreiben. Vorhanden und getestet:
- [`packages/bridge`](./packages/bridge) — liest Kanal → `feed.json` (whatsapp-web.js, A1). Bereit zum Koppeln mit einer Zweitnummer.
- [`packages/embed`](./packages/embed) — `<wa-channel-feed>` zeigt den Feed; im Browser gegen `sample-feed.json` verifiziert ([Screenshot](./docs/demo-screenshot.png)).
- [`packages/eleventy-data`](./packages/eleventy-data) — Build-Zeit-Loader für 11ty.

**Offener Go/No-Go-Punkt:** koppelt eine **Zweitnummer** durch und liefert
`fetchMessages()` echte Beiträge (dort, wo Baileys blockiert wurde)? Das erfordert
eine reale Nummer + Telefon. Details/Roadmap in [KONZEPT.md](./KONZEPT.md).

## Mitmachen

Community-Beiträge willkommen — siehe [CONTRIBUTING.md](./CONTRIBUTING.md).

## Wichtiger Hinweis

Inoffizielle Automatisierung verstößt gegen die WhatsApp-Nutzungsbedingungen; die
verwendete Nummer kann gesperrt werden. **Eine dedizierte Zweitnummer
verwenden.** Keine Rechtsberatung.

## Lizenz

[MIT](./LICENSE)
