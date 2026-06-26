# GeoViz — Deployment Guide

## What changed from your original files

- **Static files moved into `public/`** — Vercel ignores `express.static()` in
  production and serves anything in `public/**` directly from its CDN instead.
  `index.html`, `admin.html`, `login.html`, `logo.png`, `css/`, and `js/` all
  live there now.
- **`server.js` now reads secrets from environment variables** (`DB_HOST`,
  `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_SSL`, `JWT_SECRET`)
  instead of having `localhost` / a hardcoded JWT secret baked in.
- **MySQL connection uses a pool** (`mysql.createPool`) instead of a single
  `createConnection` — serverless functions can spin up many concurrent
  invocations, and a pool handles that far better than one shared connection.
- **`server.js` exports the Express app** (`module.exports = app`) so Vercel
  can run it as a function, while still supporting `node server.js` /
  `npm start` for local development.
- **Frontend JS now calls relative paths** (`/login`, `/places`, `/add-place`)
  instead of `http://localhost:3000/...`, so the same code works locally and
  in production, on whatever domain Vercel gives you.
- **Added `public/css/style.css`** — `admin.html` and `index.html` reference
  `css/style.css`, but it wasn't in your upload, so I added a basic
  placeholder. Replace it with your real one if you have it.

## Project structure

```
geoviz/
├── server.js
├── package.json
├── .env.example
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── logo.png
│   ├── css/style.css
│   └── js/
│       ├── config.js
│       ├── map-init.js
│       ├── admin.js
│       ├── login.js
│       └── user.js
```

## 1. Push to GitHub

```bash
cd geoviz
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Create the empty repo on GitHub first if you haven't — green "New" button on
github.com, no README/license, since you already have files.)

## 2. Get a cloud-hosted MySQL database

Vercel functions are stateless and run in the cloud — they can't reach a
`localhost` MySQL on your machine. You need a database that's reachable over
the internet. As of mid-2026, PlanetScale's free tier is gone (cheapest plan
is $5/mo), so free MySQL-compatible options worth a look are:

- **TiDB Serverless** (tidbcloud.com) — free tier, MySQL-compatible, requires TLS.
- **Aiven** (aiven.io) — 1 GB MySQL, free.
- **Railway** (railway.app) — cheap usage-based MySQL, small free credit.

Whichever you pick, you'll get a host, port, username, password, and database
name — that's what goes into the environment variables below.

Once you have it, connect with any MySQL client and run:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user'
);

CREATE TABLE places (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  type VARCHAR(50)
);

INSERT INTO users (username, password, role) VALUES ('admin', 'changeme', 'admin');
```

> ⚠️ **Heads up:** the current login code compares passwords as plain text
> (`WHERE username = ? AND password = ?`). That's fine to get deployed and
> working, but before this goes anywhere near real users, switch to hashing
> passwords with `bcrypt` — happy to do that pass whenever you're ready.

## 3. Import the project into Vercel

1. Go to vercel.com → **Add New → Project**.
2. Import the GitHub repo you just pushed.
3. Framework preset: leave as **Other** (Vercel auto-detects Express — zero
   config needed since `server.js` exports the app).
4. Before clicking Deploy, expand **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `DB_HOST` | your DB host |
   | `DB_USER` | your DB user |
   | `DB_PASSWORD` | your DB password |
   | `DB_NAME` | your DB name |
   | `DB_PORT` | your DB port (often `3306` or `4000` for TiDB) |
   | `DB_SSL` | `true` (most hosted MySQL needs this) |
   | `JWT_SECRET` | any long random string |

5. Click **Deploy**.

Vercel will give you a `your-project.vercel.app` URL. `/`, `/login.html`,
`/admin.html` etc. are served straight from `public/`, and `/login`,
`/places`, `/add-place` hit your Express routes — all on the same domain, so
no CORS issues.

## 4. Redeploys

Any `git push` to `main` triggers an automatic redeploy. Pushes to other
branches get their own preview URL.

## Local development

```bash
cp .env.example .env   # fill in real values
npm install
npm start               # http://localhost:3000
```

## Note on `dz.json`

It's a large (6.5 MB) GeoJSON file. Looking at `user.js`, your app currently
loads GeoJSON via the manual file-upload input on the map page — it isn't
fetched automatically. If you want `dz.json` to load by default instead of
requiring an upload, drop it into `public/` and add a `fetch('/dz.json')`
call in `user.js`; otherwise you don't need to deploy it at all.
