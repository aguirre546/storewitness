# StoreWitness verification - 12 November 2026

Live application: https://studio.victoraguirre.site/  
Repository: https://github.com/aguirre546/storewitness

48 scoped tests passed with `node --test` from the StoreWitness directory. Worker build and syntax checks pass. Tests cover real generated marker pixels, timing, stale recovery, source isolation, owner expiry, malformed JSON, hashed-token authentication, write conflicts, schedule validation and cautious evidence rules.

Live custom-domain checks passed: HTTPS page, cloud D1 storage, board creation, 401 rejection for an invalid token, three ten-second-spaced observations confirming OPEN, customer read without token disclosure, owner override attribution, and UNAVAILABLE after 35 seconds without observations. The public route successfully loaded COCO-SSD and Tesseract and read a controlled CLOSED fixture (96% OCR quality).

Browser inference also read a controlled OPEN fixture (96% with center region; whole-frame test missed it) and detected three people plus kites on TensorFlow's reference image. A fixture result is not an accuracy benchmark. A physical webcam/CCTV or real-store trial has not been completed. No seven-day unattended run is claimed.

The public site uses Pages Direct Upload with a D1 DB binding. Source uploads do not automatically deploy. No new charges or competition submission were made. See COMPREHENSIVE_QUALITY_REVIEW.md for major and minor remaining work.
