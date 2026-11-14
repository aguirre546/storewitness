import datetime as dt
import json
import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock
from core import validate, decide, expected_open, PHT, save_config, load_config
from app import Connector

def config():
    return dict(origin='http://127.0.0.1:4330', store='11111111-1111-4111-8111-111111111111',
                token='x'*72, kind='demo', source='', roi=[0,0,100,100], mirror=False,
                schedule=dict(open='08:00', close='20:00', days=list(range(7))))

class CoreTests(unittest.TestCase):
    def test_configuration_bounds_and_no_arbitrary_token_destination(self):
        self.assertEqual(validate(config())['kind'], 'demo')
        for changes in [dict(origin='https://evil.test'), dict(store='bad'), dict(token='short'),
                        dict(kind='rtsp',source='file:///secret'),dict(kind='usb',source='-1'),
                        dict(roi=[80,0,40,90]),dict(roi=[0,0,0,100]),dict(schedule={'open':'25:00','close':'20:00','days':[0]})]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                validate(dict(config(), **changes))

    def test_close_closed_conflict_dark_and_hours(self):
        day = dt.datetime(2026,11,14,12,tzinfo=PHT).timestamp()
        night = dt.datetime(2026,11,14,23,tzinfo=PHT).timestamp()
        schedule = config()['schedule']
        for word in ['CLOSE','CLOSED']:
            self.assertEqual(decide([(word,.98)],schedule,day,200)['status'],'CLOSED')
        self.assertEqual(decide([('OPEN',.98)],schedule,day,200)['status'],'OPEN')
        self.assertEqual(decide([('OPEN',.98)],schedule,night,200)['status'],'UNCERTAIN')
        self.assertEqual(decide([('OPEN',.98),('CLOSED',.99)],schedule,day,200)['status'],'UNCERTAIN')
        self.assertEqual(decide([('CLOSE',.5)],schedule,day,200)['status'],'UNCERTAIN')
        self.assertEqual(decide([],schedule,night,0)['status'],'UNCERTAIN')
        self.assertEqual(decide([('DISCLOSED',.99)],schedule,day,200)['status'],'UNCERTAIN')

    def test_overnight_schedule_uses_previous_open_day(self):
        schedule=dict(open='20:00',close='04:00',days=[4])
        self.assertTrue(expected_open(schedule,dt.datetime(2026,11,14,2,tzinfo=PHT).timestamp()))
        self.assertFalse(expected_open(schedule,dt.datetime(2026,11,15,2,tzinfo=PHT).timestamp()))

    @unittest.skipUnless(os.name=='nt','Windows encryption')
    def test_windows_protected_storage_roundtrip_and_no_plain_secrets(self):
        c=dict(config(),kind='rtsp',source='rtsp://demo:private-pass@192.168.1.20/live')
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'setup.dpapi'
            save_config(path,c)
            self.assertNotIn(c['token'].encode(),path.read_bytes())
            self.assertNotIn(b'private-pass',path.read_bytes())
            self.assertEqual(load_config(path),c)

class RuntimeTests(unittest.TestCase):
    @patch('app.SETTINGS',Path(tempfile.gettempdir())/'storewitness-nonexistent-test.dpapi')
    def test_mode_isolation_and_status_never_reveals_credentials(self):
        c=Connector()
        with patch('app.api',return_value={'mode':'camera'}),self.assertRaises(ValueError):
            c.configure(config())
        with patch('app.api',return_value={'mode':'replay'}):
            c.configure(config())
        self.assertNotIn('token',json.dumps(c.snapshot()))
        self.assertNotIn('source',c.snapshot()['setup'])

    def test_check_once_never_publishes(self):
        c=Connector();c.config=config()
        p=MagicMock();p.returncode=0;p.communicate.return_value=(json.dumps(dict(status='CLOSED',confidence=.9,reason='Clear sign',brightness=200,capturedAt=int(time.time()*1000))),None)
        with patch('app.subprocess.Popen',return_value=p),patch('app.api') as send:
            c.start(False,'CLOSE');c.thread.join(2)
            send.assert_not_called()
            self.assertEqual(c.snapshot()['last']['status'],'CLOSED')
            self.assertFalse(c.snapshot()['running'])

    def test_stale_frame_cannot_be_sent(self):
        c=Connector();c.config=config()
        p=MagicMock();p.returncode=0;p.communicate.return_value=(json.dumps(dict(status='OPEN',confidence=.9,reason='Clear sign',capturedAt=int(time.time()*1000)-40000)),None)
        with patch('app.subprocess.Popen',return_value=p),patch('app.api') as send:
            c.start(False);c.thread.join(2)
            send.assert_not_called();self.assertIn('too old',c.snapshot()['error'])

    def test_stop_terminates_active_capture(self):
        c=Connector();c.process=MagicMock();c.process.poll.return_value=None
        c.stop();c.process.kill.assert_called_once();self.assertTrue(c.stop_event.is_set())

if __name__=='__main__':
    unittest.main()
