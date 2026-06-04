# WhatsApp-Kanal → Homepage

Ein freies Werkzeug für **Webseitenbetreiber und Vereine**, um die Beiträge eines
öffentlichen **WhatsApp-Kanals** automatisch auf der eigenen Homepage anzuzeigen.

> Mitglieder posten wie gewohnt in WhatsApp — die Infos erscheinen zusätzlich auf
> der Website, sichtbar auch für Nicht-WhatsApp-Nutzer und Suchmaschinen.

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

## Status

**M0 — Konzept.** Vor dem ersten Code. Nächster Schritt: M1-Spike (kann
`whatsapp-web.js` mit einer Zweitnummer koppeln und Kanal-Beiträge lesen, wo
Baileys blockiert wurde?). Details und Roadmap in [KONZEPT.md](./KONZEPT.md).

## Mitmachen

Community-Beiträge willkommen — siehe [CONTRIBUTING.md](./CONTRIBUTING.md).

## Wichtiger Hinweis

Inoffizielle Automatisierung verstößt gegen die WhatsApp-Nutzungsbedingungen; die
verwendete Nummer kann gesperrt werden. **Eine dedizierte Zweitnummer
verwenden.** Keine Rechtsberatung.

## Lizenz

[MIT](./LICENSE)
