# StoreWitness comprehensive quality review

Reviewed 12 November 2026. Creator: Victor Aguirre. Product: StoreWitness.

## Verdict

Suitable for a clearly scoped local hackathon rehearsal. Not ready for a public community rollout or a claim of unattended two-camera CCTV automation. A polished animation is available, but the running detector recognizes controlled coded markers from one webcam. No measured physical-camera accuracy, real-store pilot, or seven-day reliability result exists.

## Evidence checked in this review

- Re-ran 40 tests: 22 pixel-detector tests, 13 state tests, 5 SQLite-backed API tests. All passed. Added coverage for malformed/non-object JSON and board creation limits.
- Built the Worker and checked JavaScript syntax. Verified generated logo loads in the browser and visible old creator credit is absent after reload.
- Rechecked hosting through the persisted project ID: Sites still returns project-not-found. No new Site or unrelated deployment was created.
- Read detector, confirmation state, API, browser capture and replay logic, build routing, local SQLite storage, and animation scenarios. Previous browser checks cover all four animation outcomes and phone layout; physical camera access was not requested or tested in this audit.
- Existing old URL c58ef3fd-3e23-4cc3-b429-6fb281735a91 returned Store not found: it belonged to the earlier temporary in-memory preview. Persistent local storage cannot recover a board that was never saved. A new persistent QA board was created for this review.

## Fixed during this review

1. Replaced Technology Mafia with Victor Aguirre across current source pages, generated marker labels, print SVGs and documentation. Updated three existing local default demo-store names, preserving their IDs and state.
2. Generated a transparent futuristic silver/emerald/lime SW lettermark and installed it in both page headers. Preserved the original generated image in the image library and copied the project asset into web/assets.
3. Invalid JSON values such as null, arrays and strings now return 400 instead of causing an unhandled property-access error.
4. On a failed refresh, the customer card now clears its previous status color and confirmation bar as well as showing Unavailable.
5. If camera setup fails after opening a stream, the error path now stops the stream and resets the camera controls.

## Major improvements, in order

| Priority | Finding | Why it matters | Required improvement |
|---|---|---|---|
| P0 before a remotely judged demo | No verified public deployment; hosting account cannot access the registered project. | Localhost cannot be opened on judges' phones or other computers. | Recover the original Site access, deploy this exact build and D1 migration, and verify a status page from a separate device. |
| P0 before claiming live detection | Physical webcam accuracy has not been measured. | Synthetic marker pixels do not reproduce glare, perspective, motion blur or actual camera behavior. | Test printed markers with the intended webcam, both signs, obstruction and no-sign scenes. Record false detections, missed detections and confirmation delay. |
| P1 core feature gap | Outside-shutter recognition and combining inside/outside CCTV feeds are animation-only. | The animation cannot substantiate a live two-camera product claim. | Connect two owner-authorized sources, define camera IDs, per-feed freshness and conflict rules, then test missing and disagreeing feeds. Keep concept labels until then. |
| P1 operation | Camera observation stops when the tab is hidden or closed; laptop sleep also interrupts it. | It cannot provide continuous service unattended. | Build a persistent edge capture worker with restart recovery and heartbeat monitoring. Keep status unavailable while its evidence is stale. |
| P1 evidence integrity | Pairing authenticates the sender, not the truth of the observation. | Anyone holding the token can send a fabricated camera-status payload. | Add per-device identity, revocation, replay protection and controlled ingest before a real pilot. Do not describe a camera label as independently verified. |
| P1 owner access | Pairing token is held only in tab memory with no recovery or rotation. | Reload can strand an operator if the token was not saved. | Add a clear secure export/copy flow, re-pair/revoke controls and owner authentication. Avoid putting tokens in URLs. |
| P1 deployment safety | Hosted D1 migrations, load behavior and backup restoration remain unverified. | SQLite tests do not prove hosted deployment or recovery. | Validate the migration on the actual deployment, test restart and restoration, and add operational logs and alerts. |

## Moderate and minor improvements

| Priority | Finding | Improvement |
|---|---|---|
| P2 | API creation limit is per IP/hour with a 1,000-board cap. Many clients could exhaust the prototype capacity; localhost has a single shared bucket. | Add authenticated onboarding, board lifecycle management and an atomic capacity reservation. Never expose the current prototype as an unrestricted production service. |
| P2 | Request length is checked after the entire request body has been read. | Enforce a streaming byte limit or gateway limit before large bodies are buffered. |
| P2 | Polling requests can overlap and have no explicit timeout or response ordering. | Use one in-flight refresh, timeout/backoff and server-time ordering so a delayed response cannot repaint a newer state. The current error display improvement does not solve ordering. |
| P2 | Capture forces every frame into 640 by 480. Cameras with another aspect ratio can distort a square marker. | Preserve the source aspect ratio or crop a visible calibrated region before detection. Test widescreen and portrait camera sources. |
| P2 | There is no acknowledgement/retry queue for observations rejected by concurrent updates or temporary connection failure. | Add bounded retries where appropriate and display the last successfully acknowledged observation. Avoid submitting old evidence as fresh. |
| P2 | Uncertain and offline events do not enter the same history as confirmed changes; displayed clock times lack a date/timezone. | Add bounded health transitions and full date/time with an age counter. Keep evidence timestamps distinct from owner-override timestamps. |
| P2 | Old in-memory preview links can open a missing board without an obvious recovery button. | Show a specific board-not-found screen linking to setup; explain temporary versus persistent storage at startup. Do not silently recreate a missing store under its old ID. |
| P3 | Status changes are not an explicit live region; navigation uses aria-selected on plain buttons. No full screen-reader/keyboard audit was performed. | Use appropriate navigation semantics and announce meaningful status changes without announcing every poll. Verify keyboard focus and accessible contrast. |
| P3 | The metallic raster logo is more detailed than a small app icon needs. | Keep this image for the website/pitch and create a simplified flat SVG and favicon before final brand production. No trademark clearance is implied. |
| P3 | The animation compresses time and resets the customer preview each cycle. | Keep the accelerated-time label, consider a stable completed state and add optional Tagalog narration/captions for presentation accessibility. |

## Recommended hackathon preparation

1. Prove one real webcam-to-customer flow with the supplied marker; record the demo as a fallback.
2. Restore public hosting and verify it from another device. Keep local startup instructions ready.
3. Present the animated outside/inside system as the roadmap, followed immediately by the working webcam prototype.
4. Explain who benefits and conduct a small owner/user interview or consented pilot. Community impact is a hypothesis until measured.
5. Prepare a complete accessible source repository, deployment instructions and an accurate demo script. This review did not verify a StoreWitness GitHub publication or re-audit current competition rules. No entry was submitted.

Tests passing means the covered behavior works in its tested conditions. It is not a guarantee of zero defects, production readiness or competition score.
