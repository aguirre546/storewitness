# Establishment connector verification - 14 November 2026

Implemented a local Python dashboard and bounded camera/OCR subprocess, one USB or owner-supplied RTSP/RTSPS input, sign-area percentages, mirror control, PHT opening hours, opt-in Windows DPAPI settings, and metadata delivery through existing pairing/authentication. Camera addresses are passed to the scanner via stdin, excluded from status responses and process arguments. No frames, extracted scene text or camera credentials go to the public API.

## Verified

- 9 Python tests passed, covering setup bounds, fixed allowed token destinations, OPEN/CLOSE/CLOSED rules, conflicts, low confidence, darkness, schedule/overnight behavior, actual Windows encryption round-trip, credential exclusion, demo/camera separation, test-without-publication, stale-frame rejection, stopping the capture process, explicit connector User-Agent and sanitized network errors.
- Local HTTP tests: missing setup token -> 403; cross-origin write -> 403; oversized setup -> 413.
- Actual OpenCV/RapidOCR generated-image checks: OPEN -> OPEN; CLOSE and CLOSED -> CLOSED; NONE -> UNCERTAIN. Inference took approximately 0.4-0.6 seconds after model initialization in this run. This is a controlled sample, not field accuracy.
- Local browser: check once did not publish; monitoring delivered repeated observations; customer page showed CLOSED with 3/3 confirmation and retained history. Stop then stale expiry produced UNAVAILABLE.
- Live website: connector paired to a separate replay board and delivered actual locally OCR-derived metadata. Public page showed CLOSED, 3/3, timestamp and saved confirmation. Existing user board 888110fd-013f-433a-9371-5f6920985e83 was not changed.
- Service initially rejected Python's generic User-Agent; the connector now identifies itself honestly as StoreWitness-Connector/0.1. Production pairing and repeated delivery then succeeded. No browser impersonation, bypass token, or paid API was used.
- Existing 75 website tests passed and Worker build passed.

## Remaining limits

Physical USB sign capture and actual IP camera/DVR/NVR streams need field testing. Proprietary camera clouds, ONVIF discovery, two-camera fusion, people/object detection, shutter classification, signed EXE installer, auto-start service, real-store accuracy and prolonged reliability are not delivered by this version. Keep the process and establishment computer running; closing the dashboard does not stop the app, but sleep/shutdown does. The connector does not run inside the customer's phone. Background phone alerts remain separate.

Saved setup is opt-in DPAPI for the Windows login. There is no automatic monitoring on restart. Non-Windows persistence is disabled. One sender per Store ID. An already accepted request cannot be undone by Stop.

## Scoped connector-key release

77 website tests pass after adding observation-only device keys. Tests cover cross-store rejection, owner action denial, public secret exclusion, replacement/revocation, and revocation on owner rotation/recovery. Existing owner keys continue working; these keys do not independently verify a business claim.
