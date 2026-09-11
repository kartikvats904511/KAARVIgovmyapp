# Kaarvi language/location enhancement

- Supports 12 Indian languages.
- Uses a saved manual language choice first.
- Otherwise uses the device/browser language.
- On HTTPS deployments (such as Render), it can request location permission and use a lightweight state/city coordinate hint to select an Indian language.
- If location is denied/unavailable, the browser language remains the fallback.
- No API key or paid translation service is required.
- Works with the existing PWA manifest/service worker and can be packaged by PWA Builder.

Note: GPS cannot reliably identify an exact district/state without a reverse-geocoding service. This build intentionally uses a privacy-friendly approximate coordinate hint. The manual language selector remains available for accuracy.
