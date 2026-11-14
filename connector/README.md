# StoreWitness establishment connector

Local Python app for one participating store and one camera. Customers use the existing public StoreWitness website on their phones. The establishment runs this connector on its own Windows computer. There are no paid API keys.

## First-time setup on Windows

1. Install Python 3.11 or later from https://www.python.org/downloads/ . Extract the StoreWitness source ZIP. Keep the connector folder and its files together.
2. In PowerShell, open this folder and run `./Start-Connector.ps1 -Install`. This installs the pinned open-source dependencies into the local `.venv`; it does not enable billing, change execution policy, or install an always-on Windows service. If script execution is restricted, run `py -3 -m venv .venv`, then `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`, then `.\.venv\Scripts\python.exe app.py`.
3. Open http://127.0.0.1:4332 on that same computer. Keep the terminal running.
4. On the StoreWitness website, create an active **camera** board in Operator studio. Save its Store ID and private owner token. In Private recovery and store management, create a separate connector key and use that key in the local app. For the built-in demonstration, create a separate **replay** board instead. Stop other senders using the same board.
5. In the local setup dashboard, select the service, enter Store ID/token and camera connection. USB uses camera index 0, 1, etc. An IP camera or a DVR/NVR must supply an accessible RTSP/RTSPS stream. Ask the camera owner/vendor for its address; do not expose a camera to the internet or scan other networks. Wi-Fi alone does not mean RTSP support. Cloud-only proprietary cameras may be incompatible. This is not ONVIF discovery or an integration with every CCTV brand.
6. Set the sign area as X/Y/width/height percentages and opening hours in Philippine time. Test with a large OPEN sign, then CLOSE or CLOSED. Narrow the area if background lettering causes conflicts. Optional mirror correction applies before cropping.
7. Click **Connect and validate store**, then **Check once · do not publish**. First-use OCR models may need internet to download. If the bounded check times out during the first model download, retry after downloading has completed. Check computer clock and camera access if errors continue.
8. Click **Start monitoring** only after a readable result. Three consistent observations, at least ten seconds apart, confirm status on the website. Use **Stop** before changing the demo sign or setup. Test mode runs actual local OCR on generated signs and can publish only to replay boards.
9. Open the customer phone page or share its URL. It contains the public Store ID, never the private key or CCTV address. Use existing owner controls on the website for break time, overrides, branch links and history.

## Operation and privacy

- Checks run about every ten seconds, slower after failures. Each camera/OCR job has a 28-second process limit and network delivery has an eight-second timeout. Captures older than 30 seconds are discarded locally; the API also checks freshness. Camera setup/read time is bounded by process termination. Reopening the camera for each check favors bounded recovery over efficient continuous streaming; camera warm-up and RTSP latency need field testing.
- The Python process continues monitoring when its dashboard tab is closed. Sleeping, shutting down or closing the terminal stops monitoring. This release does not install automatic startup or a Windows service. Saved setup loads after restart, but monitoring requires an explicit Start.
- A Windows user can opt in to save setup using DPAPI encryption for that Windows login. The camera address and token are encrypted together under `private/setup.dpapi`. Non-Windows systems use session-only setup. A new pairing token requires reconnecting. Do not commit the private folder, models, virtual environment or credentials.
- The dashboard binds only to `127.0.0.1`, validates Host and per-session setup token, rejects cross-origin writes and limits request size. Do not reverse-proxy it onto the internet. It has no remote administration, multi-user accounts, installer signing or commercial security audit.
- Frames and extracted lettering are processed locally; this app does not store video or upload images. Only status, confidence, a fixed reason, capture timestamp and observation ID go to the selected StoreWitness service. Camera credentials remain local. OCR dependencies/models are third-party downloads. This connector reads signs, not people/objects or trained shutters. A dark/empty scene remains uncertain without a readable sign.
- Unreadable signs publish UNCERTAIN. Capture/scanner/network failure sends no queued old frame: public status ages to UNAVAILABLE when no other sender is active. An owner override can remain active until its chosen expiry. One sender per board avoids observation spacing conflicts.
- Same-LAN RTSP/RTSPS and webcam code paths are implemented. A physical USB camera and real DVR/NVR have not been validated by generated-sign tests. Never call synthetic test results a field accuracy rate.
- Customer background/locked-screen alerts, route guidance inside another app and direct Google Maps listing updates are separate features.

## Development checks

Run `.venv/Scripts/python.exe -m unittest discover -s . -p test_connector.py` from this folder. The website's `node --test` suite remains separate. To start without PowerShell, run `.venv/Scripts/python.exe app.py`. Bind address remains loopback; default port is 4332. The public website does not need Python installed on customers' phones.

References: [OpenCV VideoCapture](https://docs.opencv.org/4.x/d8/dfe/classcv_1_1VideoCapture.html), [RapidOCR](https://github.com/RapidAI/RapidOCR), [RapidOCR usage](https://rapidai.github.io/RapidOCRDocs/latest/install_usage/rapidocr/usage/).
