# ATLEG-2026 Conference Report — Deploy auf Render.com

## Schritt 1 — Cloudinary Account (kostenlos, 2 Minuten)

1. Geh auf https://cloudinary.com → "Sign Up Free"
2. Nach dem Login siehst du dein **Dashboard**
3. Notiere dir diese 3 Werte:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

---

## Schritt 2 — GitHub Repository erstellen

1. Geh auf https://github.com → "New Repository"
2. Name: `atleg2026` → Public → Create
3. Lade alle Dateien aus diesem ZIP hoch:
   - Per Drag & Drop direkt in GitHub, oder
   - Mit GitHub Desktop App (einfacher)

---

## Schritt 3 — Render.com Deploy (5 Minuten)

1. Geh auf https://render.com → kostenlos anmelden
2. Klick "New +" → "Web Service"
3. Verbinde dein GitHub Repository `atleg2026`
4. Einstellungen:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Klick "Advanced" → "Add Environment Variable":
   - `CLOUDINARY_CLOUD_NAME` = dein Cloud Name
   - `CLOUDINARY_API_KEY`    = dein API Key
   - `CLOUDINARY_API_SECRET` = dein API Secret
6. Klick "Create Web Service"
7. Nach ~2 Minuten: deine URL ist `https://atleg2026.onrender.com`

---

## Schritt 4 — Eigene Domain (swex.ai/Atleg2026)

Im Render Dashboard:
1. Klick "Custom Domains" → "Add Domain"
2. Trag ein: `atleg2026.swex.ai` (Subdomain empfohlen)
3. Render gibt dir einen CNAME-Eintrag
4. Bei IONOS: DNS → neuen CNAME anlegen:
   - Host: `atleg2026`
   - Ziel: der CNAME von Render
5. Nach ~15 Minuten online!

---

## Dateistruktur

```
atleg2026/
├── index.html      ← Vollständiger Report
├── server.js       ← Node.js Backend
├── package.json    ← Dependencies
├── render.yaml     ← Render Konfiguration
├── README.md       ← Diese Anleitung
└── data/
    ├── guestbook.json   ← Gästebuch-Einträge
    └── photos.json      ← Foto-URLs (von Cloudinary)
```

## Was gespeichert wird

| Was | Wo | Persistent? |
|-----|-----|------------|
| Gästebuch-Einträge | `data/guestbook.json` | ✅ Ja (kleines JSON) |
| Fotos | Cloudinary Cloud | ✅ Ja (externe Cloud) |
| Foto-URLs | `data/photos.json` | ✅ Ja |
| Email-Adressen | `data/guestbook.json` | ✅ Ja (nie öffentlich) |

> **Hinweis:** Render Free Plan schläft nach 15 Min Inaktivität ein.
> Der erste Aufruf dauert dann ~30 Sekunden. Für dauerhaft wach:
> Render Starter Plan ($7/Monat) oder einen kostenlosen "Ping"-Service nutzen.
