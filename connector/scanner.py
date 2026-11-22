"""One bounded, local-only capture/OCR job. Private camera source arrives on stdin."""
import contextlib
import json
import math
import os
import re
import sys
import time
from core import decide


def roi_plan(width, height, roi):
    """Keep available camera detail; bound OCR work and enlarge small crops at most 2x."""
    if width < 1 or height < 1:
        raise ValueError('Camera returned an empty frame.')
    x, y, w, h = roi
    left, top = int(x*width/100), int(y*height/100)
    right, bottom = min(width, int((x+w)*width/100)), min(height, int((y+h)*height/100))
    crop_w, crop_h = right-left, bottom-top
    if crop_w < 1 or crop_h < 1:
        raise ValueError('Selected sign area contains no pixels.')
    scale = min(2, max(1, 640/crop_w, 160/crop_h))
    scale = min(scale, 4096/crop_w, 4096/crop_h, math.sqrt(8847360/(crop_w*crop_h)))
    out_w, out_h = max(1, round(crop_w*scale)), max(1, round(crop_h*scale))
    return (left, top, right, bottom), (out_w, out_h)


def native_sign_height(lines, boxes, scale_y):
    """Measure sign-line height before any local enlargement, when boxes exist."""
    if boxes is None or scale_y <= 0:
        return None
    heights = []
    for index, (text, confidence) in enumerate(lines):
        if confidence < .85 or not set(re.findall(r'[A-Z]+', str(text).upper())) & {'OPEN', 'CLOSE', 'CLOSED'}:
            continue
        try:
            points = boxes[index]
            a = math.hypot(float(points[3][0])-float(points[0][0]), float(points[3][1])-float(points[0][1]))
            b = math.hypot(float(points[2][0])-float(points[1][0]), float(points[2][1])-float(points[1][1]))
            height = (a+b)/(2*scale_y)
            if math.isfinite(height) and height > 0:
                heights.append(height)
        except (IndexError, TypeError, ValueError):
            continue
    return round(min(heights), 1) if heights else None


def guard_small_sign(decision, sign_height):
    if decision['status'] != 'UNCERTAIN' and sign_height is not None and sign_height < 10:
        return dict(decision, status='UNCERTAIN', confidence=0,
                    reason='Detected sign text box is below ten native pixels high. Move closer or use optical zoom and check again.')
    return decision


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
                fallback_size = (cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                # Optional requests: devices may deliver a lower supported mode.
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, 3840)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 2160)
            if not cap.isOpened():
                raise ValueError('Camera could not be opened. Check device or RTSP settings.')
            ok, image = cap.read()
            if (not ok or image is None) and config['kind'] == 'usb' and all(value > 0 for value in fallback_size):
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, fallback_size[0])
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, fallback_size[1])
                ok, image = cap.read()
            captured = time.time()
            if not ok or image is None:
                raise ValueError('Camera did not return an image.')
        finally:
            cap.release()
    if config.get('mirror'):
        image = cv2.flip(image, 1)
    height, width = image.shape[:2]
    (left, top, right, bottom), (ocr_w, ocr_h) = roi_plan(width, height, config['roi'])
    image = image[top:bottom, left:right]
    crop_w, crop_h = right-left, bottom-top
    brightness = round(float(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY).mean()))
    if (ocr_w, ocr_h) != (crop_w, crop_h):
        image = cv2.resize(image, (ocr_w, ocr_h), interpolation=cv2.INTER_CUBIC if ocr_h > crop_h else cv2.INTER_AREA)
    result = engine(image)
    lines = list(zip(result.txts or (), result.scores if result.scores is not None else ()))
    decision = decide(lines, config['schedule'], captured, brightness)
    sign_height = native_sign_height(lines, getattr(result, 'boxes', None), ocr_h/crop_h)
    decision = guard_small_sign(decision, sign_height)
    quality = dict(frameWidth=width, frameHeight=height, roiWidth=crop_w, roiHeight=crop_h,
                   ocrWidth=ocr_w, ocrHeight=ocr_h, nativeTextBoxHeight=sign_height,
                   advice='Use a tight sign area, steady focus and good lighting. Ten-metre reading depends on camera, lens and sign size; enlargement cannot restore missing detail.')
    # No image, extracted text, camera address or credential is returned or uploaded.
    return dict(**decision, quality=quality, capturedAt=int(captured*1000), durationMs=round((time.time()-captured)*1000))


if __name__ == '__main__':
    config = json.loads(sys.stdin.read())
    try:
        with open(os.devnull, 'w') as sink, contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
            result = analyse(config)
        print(json.dumps(result))
    except Exception:
        print(json.dumps({'error': 'Capture or text scanning failed. Check camera connection, dependencies and model readiness.'}))
        sys.exit(1)
