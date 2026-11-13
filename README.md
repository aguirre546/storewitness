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
5. Test an owner override, which is labelled and expires after the selected duration (15 minutes by default).

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
Pairing tokens are returned at creation or explicit rotation/recovery, hashed in storage, excluded from public reads, and never placed in URLs. Keep the token privately; recovery uses a separately saved single-use code rather than an owner account. Writes validate origin, source and input, enforce sample spacing, and use optimistic revision checks. Board creation is bounded. Only metadata and recent status history reach D1. A paired sender can submit false metadata; authentication does not prove that camera evidence is genuine.

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

## Owner duration and break controls — 12 November 2026

Owner controls offer 5, 15, 30 and 60 minutes, or a custom whole-minute duration from 1 to 120. The server validates the duration and calculates expiry from its own clock; older clients default to 15 minutes. On break creates an owner-attributed CLOSED override with a distinct break label, reason and expected return time on the public page. End break / clear override ends it early. Observations may continue while an override is active. At expiry or clearing, fresh observed status applies; stale observations show Unavailable rather than assuming reopening.

Validation: 60 scoped tests pass. API tests cover preset/custom duration boundaries, invalid durations, exact expiry, public break attribution, camera updates while on break, clearing and invalid break combinations.

## Stored activity history — 12 November 2026

Each existing board retains its latest 200 metadata events in Cloudflare D1, independent of browser tabs. The customer timeline shows ten events initially with Show more and JSON Download history. Events use consistent labels, source, reason and full Philippine date/time. Break endings, override expiry, uncertain transitions and stale feeds are recorded. Expiry/stale events are materialized once on the next API read or write, with their actual effective timestamp; no always-on background worker is claimed. Earlier discarded entries cannot be recovered. History belongs to the Store ID; reconnect the same store to continue its timeline. Creating another board creates a separate history. Latest-200 retention is bounded, not an unlimited archive. No video is saved.

63 scoped tests pass, including reopen-storage persistence, chronological/idempotent expiry, uncertainty transitions and 200-event retention.

## Date archive and Camera evidence retest — 12 November 2026

Recent activity now has Archive history by date, PHT calendar selection, saved-date event counts, Show all dates, cloud reload and per-date JSON downloads. The selected day survives refresh through the public URL. It browses retained D1 events; no events are moved/deleted and retention remains latest 200 per Store ID.

Live checks: selected 2026-11-12 loaded 12 saved events; JSON export reported that date, Asia/Manila and 12 events without a pairing token. 2026-11-11 correctly showed zero events, disabled export, and remained selected after refresh. Existing storage and expiry tests remain 63 passing.

Fresh Camera evidence tests: public models loaded; OPEN, CLOSE and CLOSED fixtures each read at 96% OCR quality with correct status normalization. Object sample detected 3 people and 3 kites (60–85% object scores), measured brightness 200/255, and correctly stayed Uncertain without a clear sign. A uniform dark image measured 5/255, no people/text, and stayed Uncertain. Webcam opened and analysis completed, but its default feed was near black (3/255); no real physical sign success or CCTV accuracy is claimed. Sending was not enabled and camera was stopped. Fixed model-ready text being replaced by OCR progress after loading.


## Terms, privacy and device choices

Plain-language pages are available at `/terms`, `/privacy` and `/contact`. All pages include footer links and Manage cookies. Accept permits persistent device hours; Decline removes saved hours and keeps hours session-only. The choice is stored for 180 days. Core status/history and explicit camera/model actions do not depend on accepting optional storage. No email address is published; Contact Us uses GitHub public support and warns against sharing tokens or sensitive information. No secure private support channel is currently provided. The notice describes public metadata, local frame processing, third-party model downloads, Cloudflare hosting, bounded history and no automatic board expiry. Policies do not guarantee immunity from legal claims or replace review before a real-store deployment.

Privacy-choice tests cover default off, exact expiry, withdrawal/removal of hours, invalid data and unavailable storage. All 66 scoped tests passed when this change was prepared.


## Reliability release — 13 November 2026

Camera writes require capturedAt (epoch milliseconds) and a unique observationId. Captures aged 35 seconds or more, excessive future timestamps, duplicate IDs and reordered captures are rejected. Public freshness preserves capture age, capped at receipt time. Existing open tabs must reload to use this API contract. Replay stays separate.

Both camera pages share the sign reader. Evidence analysis is session-guarded, has model/inference timeouts, mirror correction and contrast retry, discards cancelled results, and aborts pending delivery when stopped. Stop cannot undo a request already accepted by the server. Selected Store ID links into /inspect, hours are stored per Store ID when optional storage is accepted, and copy/show controls are available there.

The public page uses full PHT date/time and relative observation age, single-flight polling with retry backoff, response ordering, persistent errors and deep links through ?view=customer/operator/replay/about. Recovery controls let a connected owner replace the token and create a recovery code; using recovery replaces both credentials. Keep the downloaded private recovery file out of GitHub and support. Recovery is unavailable if neither current token nor a previously generated code is saved. Archive/restore is reversible, pauses store writes, and preserves retained history.

Readiness checks execute a database query; oversized JSON bodies are rejected while streaming. Owner requests have a per-IP/store/minute bound. No database schema migration is required. 71 automated checks passed. Controlled browser image tests: OPEN 96%, CLOSE 96%, CLOSED 95% OCR confidence with correct status normalization; OPEN outside configured hours remained Uncertain. These are controlled fixture results, not field accuracy. CCTV feeds, always-on capture, private support, field testing and backup/restore drills remain separate work.
