"""One bounded, local-only capture/OCR job. Private camera source arrives on stdin."""
import contextlib
import json
import os
import sys
import time
from core import decide


def analyse(config):
    import cv2
    import numpy as np
    from rapidocr import RapidOCR
    # Load models before capturing, so initialization never gives a frame a new timestamp.
    engine = RapidOCR(params={'Global.log_level': 'error', 'EngineConfig.onnxruntime.intra_op_num_threads': 2,
                              'EngineConfig.onnxruntime.inter_op_num_threads': 1})
    if config['kind'] == 'demo':
        image = np.full((480, 800, 3), 245, dtype=np.uint8)
        label = config.get('demoSign', 'OPEN')
        cv2.putText(image, label, (65, 285), cv2.FONT_HERSHEY_SIMPLEX, 3.6, (15, 15, 15), 9, cv2.LINE_AA)
        captured = time.time()
    else:
        source = int(config['source']) if config['kind'] == 'usb' else config['source']
        cap = cv2.VideoCapture()
        try:
            if config['kind'] == 'rtsp':
                cap.open(source, cv2.CAP_FFMPEG, [cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 5000, cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000])
            else:
                cap.open(source)
            if not cap.isOpened():
                raise ValueError('Camera could not be opened. Check device or RTSP settings.')
            ok, image = cap.read()
            captured = time.time()
            if not ok or image is None:
                raise ValueError('Camera did not return an image.')
        finally:
            cap.release()
    if config.get('mirror'):
        image = cv2.flip(image, 1)
    height, width = image.shape[:2]
    x, y, w, h = config['roi']
    image = image[int(y*height/100):int((y+h)*height/100), int(x*width/100):int((x+w)*width/100)]
    brightness = round(float(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY).mean()))
    result = engine(image)
    lines = list(zip(result.txts or (), result.scores if result.scores is not None else ()))
    decision = decide(lines, config['schedule'], captured, brightness)
    # No image, extracted text, camera address or credential is returned or uploaded.
    return dict(**decision, capturedAt=int(captured*1000), durationMs=round((time.time()-captured)*1000))


if __name__ == '__main__':
    config = json.loads(sys.stdin.read())
    try:
        with open(os.devnull, 'w') as sink, contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
            result = analyse(config)
        print(json.dumps(result))
    except Exception:
        print(json.dumps({'error': 'Capture or text scanning failed. Check camera connection, dependencies and model readiness.'}))
        sys.exit(1)
