"""StoreWitness establishment connector. Local dashboard: 127.0.0.1:4332."""
import argparse
import json
import secrets
import subprocess
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from core import validate, load_config, save_config

ROOT = Path(__file__).resolve().parent
SETTINGS = ROOT / 'private' / 'setup.dpapi'


def api(config, action, body):
    request = Request(config['origin'] + '/api/boards/' + config['store'] + '/' + action,
                      data=json.dumps(body).encode(), headers={'Content-Type': 'application/json',
                      'Authorization': 'Bearer ' + config['token'],
                      'User-Agent': 'StoreWitness-Connector/0.1', 'Accept': 'application/json'}, method='POST')
    try:
        with urlopen(request, timeout=8) as response:
            return json.loads(response.read(65536))
    except HTTPError as error:
        messages = {401: 'Pairing rejected. Reconnect with the current private token.', 404: 'Store not found.',
                    409: 'Store changed or is archived. Check owner controls.', 429: 'Service limit reached. Waiting before retry.'}
        raise ValueError(messages.get(error.code, 'Service rejected the update. Check clock, source mode and connection.')) from None
    except (URLError, TimeoutError, OSError, ValueError):
        raise ValueError('StoreWitness could not be reached. No old frame will be queued for later upload.') from None


class Connector:
    def __init__(self):
        self.lock = threading.RLock()
        self.config = None
        self.saved = False
        self.process = None
        self.thread = None
        self.stop_event = threading.Event()
        self.status = dict(running=False, phase='Setup needed', last=None, published=False, error=None)
        if SETTINGS.exists():
            try:
                self.config = load_config(SETTINGS)
                self.saved = True
                self.status['phase'] = 'Saved setup loaded. Test before starting.'
            except Exception:
                self.status['error'] = 'Saved setup could not be unlocked. Enter details again.'

    def snapshot(self):
        with self.lock:
            c = self.config
            # Never return saved RTSP address or private token to status requests.
            public = {k: c[k] for k in ('origin', 'store', 'kind', 'roi', 'schedule', 'mirror')} if c else None
            return dict(**self.status, setup=public, saved=self.saved,
                        publicUrl=c['origin'] + '/?store=' + c['store'] + '&view=customer' if c else None)

    def configure(self, raw):
        with self.lock:
            if self.thread and self.thread.is_alive():
                raise ValueError('Stop the current check before changing setup.')
            config = validate(raw)
            board = api(config, 'pair', {})
            required = 'replay' if config['kind'] == 'demo' else 'camera'
            if board.get('mode') != required or board.get('archived'):
                raise ValueError('Demo needs a separate replay store. USB/RTSP needs an active camera store.')
            self.config = config
            self.saved = False
            if raw.get('remember'):
                save_config(SETTINGS, config)
                self.saved = True
            elif SETTINGS.exists():
                SETTINGS.unlink()
            self.status.update(phase='Connected. Run a check without publishing.', last=None, error=None)

    def stop(self):
        self.stop_event.set()
        with self.lock:
            process = self.process
            self.status.update(running=False, phase='Stopping. A request already accepted by the website cannot be undone.')
        if process and process.poll() is None:
            try:
                process.kill()
            except OSError:
                pass

    def start(self, publish=False, demo_sign='OPEN'):
        with self.lock:
            if not self.config:
                raise ValueError('Connect a store first.')
            if self.thread and self.thread.is_alive():
                raise ValueError('A check is still running. Wait for it to stop.')
            if demo_sign not in ('OPEN', 'CLOSE', 'CLOSED', 'NONE'):
                raise ValueError('Choose a demo sign.')
            config = dict(self.config, demoSign=demo_sign)
            self.stop_event = threading.Event()
            self.status.update(running=True, phase='Preparing a fresh local check…', error=None, published=False)
            self.thread = threading.Thread(target=self._loop, args=(config, publish, self.stop_event), daemon=True)
            self.thread.start()

    def _loop(self, config, publish, stopped):
        failures = 0
        try:
            while not stopped.is_set():
                started = time.monotonic()
                try:
                    # Credentials travel through stdin, never process arguments or logs.
                    creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
                    process = subprocess.Popen([sys.executable, str(ROOT / 'scanner.py')], stdin=subprocess.PIPE,
                                               stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True,
                                               cwd=ROOT, creationflags=creationflags)
                    with self.lock:
                        self.process = process
                    if stopped.is_set():
                        process.kill()
                    try:
                        out, _ = process.communicate(json.dumps(config), timeout=28)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.communicate()
                        raise ValueError('Camera/scanner timed out. Check connection or prepare the OCR models.') from None
                    if stopped.is_set():
                        break
                    try:
                        result = json.loads(out)
                    except ValueError:
                        raise ValueError('Scanner did not return a valid result. Check installed dependencies.') from None
                    if process.returncode or 'error' in result:
                        raise ValueError(result.get('error', 'Scanner failed.'))
                    age = int(time.time()*1000) - result['capturedAt']
                    if age < -5000 or age >= 30000:
                        raise ValueError('Frame is too old. Check computer clock and scanning speed.')
                    with self.lock:
                        self.status.update(last=result, published=False, error=None, phase='Check completed locally. No observation sent.')
                    if publish and not stopped.is_set():
                        body = {k: result[k] for k in ('status', 'confidence', 'reason', 'capturedAt')}
                        body.update(source='replay' if config['kind'] == 'demo' else 'camera', observationId=str(uuid.uuid4()))
                        board = api(config, 'observe', body)
                        with self.lock:
                            self.status.update(published=True, phase='Website acknowledged: ' + board['status'] + '. Checks continue while this app runs.')
                    failures = 0
                except Exception as error:
                    failures += 1
                    with self.lock:
                        self.status.update(error=str(error) if isinstance(error, ValueError) else 'Local check failed. Check setup and restart.',
                                           phase='No fresh update sent. Customer status will expire if no other sender is active.', published=False)
                finally:
                    with self.lock:
                        self.process = None
                if not publish:
                    break
                # Drop failures; never replay an old frame after reconnecting.
                delay = min(60, 10 * 2**min(failures, 3)) if failures else 10
                stopped.wait(max(0, delay - (time.monotonic() - started)))
        finally:
            with self.lock:
                self.status['running'] = False
                if stopped.is_set():
                    self.status['phase'] = 'Stopped. No further camera checks will be sent.'


