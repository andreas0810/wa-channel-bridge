# WhatsApp-Kanal → externe Websites

**Ziel:** Beiträge eines öffentlichen **WhatsApp-Kanals automatisiert abgreifen
und auf beliebigen externen Websites darstellen.**

Ein freies, selbst-gehostetes Werkzeug für **Webseitenbetreiber, Vereine und
Organisationen**: Der Kanal wird automatisch ausgelesen, in ein neutrales Format
(`feed.json`) überführt und kann per Embed-Widget oder Build-Loader in jede
beliebige Seite (eigene Homepage, WordPress, statische Sites …) eingebunden
werden — ohne manuelles Kopieren, fortlaufend aktuell.

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
