# Ideal House – website (NL + EN)

The finished website is in `../site/`. Upload that folder to your host (Vercel: set `site` as the root directory).

- Dutch pages: `/`, `/diensten/...`, `/projecten`, ...
- English pages: `/en`, `/en/services/...`, `/en/projects`, ...

## Changing text or photos
1. Dutch text: `data.js` · English text: `data-en.js` · photo captions (both languages): `photos.js`.
2. Page layouts: `build.js` · design: `src/style.css`.
3. New photos: put them in `../pic/`, add them to `photos.js`, then run `node images.js`.
4. Rebuild: `node build.js`

Requires Node.js. Run `npm install` once in this folder.
