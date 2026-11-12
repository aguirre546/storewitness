# StoreWitness verification - 12 November 2026

Live application: https://studio.victoraguirre.site/  
Repository: https://github.com/aguirre546/storewitness

51 scoped tests passed with `node --test` from the StoreWitness directory. Worker build and syntax checks pass. Tests cover real generated marker pixels, timing, stale recovery, source isolation, owner expiry, malformed JSON, hashed-token authentication, write conflicts, schedule validation and cautious evidence rules.

Live custom-domain checks passed: HTTPS page, cloud D1 storage, board creation, 401 rejection for an invalid token, three ten-second-spaced observations confirming OPEN, customer read without token disclosure, owner override attribution, and UNAVAILABLE after 35 seconds without observations. The public route successfully loaded COCO-SSD and Tesseract and read a controlled CLOSED fixture (96% OCR quality).

Browser inference also read a controlled OPEN fixture (96% with center region; whole-frame test missed it) and detected three people plus kites on TensorFlow's reference image. A fixture result is not an accuracy benchmark. A physical webcam/CCTV or real-store trial has not been completed. No seven-day unattended run is claimed.

The public site uses Pages Direct Upload with a D1 DB binding. Source uploads do not automatically deploy. No new charges or competition submission were made. See COMPREHENSIVE_QUALITY_REVIEW.md for major and minor remaining work.


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
