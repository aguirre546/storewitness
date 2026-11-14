# StoreWitness Maps and business protection — product draft

Prepared for Victor Aguirre, 14 November 2026. This is a roadmap and acceptance specification, not a claim that all listed features exist. StoreWitness remains an independent product. Use original branding, layouts and permitted mapping data; do not copy Google/Waze source code, scrape their place databases, or present their traffic as our own. No paid map service or billing has been enabled by this draft.

## Product promise

Help people check whether a participating establishment has a fresh opening signal before travelling, then find another suitable branch if it closes. The customer sees a useful map and status; the establishment privately controls its own listing and camera connector. A camera reading is evidence, not proof that every service is available. Freshness, uncertainty and owner overrides remain visible.

## Customer experience

Home screen: a search field, map/list switch, category filters, optional Use my location, and accessible status labels. Location permission is requested only after a deliberate tap. Denial leaves search by area available. Never require location sharing to see a store's status.

Search -> inspect store card -> check source/timestamp -> choose destination -> enable trip watch -> open navigation. A closure notification says which location closed and when it was checked. Alternative branches are rechecked before selection. Customers select a new destination while parked; the system does not silently reroute a driver. A recommendation must explain relevance, status age and distance basis. A branch of a different business must not be labelled an official branch.

Proposed bottom tabs: Explore, Saved, Trips, Account. The establishment has a separate Business studio rather than editing through the customer screen.

## Feature inventory and proposed delivery

The inventory covers major navigation/discovery feature families inspired by Google Maps and Waze. It is not an exhaustive copy or guarantee of feature parity: capabilities vary by country, device and service changes. The official references below establish the comparison baseline.

| Area | Proposed StoreWitness behavior | Status / dependency |
|---|---|---|
| Interactive map | Pan, zoom, current area, accessible list fallback, clustered store pins | Next phase; select a permitted map/tile provider |
| Store search | Name, category, area/address, nearest participating locations | Next phase; searchable opt-in directory required |
| Status filters | Fresh open, closed, on break, uncertain, unavailable; words/icons as well as color | Status data exists; directory filters proposed |
| Store details | Public address, contacts supplied by owner, services, hours, accessibility, branch links | Partial; current board has name, location, status, source and history |
| Opening evidence | Timestamp, age, source, three-check confirmation, no footage shown | Implemented prototype |
| Business verification | Distinct identity-verified badge separate from camera status | Proposed; human review and dispute process required |
| Directions handoff | Open destination in Google Maps or Waze | Google Maps link implemented for alternatives; Waze proposed |
| In-app routing | Route line, distance, ETA, driving/walking/cycling options | Later; licensed routing/geocoding provider and budget required |
| Route comparison | Multiple routes, toll/highway/ferry preferences, route conditions | Later; real routing data required |
| Multiple stops | Add/reorder stops with per-destination availability | Later |
| Turn-by-turn guidance | Spoken directions, lane guidance, speed context | Later native/navigation integration; safety/field testing required |
| Traffic and ETA | Traffic-aware route times and congestion display | Later; permitted traffic source required, no invented live traffic |
| Road events | Construction, hazards, closures, crash reports | Later; moderation, expiry and trusted data feeds required |
| Community reports | Report incorrect status or map location without changing verified owner data | Later; rate limits, review and abuse handling required |
| Trip closure watch | Alert when destination has fresh closed/break status | Foreground prototype implemented; page must remain visible |
| Background alerts | Opt-in push while another app is open/phone locked | Proposed; push backend, subscriptions, permission and platform tests required |
| Alternative branches | Owner-linked fresh OPEN locations, labelled source, separate replay mode | Implemented prototype; affiliation not yet verified |
| Alternative ranking | Same branch network/service, accessibility, route detour, freshness | Current straight-line destination distance only; routing/ranking proposed |
| Planned visits | Future visit time, schedule check, reminder and recheck before departure | Proposed; schedule is not a future opening guarantee |
| Saved places | Favorites, lists, optional Home/Work | Proposed; private preferences, explicit optional sync |
| Share destination | Public store URL / later QR and place cards | URL implemented; additional sharing UI proposed |
| Share live trip | Time-limited location/ETA share with named recipients | Later; explicit consent, revocation and retention controls |
| Reviews/photos | Customer reviews, owner photos, helpfulness and report abuse | Later; moderation, storage, upload controls and privacy required |
| Transit | Bus/train routes, schedules and service alerts | Later; region-specific trusted feeds required |
| Fuel/EV/parking | Relevant locations, hours, prices/availability where licensed | Later; source coverage and update-age disclosures required |
| Offline | Downloadable map areas, saved destination details | Later provider-specific capability; stale store status must never appear live |
| Street/satellite/3D | Alternative imagery and immersive views | Deferred; licensed imagery/hosting would be a separate project |
| Indoor navigation | Entrances, accessible paths, floor maps | Deferred; establishment-provided verified data needed |
| Voice/search languages | English/Filipino search and accessible spoken alerts | Optional English alert speech exists; broader localization proposed |
| Car dashboards | CarPlay/Android Auto compatible experience | Deferred; platform approvals and native development required |
| Map edits | Correction proposals, review queue, history and rollback | Proposed; no anonymous overwrite of a business |
| Privacy/account controls | Location opt-in, retention/deletion, consent and export | Basic privacy/device choices exist; customer accounts and trip controls proposed |

