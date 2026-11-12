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
