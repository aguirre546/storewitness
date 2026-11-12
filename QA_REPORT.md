# StoreWitness verification — 12 November 2026

**Result:** Working local prototype. Public deployment and physical camera validation remain incomplete. Competition submission has not been sent.

- 40 automated checks pass: 22 detector tests on actual generated raster pixels, 13 state tests and 5 SQLite-backed API integration tests. Coverage includes marker rotation, obstruction, low contrast, multiple markers, malformed input, three spaced readings, stale recovery, source isolation, owner expiry, hashed-token authentication and simultaneous-write conflicts.
- Browser UI: created a separate replay board, sent three observations at ten-second intervals, confirmed OPEN in the event timeline, and verified stale observations became Unavailable. Replay source was visibly labelled. Customer/operator navigation and paired controls worked.
- Build: dependency-free Worker generated successfully, `node --check dist/server/index.js` passed. The hosted migration has not been applied or verified on D1.
- A second, unpaired browser tab read the same board without a pairing token. A manual CLOSED override appeared with owner attribution and expiry. Mobile customer layout was visually checked at a 390-pixel viewport without horizontal overflow. SQLite data survived closing and reopening a database file.
- Visual proof: `../StoreWitness_Customer_QA.png` records the customer view after stale timeout. Actual screenshots are not evidence of a physical camera trial.

## Major remaining items

1. Hosting access: exact persisted project ID returns `Sites project not found` in the currently connected Sites account. List Sites returned another existing project, not StoreWitness. No substitute Site was created and no unrelated Site was modified. Reconnect the account that owns the registration or recover its workspace access before publication.
2. Physical webcam trial: user camera permission and a printed/displayed coded marker are needed. Accuracy under real lighting, glare, angle and distance remains unmeasured.
3. Real storefront pilot: owner permission, device trust, monitoring, abuse controls and field validation are needed before relying on this community-wide. Pairing authenticates the reporter, not the truth of its observation.

## Scope limits

No Google Maps edits, real CCTV/RTSP ingestion, all-object scanning, OCR or seven-day unattended operation. The operator browser must remain open and foreground; interruption makes observations stale. Localhost is accessible only on the same computer. No paid API, new billing or competition submission was used.

## Animated walkthrough update
Browser-tested all four scenarios through the five steps: Store opens -> Open; Store closes -> Closed; Cameras disagree -> Uncertain; Camera offline -> Unavailable. Pause and manual stepping worked. This visual explanation sends no observations to the API and explicitly labels future two-camera behavior. Build and JavaScript syntax checks passed.

## Comprehensive follow-up
See COMPREHENSIVE_QUALITY_REVIEW.md for the prioritized findings, completed branding changes, input-validation repair and remaining production gaps. Current test result: 40 passed, zero failed. Creator branding is Victor Aguirre.
