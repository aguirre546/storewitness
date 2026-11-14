"""Validation, sign decisions, and protected local settings. No camera imports here."""
import base64
import ctypes
import datetime as dt
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

PHT = dt.timezone(dt.timedelta(hours=8))
API_ORIGINS = {'https://studio.victoraguirre.site', 'https://storewitness.pages.dev', 'http://127.0.0.1:4330'}


def validate(raw):
    if not isinstance(raw, dict):
        raise ValueError('Enter setup details.')
    origin = str(raw.get('origin', '')).rstrip('/')
    if origin not in API_ORIGINS:
        raise ValueError('Choose the StoreWitness website or the local test server.')
    store = str(raw.get('store', ''))
    if not re.fullmatch(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', store):
        raise ValueError('Enter the public Store ID.')
    token = str(raw.get('token', ''))
    if not 32 <= len(token) <= 200 or any(c.isspace() for c in token):
        raise ValueError('Enter the private pairing token.')
    kind = raw.get('kind')
    if kind not in ('demo', 'usb', 'rtsp'):
        raise ValueError('Choose a camera type.')
    source = str(raw.get('source', '')).strip()
    if kind == 'usb':
        if not re.fullmatch(r'\d{1,2}', source):
            raise ValueError('USB camera index must be a number from 0 to 99.')
    if kind == 'rtsp':
        try:
            parsed = urlsplit(source)
            if parsed.scheme not in ('rtsp', 'rtsps') or not parsed.hostname or len(source) > 1000:
                raise ValueError()
            _ = parsed.port
        except ValueError:
            raise ValueError('Enter an RTSP/RTSPS address supplied by the camera owner.') from None
    roi = raw.get('roi', [0, 0, 100, 100])
    if not isinstance(roi, list) or len(roi) != 4 or any(type(v) not in (int, float) or not 0 <= v <= 100 for v in roi):
        raise ValueError('Sign area values must be percentages from 0 to 100.')
    x, y, w, h = roi
    if w < 5 or h < 5 or x + w > 100 or y + h > 100:
        raise ValueError('Keep the sign area inside the image with at least 5% width and height.')
    schedule = raw.get('schedule', {})
    if not isinstance(schedule, dict):
        raise ValueError('Check the opening schedule.')
    for key in ('open', 'close'):
        if not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', str(schedule.get(key, ''))):
            raise ValueError('Enter valid opening and closing times.')
    days = schedule.get('days')
    if not isinstance(days, list) or not days or any(type(v) is not int or not 0 <= v <= 6 for v in days):
        raise ValueError('Choose at least one opening day.')
    if schedule['open'] == schedule['close']:
        raise ValueError('Opening and closing times must differ.')
    return dict(origin=origin, store=store, token=token, kind=kind, source=source,
                roi=roi, mirror=raw.get('mirror') is True,
                schedule=dict(open=schedule['open'], close=schedule['close'], days=sorted(set(days))))


def expected_open(schedule, timestamp):
    now = dt.datetime.fromtimestamp(timestamp, PHT)
    clock = now.strftime('%H:%M')
    start, end, days = schedule['open'], schedule['close'], schedule['days']
    if start < end:
        return now.weekday() in days and start <= clock < end
    return (clock >= start and now.weekday() in days) or (clock < end and (now.weekday() - 1) % 7 in days)


def decide(lines, schedule, timestamp, brightness):
    signs = set()
    for text, confidence in lines:
        if confidence >= .85:
            words = set(re.findall(r'[A-Z]+', str(text).upper()))
            if 'OPEN' in words:
                signs.add('OPEN')
            if words & {'CLOSE', 'CLOSED'}:
                signs.add('CLOSED')
    if len(signs) == 1:
        status = next(iter(signs))
        if status == 'OPEN' and not expected_open(schedule, timestamp):
            return dict(status='UNCERTAIN', confidence=0, reason='OPEN sign conflicts with configured PHT opening hours.', brightness=brightness)
        return dict(status=status, confidence=.9, reason='Local connector read a clear ' + status + ' sign.', brightness=brightness)
    reason = 'Conflicting OPEN and CLOSED signs. Narrow the sign area.' if signs else 'No clear sign. Lighting alone cannot confirm closure.'
    return dict(status='UNCERTAIN', confidence=0, reason=reason, brightness=brightness)


class Blob(ctypes.Structure):
    _fields_ = [('size', ctypes.c_ulong), ('data', ctypes.POINTER(ctypes.c_ubyte))]


def protect(data, decrypt=False):
    if os.name != 'nt':
        raise ValueError('Saved credentials require Windows protection. Use session-only setup on this computer.')
    buf = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_ubyte)))
    dest = Blob()
    fn = ctypes.windll.crypt32.CryptUnprotectData if decrypt else ctypes.windll.crypt32.CryptProtectData
    if not fn(ctypes.byref(source), None, None, None, None, 1, ctypes.byref(dest)):
        raise ValueError('Windows could not protect or unlock the saved setup.')
    try:
        return ctypes.string_at(dest.data, dest.size)
    finally:
        ctypes.windll.kernel32.LocalFree(dest.data)


def save_config(path, config):
    # Encrypt the entire record, including RTSP URL and pairing token, for this Windows user.
    encrypted = base64.b64encode(protect(json.dumps(config).encode()))
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    pending = path.with_suffix('.tmp')
    pending.write_bytes(encrypted)
    os.replace(pending, path)


def load_config(path):
    return validate(json.loads(protect(base64.b64decode(Path(path).read_bytes()), decrypt=True)))
