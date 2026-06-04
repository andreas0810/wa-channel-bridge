# Embed — `<wa-channel-feed>`

Abhängigkeitsfreies Web-Component, das ein `feed.json` (von der Bridge erzeugt)
auf **jeder** Website anzeigt. Kein Framework, kein Tracking, Shadow DOM.

## Verwendung
```html
<wa-channel-feed src="/pfad/zu/feed.json" limit="10" locale="de-DE"></wa-channel-feed>
<script src="/pfad/zu/wa-channel-feed.js"></script>
```

| Attribut | Bedeutung | Default |
|---|---|---|
| `src` | URL zu `feed.json` (relative Medien-Pfade werden dazu aufgelöst) | — |
| `limit` | max. angezeigte Beiträge (0 = alle) | `0` |
| `locale` | Sprache für relative Zeitangaben | `de-DE` |

Liegt `feed.json` auf einer anderen Domain, muss diese **CORS** erlauben
(`Access-Control-Allow-Origin`).

## Lokale Demo
```bash
cd packages/embed
python3 -m http.server 8099
# http://localhost:8099/demo.html öffnen
```

## Styling
Die Styles stecken im Shadow DOM (Klassen `wacf-*`). Anpassen direkt in
`wa-channel-feed.js` im `STYLE`-Block, oder das Component forken. Eine
CSS-Custom-Property-Schnittstelle ist als spätere Erweiterung vorgesehen.

## Alternative: Build-Zeit statt Client-seitig
Für statische Seiten (z. B. Eleventy) gibt es den Loader unter
`../eleventy-data/whatsapp-channel.js`, der `feed.json` schon beim Build einliest
— beste Performance und DSGVO (kein Client-Fetch).