## Establishment experience

1. Sign in using an owner account with passkey/MFA (proposed). Existing prototype uses a private owner key, not an owner account.
2. Create a draft listing. Do not automatically publish a verified badge just because the name matches a business.
3. Verify control of the establishment using a reviewed process: business-controlled channel plus evidence, an onsite challenge or another supported method. Record decision and appeal process; keep sensitive evidence private with a retention limit. Business transfers must require renewed verification, not knowledge of the public Store ID.
4. Create a revocable connector key for that Store ID. Enter this restricted key in the local app. Keep the owner key/recovery code separately.
5. Pair one supported camera, select sign area, set schedule, test OPEN and CLOSE/CLOSED. Start sending only after a successful local check. A camera's physical authenticity is not proven solely by a valid key.
6. Publish directory listing only after ownership/visibility requirements pass. Add verified branch relationships, public business information and customer link.
7. Use owner controls for break, temporary closure, hours and recovery. Staff access should use individual roles rather than copying the owner key.

## Key separation and sabotage controls

| Credential / role | Intended permission | Status |
|---|---|---|
| Public Store ID / customer link | Read public status only | Existing; it is an identifier, not a secret |
| Owner key | Settings, overrides, recovery creation, archive, key management for one store | Existing prototype; possession gives broad control |
| Connector key | Pair/check mode and submit observations for one store; cannot override, archive, edit branch settings, rotate credentials or create another key | Added in this release; one active connector key per store |
| Recovery code | One-time owner recovery, replacing credentials | Existing; save privately before losing access |
| Owner passkey/MFA account | Durable identity, secure recovery and high-risk change confirmation | Proposed |
| Staff account | Limited individual business permissions with removal and audit | Proposed |
| Per-device signing key | Device enrolment, signed timestamped requests and key revocation | Later; stronger than a shared bearer token, still not proof of visual truth |

Owner/connector keys are generated randomly and stored as hashes on the server. The connector has optional Windows DPAPI encryption for its local settings. A connector key is returned only on creation and can be copied privately. Replacing/revoking it invalidates the previous connector key; owner rotation or recovery also revokes it. Never put keys in a QR customer link, public URL, analytics or support issue. Do not rotate a user's active production key without an explicit request.

Prototype limitation: the full owner key remains valid for observation submissions for compatibility. Establishments should choose the restricted connector key. A stolen owner key can still damage that store; a stolen connector key can still send false readings until revoked. Credentials protect authorization, not whether the camera is honestly pointed at the correct sign.

Additional production requirements:

