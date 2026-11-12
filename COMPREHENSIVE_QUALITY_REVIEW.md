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
