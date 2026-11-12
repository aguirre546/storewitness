# StoreWitness comprehensive quality review
Reviewed 12 November 2026. Creator: Victor Aguirre.

## Verdict
Published, inspectable hackathon prototype: https://studio.victoraguirre.site/ . Cloudflare Pages serves the real application and D1 stores shared boards. Source is at https://github.com/aguirre546/storewitness . This is not a validated unattended two-camera CCTV service. Competition submission remains unsent.

## Completed checks and repairs
- All 51 scoped automated tests pass: 22 raster marker detector, 13 confirmation/freshness state, 5 SQLite-backed API, and 11 schedule/evidence tests. These test counts exclude the older PurrFlow project.
- Fixed the screenshot's faint metric figures and view-navigation scroll position. Visually checked the live explanation page: title clears the sticky header and 10/3/35 metrics are readable. Text-only wordmark, system sans typography, scroll reveals and reduced-motion support retained.
- Added `/inspect`: real COCO-SSD object/person inference, English sign OCR, brightness, weekdays/timezone and overnight hours. No model API key is required. Models download from public CDNs and inference runs locally.
- Browser evidence: the controlled OPEN fixture read at 96% OCR quality with center crop. Whole-frame OCR initially missed the same sign. The controlled CLOSED fixture read at 96% on the public deployment and returned Closed. These confidence values describe the OCR output on individual fixtures, not storefront accuracy.
- A TensorFlow sample photo produced three person detections and kite detections with boxes. An unclear sign remained Uncertain. This was an inference demonstration, not a real-store pilot.
- Public model startup initially failed under CSP. Replaced TensorFlow's legacy bundle with its ES2017 bundle, preserving the no-JavaScript-eval restriction. Retested: public models loaded and CLOSED image analysis completed.
- Live HTTPS API on the custom domain: D1 health passed; created a labelled replay QA board; wrong token rejected (401); three ten-second-spaced readings confirmed OPEN; unauthenticated public read omitted token; owner CLOSED override was attributed to owner; after clearing override and stopping input, state became UNAVAILABLE after 35 seconds.
- Created the Pages DB binding and migrated both tables, then redeployed. Verified the unused studio subdomain before Pages created its CNAME to storewitness.pages.dev. Root website and registrar nameservers were preserved. No billing or paid generation was enabled.
- Public source excludes runtime database, tokens, provider identity, unused generated logo and account exports. README includes local reproduction, Pages deployment and real limitations.

## Major remaining improvements
1. **Physical camera / actual store validation:** no CCTV has been supplied. Test real signage at varied angles, glare, distance, darkness and exposure. Do not claim general accuracy from controlled fixtures.
2. **Two-camera ingestion and fusion:** indoor/outdoor concept animation exists. The experimental detector analyzes one webcam or uploaded photo; it does not ingest RTSP feeds or merge two cameras. A production edge gateway, reconnect handling and conflict rules remain to be built.
3. **Reliable business truth:** darkness and no detected people are insufficient. Clear signs still need context. Owner permission, calibration and a labelled field dataset are required. Generic COCO-SSD does not recognize every object or a store-specific shutter.
4. **Continuous operation:** browser checks stop when hidden. No always-on camera worker or seven-day reliability result exists. The public server is cloud-hosted; the capture device still needs to stay active.
5. **Production identity and abuse recovery:** this prototype uses private pairing tokens, not owner accounts, token rotation/recovery, or device attestation. Board count and creation rate are bounded, but broader abuse controls and operational monitoring remain future work.
6. **Google Maps:** no Business Profile update integration is implemented or claimed. The app's own status page is live.

## Minor improvements
- Centralize schedules per store; currently schedule settings persist only on the operator device.
- Improve OCR region guidance and calibration; whole-frame recognition is unreliable on small/background signs.
- Add inference-duration display and camera-specific performance measurements. Slow hardware can skip busy checks and cannot promise exact ten-second results.
- Add automated deployment from GitHub; current Pages deployment is Direct Upload.
- Add keyboard/screen-reader field testing, broader mobile device testing and self-hosted model assets/offline caching after license review.
- Add durable owner account recovery, board retirement and a documented retention policy before a wider community pilot.

## Evidence and references
`QA_REPORT.md` summarizes verification. Local `../StoreWitness_Live_QA.json` records sanitized live API results (no pairing token). TensorFlow COCO-SSD reference image came from https://raw.githubusercontent.com/tensorflow/tfjs-models/master/coco-ssd/demo/image1.jpg . TensorFlow's ES2017 CSP guidance: https://github.com/tensorflow/tfjs/issues/7554 .

The deployable scope is useful for a transparent hackathon demonstration. Real-store reliability remains to be measured.


## Ordinary-sign operator fix - 12 November 2026
The reported failure was caused by the operator using a coded-marker-only detector while the user showed ordinary OPEN lettering. Step 2 now defaults to sign OCR, with explicit OPEN / CLOSE / CLOSED labels, a one-time Load text scanner control, center/whole-frame region selection, and a non-publishing image test. The optional coded-marker mode is clearly separated. Webcam capture preserves its actual aspect ratio, skips overlapping OCR work, and discards results that finish after stopping or reconnecting the camera.

