# Kaarvi Final Setup

## Local
1. Open this folder directly in VS Code (the folder containing `server.js` and `package.json`).
2. Create `.env` from `.env.example`.
3. Put your real MongoDB Atlas URI in `MONGODB_URI` and keep `MONGODB_DB=kaarvi`.
4. Run `npm install`.
5. Run `npm start`.
6. Open http://localhost:3000

## Location + language
- On first visit Kaarvi asks for location.
- **Use live location** requests browser GPS permission and reverse-geocodes the state.
- **Choose location manually** lets the user select an Indian state/UT.
- The selected state maps to the default Indian language and is stored in localStorage across Kaarvi pages.
- The header has a Location button so the user can change it later.
- The language selector remains available for manual language override.
- Kaarvi uses Google Translate's page translation layer for broad full-page translation, including dynamically created UI; Kaarvi's own key translations cover important controls.

## Render
Set these Environment Variables in Render:
- `MONGODB_URI` = your Atlas connection string
- `MONGODB_DB` = `kaarvi`
- `GEMINI_API_KEY` = your Gemini key (optional)

Do not commit `.env` or secrets to GitHub.