- All writes authorized server-side by store and permission. Owner verification protects the listing; a duplicate name never transfers ownership.
- Rate-limit enrolment, login, recovery, status writes, reports and directory search. Monitor suspicious activity without locking legitimate owners out indefinitely.
- Time-bound samples, observation IDs, duplicate/reorder rejection and fresh-state expiry. Never replay an offline backlog as a live signal.
- Separate owner overrides, camera observations and community reports. Customer reports cannot directly close or claim a business.
- Audit key lifecycle, device last-seen, setting changes and owner transfers; alerts go to the owner through a verified private channel. Current bounded public activity history is not a complete security audit.
- Pause a compromised device, retain records, revoke its key, restore trusted state and communicate source uncertainty. Keep reversible archive/restore and secure backups; run restore drills.
- Do not show personal CCTV feeds. Use minimum scene area and short-lived in-memory frames. No face recognition is needed for store status.
- High-impact listing edits (ownership, contact channel, location, branch affiliation) need reauthentication and independent verification. Disputes must have human review.
- A fresh sign reading can be wrong, staged or obstructed. Add conflict detection, manual confirmation and field benchmarks; never promise the business is sabotage-proof.

## Architecture

Customer phone -> public directory/status API -> status database.

Business owner -> authenticated business API -> listing, staff, key hashes and audit store.

Local camera -> local connector/OCR -> restricted observation API -> confirmation/freshness engine -> public status.

Trip subscription -> status-change event -> notification service -> opted-in customer. This background pipeline does not exist yet.

Routing/maps adapter -> permitted tile, geocoder and routing provider. Keep provider credentials server-side where appropriate, public browser keys restricted, requests budgeted, attribution visible and location collection minimal. The existing site's restrictive image/connect policy and no-referrer setting must be reviewed before adding a map tile provider. OpenStreetMap public tiles have usage and attribution rules, no guaranteed service, and disallow bulk offline downloads; open data does not mean unlimited free hosting.

## Delivery order

**A — Finish the foundation:** connector release, scoped keys, camera tests at one consenting real store, monitoring/recovery tests, clear owner setup. Done in this release only where QA confirms it.

**B — Trust before public discovery:** owner accounts/MFA, business claim verification, protected profile edits, scoped devices/staff, private security alerts and audited recovery. Required before marketing a verified open directory.

**C — Useful customer map:** opt-in store directory, category/name/area search, map/list, evidence-aware filters, saved stores, Google/Waze handoff. Start with a small pilot area and real participating businesses. A schematic mockup must say it is illustrative and must not fabricate street data.

**D — Visit protection:** background push, destination subscription, alternative branch ranking, arrival-time schedule hints and notification expiry. Test Android/iPhone denied permission, hidden tab, locked screen and offline behavior.

**E — Navigation expansion:** licensed routes/traffic, transit/parking/EV data and native car integration only when coverage, cost and operations can support it. Full Google Maps/Waze parity is a long-term program, not this release's scope.

## Acceptance gates

- Wrong Store ID/key and cross-store requests cannot write; a connector key cannot change owner settings or mint credentials. Rotation/recovery invalidate prior device access. Secrets absent from public status/history/errors.
- A malicious duplicate listing or customer report cannot take ownership or change verified status. An operator cannot self-award a verified badge.
- Public map excludes private/draft/unverified listings unless explicitly marked and approved for that audience. Location collection is opt-in with non-location fallback.
- Fresh open -> three consistent closed readings -> one attributed trip alert -> rechecked open alternative. Uncertain, disconnected or expired data does not produce a false closed claim or stale open recommendation.
- Customer navigation handoff includes only chosen public destination. Background notification delivery is claimed only after supported-platform tests.
- Camera disconnect, slow OCR, offline API, process restart, bad clock and duplicate sender are visible and recoverable. No hidden startup, camera discovery, remote exposure or silent owner key change.
- Mobile keyboard, large text, contrast, screen reader labels and map-free list access pass usability checks.

## Official comparison references checked 14 November 2026

- Google Maps overview (place details, directions, saved trips, contributions and related tools): https://support.google.com/maps/answer/144349?hl=en
- Google Maps offline behavior and limitations: https://support.google.com/maps/answer/6291838?hl=en
- Waze navigation and alert overview: https://www.waze.com/apps/
- Waze planned drives: https://support.google.com/waze/answer/6378906?hl=en
- Waze supported deep links: https://developers.google.com/waze/deeplinks
- OpenStreetMap tile usage requirements: https://operations.osmfoundation.org/policies/tiles/

These references describe comparison products or provider rules. They do not supply a license to copy proprietary datasets or prove StoreWitness implements the same functions.
