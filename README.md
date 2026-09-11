# Kaarvi SIH 2026 — Ready-to-run Prototype

Kaarvi is an SIH 2026 prototype for artisan market linkage and smart cataloguing.

## Features
- Working Express server for local development and Render.
- Help chatbot at `chatbot.html`.
  - Works in demo mode with **no API key**.
  - Uses Gemini when `GEMINI_API_KEY` is configured.
  - Replies in English, Hindi, Bengali, Tamil, Telugu or Marathi.
- Multilingual UI selector with persistent language preference.
- MongoDB-ready account flow: users are stored in Atlas when `MONGODB_URI` is configured; local browser demo fallback remains available.
- Dynamic Pricing calculator based on material cost, making cost, demand, uniqueness, season and batch quantity.
- Buyers catalogue + search + category filters + cart.
- PWA manifest + service worker, suitable for PWA Builder after the website is deployed over HTTPS.
- MongoDB Node.js driver is included; Render environment variables are read directly from `process.env` (no `dotenv` required).

## Run locally
1. Install Node.js 20+.
2. Open this project folder in VS Code.
3. Open Terminal in this exact folder.
4. Run:
   `npm install`
5. Start:
   `npm start`
6. Open:
   `http://localhost:3000`

## MongoDB Atlas
1. In MongoDB Atlas, create a database user and allow the deployment IP/network access required by your setup.
2. Copy the Atlas Node.js connection string.
3. Set `MONGODB_URI` to that full connection string and set `MONGODB_DB` to `kaarvi`.
4. Never commit the real URI/password. Use Render Environment Variables for deployment.

The server automatically creates indexes for users, orders and reviews. Passwords are stored as salted scrypt hashes, not plaintext.

## Optional Gemini AI
Create a Gemini API key and set it as:
`GEMINI_API_KEY=...`

Do NOT put the real key inside HTML/JavaScript and do NOT commit `.env`.

Without the key, the Help page still works using the built-in multilingual demo assistant.

## Deploy to Render
- Create a new Web Service from this project/repository.
- Runtime: Node.
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Add Environment Variables:
  - `MONGODB_URI` = your MongoDB Atlas connection string
  - `MONGODB_DB` = `kaarvi`
  - `GEMINI_API_KEY` = your Gemini API key (optional)
- Render provides `PORT`; the server already uses it.

`render.yaml` is included as a deployment blueprint.

## PWA Builder
After Render gives you an HTTPS URL:
1. Open PWA Builder.
2. Enter the Render HTTPS URL.
3. The project includes `manifest.webmanifest` and `sw.js`.
4. Generate/test the PWA package.

The app is designed to keep frontend assets and API calls same-origin, which avoids common CORS problems.

## Important prototype note
Payment remains a prototype flow. When MongoDB is configured, account, order-request and review records are persisted in Atlas. This is still a hackathon prototype, not production authentication, payment processing or a live government service.
