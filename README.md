# StoreWitness
**Store status, backed by observation.** By Victor Aguirre, solo creator.

Live: https://studio.victoraguirre.site/  
Animated concept: https://studio.victoraguirre.site/demo  
Experimental real image analysis: https://studio.victoraguirre.site/inspect

A working community prototype that shares a participating store's latest observed status. It displays the source, confirmation progress, freshness and owner overrides. It does not update Google Maps.

## Try the demonstration
1. Open Operator studio and create a **replay** store. This is clearly labelled demonstration data.
2. Run OPEN replay. Three acknowledged observations ten seconds apart confirm the state after about twenty seconds.
3. Copy the public status link and open it on another device. Public reads do not require the private pairing token.
4. Stop observing. The signal becomes unavailable 35 seconds after the last observation.
5. Test an owner override, which is labelled and expires after fifteen minutes.

## Real camera evidence
Open `/inspect`, load models and choose an image or enable your webcam. TensorFlow.js COCO-SSD draws boxes for supported common objects, including people. Tesseract reads English OPEN/CLOSED text. Brightness and operator-entered timezone/hours add context. Select the center region for a close sign when whole-frame OCR misses it.

Image processing runs locally. Model downloads require internet and reveal the requesting IP to public CDNs; frames are not uploaded. Enable sending only with a live webcam and a paired **camera** board. Uploaded images are single-frame inspection tests and cannot publish observations. The browser's camera permission is required. Automatic checks stop when the page becomes hidden.

Darkness, a quiet scene, or no detected people **does not prove closure**. Contradictory or insufficient evidence remains uncertain. Object classes are limited; this is not an all-object detector, a trained shutter detector, dual-camera fusion, or RTSP CCTV ingestion. Schedules are configured and saved on the operator device; they are not extracted from a photograph or centrally managed.

Operator studio now defaults to ordinary OPEN / CLOSE / CLOSED sign OCR. Load text scanner once, enable the camera, and Start observing. Its image-test field uses the same sign reader without publishing. CLOSE and CLOSED both normalize to CLOSED. Optional supplied coded markers remain available through Detection mode. Object and schedule context remain on /inspect. Save your private pairing token before refreshing; it is held only in the current tab.

## Run and verify locally
Requires Node.js 22.13+ with `node:sqlite` (tested on Node 26). There are no npm dependencies or paid API keys.

```
node --test
node build.mjs
node preview.mjs
```

Visit http://127.0.0.1:4330 . For persistent local boards use `./Start-StoreWitness.ps1`; data stays in ignored `data/storewitness.sqlite`. Default preview uses temporary storage. Localhost links cannot be shared with another computer.

## Deploy to Cloudflare Pages
Run `node build-pages.mjs`. Upload the **contents** of `pages-deploy` (`_worker.js` and `index.html`) using Pages Direct Upload. Create a D1 database, execute `drizzle/0000_store_boards.sql`, and add the Pages binding named **DB**. Redeploy after setting the binding. Add a custom domain through Pages and verify its DNS record and HTTPS response. The live instance uses Cloudflare Pages and D1 on the free plan; free-plan limits still apply. Publishing source to GitHub does not automatically redeploy this Direct Upload project.

## Safeguards and limits
Pairing tokens are returned only at creation, hashed in storage, excluded from public reads, and never placed in URLs. Keep the token privately; there is no account-based recovery in this prototype. Writes validate origin, source and input, enforce sample spacing, and use optimistic revision checks. Board creation is bounded. Only metadata and recent status history reach D1. A paired sender can submit false metadata; authentication does not prove that camera evidence is genuine.

This is an inspectable hackathon prototype, not a claim of production accuracy, seven-day reliability, or guaranteed opening/service. No real CCTV deployment or Google Business Profile integration has been validated. Competition submission remains a separate action.

## Model references
- TensorFlow.js: https://github.com/tensorflow/tfjs
- COCO-SSD supported detection: https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd
- Tesseract.js: https://github.com/naptha/tesseract.js
- Cloudflare Direct Upload: https://developers.cloudflare.com/pages/get-started/direct-upload/


## Webcam troubleshooting
Camera testing no longer requires a paired store. Enable camera (the reader loads automatically), select the device showing your sign, and click **Check webcam frame · does not publish**. Whole frame is the default. Inspect the OCR preview, text, confidence, duration and preprocessing method. Mirrored feeds can be corrected with the explicit flip checkbox. Dim/unreadable images get bounded retries; uncertain results are retained rather than forced. Camera requests time out with guidance and can be retried. Test local recognition before pairing and starting public observations. Physical CLOSE recognition still requires a successful field test; controlled fixtures are not an accuracy benchmark.

## Camera and Replay Lab usability update — 12 November 2026

Start observing now performs first-use camera-board setup, camera access and text-scanner loading, with a persistent readiness message. A paired replay board requires an explicit switch to a camera board. Busy work and active observation still prevent duplicate starts.

Replay Lab is always reachable from navigation. Its empty state explains that no recordings or camera are required, and provides Create a replay board. Replay scenarios remain labelled test data and separate from camera observations.

Verification: 58 StoreWitness tests pass and the Worker builds. A physical webcam CLOSE reading remains unverified; controlled sign-image results do not prove field accuracy. Browser UI verification is recorded separately after deployment.