def serve(port=4332):
    connector = Connector()
    csrf = secrets.token_urlsafe(32)
    origin = 'http://127.0.0.1:' + str(port)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # Do not log private form fields or camera addresses.

        def respond(self, body, status=200, kind='application/json'):
            payload = body.encode() if isinstance(body, str) else json.dumps(body).encode()
            self.send_response(status)
            self.send_header('Content-Type', kind + '; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
            self.end_headers()
            self.wfile.write(payload)

        def allowed(self, private=False):
            return self.headers.get('Host') == '127.0.0.1:' + str(port) and (
                not private or (self.headers.get('X-Setup-Token') == csrf and self.headers.get('Origin', origin) == origin))

        def do_GET(self):
            if not self.allowed():
                return self.respond({'error': 'Use the local setup address.'}, 403)
            if self.path == '/':
                return self.respond((ROOT / 'setup.html').read_text(encoding='utf-8').replace('__SETUP_TOKEN__', csrf), kind='text/html')
            if self.path in ('/setup.js', '/setup.css'):
                name = self.path[1:]
                return self.respond((ROOT / name).read_text(encoding='utf-8'), kind='text/javascript' if name.endswith('.js') else 'text/css')
            if self.path == '/api/status' and self.allowed(True):
                return self.respond(connector.snapshot())
            return self.respond({'error': 'Not found.'}, 404)

        def do_POST(self):
            if not self.allowed(True) or not self.headers.get('Content-Type', '').startswith('application/json'):
                return self.respond({'error': 'Open setup from this app and retry.'}, 403)
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= 8192:
                    return self.respond({'error': 'Setup request is too large or empty.'}, 413)
                raw = json.loads(self.rfile.read(size))
                if not isinstance(raw, dict):
                    raise ValueError('Expected setup details.')
                if self.path == '/api/configure':
                    connector.configure(raw)
                elif self.path in ('/api/test', '/api/start'):
                    connector.start(self.path == '/api/start', raw.get('demoSign', 'OPEN'))
                elif self.path == '/api/stop':
                    connector.stop()
                else:
                    return self.respond({'error': 'Not found.'}, 404)
                return self.respond(connector.snapshot())
            except (ValueError, OSError):
                # ValueError messages are controlled above; never echo raw submitted input.
                error = sys.exc_info()[1]
                return self.respond({'error': str(error) if isinstance(error, ValueError) and not isinstance(error, json.JSONDecodeError) else 'Setup could not be read or saved.'}, 400)

    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.daemon_threads = True
    print('StoreWitness establishment setup: ' + origin, flush=True)
    print('Monitoring starts only after you connect, test, and click Start monitoring.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        connector.stop()
        server.server_close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4332)
    serve(parser.parse_args().port)