Added three semantic regression tests: CLOSE/CLOSED normalization, partial-word rejection (OPENING, REOPEN, CLOSEUP, ENCLOSED), and conflicting/low-confidence text. All 51 tests pass. In-browser operator image tests recognized OPEN, CLOSE and CLOSED; CLOSE mapped to CLOSED. Each controlled fixture returned 96% OCR quality. These are controlled image checks, not a measured physical-webcam accuracy study. The webcam-to-server path still requires a physical sign trial; the previous live API checks verify confirmation and freshness separately.

Next operator actions: privately save Store ID and pairing token before refreshing; open the updated operator view, reconnect if required, keep Sign text selected, load the scanner, enable the correct camera, hold one clear word in the guide, and Start observing. Keep the tab active through three acknowledged observations. Test OPEN then CLOSE/CLOSED, conflicting signs, obstruction and stopping input. Slow inference may skip a scheduled tick. Objects, darkness and lack of people do not independently decide opening status.


## Webcam diagnostics follow-up - 12 November 2026
The webcam CLOSE complaint remains a field-validation item. During the live check, one operator tab had no pairing, no loaded reader and no active camera. Camera permission was approved; frames later arrived from multiple devices. Observed physical-frame outputs were UNCERTAIN (background gibberish, then no text). No successful physical CLOSE reading was captured before the browser session closed. Do not equate controlled image success with webcam success.

Implemented: camera preview/check without pairing; automatic reader load on camera enable; whole-frame OCR by default; exact OCR input preview; optional mirrored-text correction; enlarged image/contrast retry; sign-word confidence instead of an unrelated-background average; displayed inference duration; source aspect ratio; correct selected camera label; explicit reconnect on camera selection change; no publication from a local frame check. Camera requests show progress and time out after 20 seconds, late/cancelled streams release tracks, and OCR timeout allows scanner reload. Hidden tabs stop camera capture. No confidence threshold was lowered to force a result.

Verification: 58 scoped automated tests pass, including 4 confidence/contrast and 3 camera-request lifecycle tests. Controlled dim CLOSE and corrected mirrored CLOSE images each read as CLOSED at 96% OCR quality in the browser. The camera lifecycle tests simulate delivered, unanswered, late and cancelled requests; they do not measure physical camera accuracy.

Current priorities:
1. Complete one real webcam CLOSE result with the sign filling a useful part of the image; inspect OCR preview and raw recognized text before changing thresholds.
2. Measure true positives and false positives on OPEN, CLOSE, CLOSED, blank scenes, conflict signs, glare, blur, angle, distance and multiple cameras. Include signs that resemble the target words.
3. Rehearse camera-to-customer publication: three spaced camera readings, source label, stale timeout, override and reconnect. Browser-local token recovery and centrally managed schedules remain missing.
4. Two-camera RTSP ingestion, camera fusion, background capture, monitoring, owner accounts and real-store pilot remain major unfinished capabilities. Current object detection is limited to supported model classes, and darkness/no detected people does not prove closure.
5. Minor improvements: guide alignment/calibration, mobile hardware testing, keyboard and screen-reader audit, offline model caching, token rotation/recovery, retention/board retirement and automated deployment. The current cloud deployment still uses manual Direct Upload.

To test now: use the public domain rather than an old localhost link. Enable the selected webcam, wait for Text scanner ready, show CLOSE, and click Check webcam frame (does not publish). Confirm the OCR input preview actually contains the full word. Use Flip mirrored camera text only when the captured letters are backwards. Pair a camera board only after this local check works; then Start observing and keep the page active. Save private pairing values outside chat before a reload.

## Camera and Replay Lab usability update — 12 November 2026

Start observing now performs first-use camera-board setup, camera access and text-scanner loading, with a persistent readiness message. A paired replay board requires an explicit switch to a camera board. Busy work and active observation still prevent duplicate starts.

Replay Lab is always reachable from navigation. Its empty state explains that no recordings or camera are required, and provides Create a replay board. Replay scenarios remain labelled test data and separate from camera observations.

Verification: 58 StoreWitness tests pass and the Worker builds. A physical webcam CLOSE reading remains unverified; controlled sign-image results do not prove field accuracy. Browser UI verification is recorded separately after deployment.

## Owner duration and break controls — 12 November 2026

Owner controls offer 5, 15, 30 and 60 minutes, or a custom whole-minute duration from 1 to 120. The server validates the duration and calculates expiry from its own clock; older clients default to 15 minutes. On break creates an owner-attributed CLOSED override with a distinct break label, reason and expected return time on the public page. End break / clear override ends it early. Observations may continue while an override is active. At expiry or clearing, fresh observed status applies; stale observations show Unavailable rather than assuming reopening.

Validation: 60 scoped tests pass. API tests cover preset/custom duration boundaries, invalid durations, exact expiry, public break attribution, camera updates while on break, clearing and invalid break combinations.

## Stored activity history — 12 November 2026

Each existing board retains its latest 200 metadata events in Cloudflare D1, independent of browser tabs. The customer timeline shows ten events initially with Show more and JSON Download history. Events use consistent labels, source, reason and full Philippine date/time. Break endings, override expiry, uncertain transitions and stale feeds are recorded. Expiry/stale events are materialized once on the next API read or write, with their actual effective timestamp; no always-on background worker is claimed. Earlier discarded entries cannot be recovered. History belongs to the Store ID; reconnect the same store to continue its timeline. Creating another board creates a separate history. Latest-200 retention is bounded, not an unlimited archive. No video is saved.

63 scoped tests pass, including reopen-storage persistence, chronological/idempotent expiry, uncertainty transitions and 200-event retention.
