# StoreWitness
**Store status, backed by observation.** Built by Victor Aguirre, solo creator.

A community prototype for people who want to check a participating store's latest signal before travelling. The operator's browser recognizes the supplied coded OPEN/CLOSED indicators. A shared customer page shows source, freshness, confirmation progress and recent changes.

## Run locally
Requires Node.js 22.13 or newer (tested on Node 26). No packages or paid API keys are needed.

Open PowerShell in this directory and run `./Start-StoreWitness.ps1`, then visit http://127.0.0.1:4330 . Keep the terminal running. Local boards persist in `data/storewitness.sqlite`, which must not be committed. `node preview.mjs` without the script uses temporary storage for QA.

1. Open Operator studio. Choose a camera board or separate replay board, then Create a demo store.
2. Expand Connect an existing store and securely save its Store ID and private pairing token. The token remains in tab memory, is not placed in the URL, and must be re-entered after reload. There is no token recovery in this prototype.
3. For rehearsal, use a replay board and Run OPEN replay. Three checks, ten seconds apart, confirm OPEN after about twenty seconds. Replay data is always labelled.
4. For a camera test, create a camera board, download a coded marker and print/display it on a second device. Enable camera, then Start observing. Use one complete, well-lit marker at least 56 pixels wide and approximately square in the frame. Generic text signs are not recognized.
5. Copy status link and open it in another browser tab on this computer. Customer pages poll every three seconds. Localhost links do not work on another person's phone or computer; a public deployment is required for that.
6. Stop observing and wait at least 35 seconds after the last observation. The public page becomes unavailable. Test an owner override and clear it; it is labelled and expires in fifteen minutes.

## What is implemented
Pixel-based coded-marker detection, three-reading confirmation, uncertainty, 35-second stale timeout, source isolation, timestamped history, expiring owner overrides, public read API, hashed pairing tokens, same-origin writes, bounded creation rate and optimistic concurrency. Camera frames remain on the operator device. The API accepts metadata only; it cannot remotely prove a paired device actually used a camera.

## Defined limits
This does not update Google Maps or use Google Business Profile. No live CCTV/RTSP connector, arbitrary object detector, OCR, trained storefront model or unattended background camera is included. Observation stops when this tab becomes hidden; keep it foreground during a demonstration. Lighting, angle, glare and occlusion need real hardware tests. Unit tests use generated marker pixels; physical webcam accuracy is not yet measured. Owner participation, field testing and stronger device identity are required before community production use. A camera-status observation is not a guarantee staff can serve a customer.

## Build and verification
`node --test` runs detector, state and SQLite-backed API tests. `node build.mjs` creates an asset-embedded Cloudflare Worker in `dist/server/index.js`. D1 binding is `DB`; schema SQL and Drizzle migration journal are in `drizzle/`. Hosted D1 migration and production behavior must be verified after deployment. Local tests do not prove seven-day reliability.

## Hosting status
The earlier Sites registration is recorded in `.openai/hosting.json`. At this handoff the connected Sites account returns project-not-found for that exact registration, so this build is not claimed publicly deployed. Preserve that ID and reconnect the original hosting account before publishing. Do not replace it with an unrelated Site. The previous PurrFlow project remains separate.

Competition entry remains unsubmitted. Present only the working scope above; no claimed audience impact or accuracy percentage has been measured.

## Animated CCTV explanation
Visit http://127.0.0.1:4330/demo or choose Watch animated demo from the home page. An illustrated outside camera, inside indicator view and customer preview explain five stages with Play/Pause, Next step and Restart. Four scenarios show Open, Closed, Uncertain and Unavailable. This page is a concept simulation and does not access camera feeds or write board data. Two-camera fusion and shutter recognition remain proposed features.
