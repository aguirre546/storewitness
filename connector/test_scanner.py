import unittest
from unittest.mock import MagicMock, patch
from types import SimpleNamespace
from scanner import roi_plan, native_sign_height, guard_small_sign, analyse


class ScannerQualityTests(unittest.TestCase):
    def test_native_4k_retained_and_small_roi_upscale_is_bounded(self):
        self.assertEqual(roi_plan(3840, 2160, [0, 0, 100, 100]), ((0, 0, 3840, 2160), (3840, 2160)))
        self.assertEqual(roi_plan(3840, 2160, [25, 25, 10, 10]), ((960, 540, 1344, 756), (640, 360)))
        self.assertEqual(roi_plan(640, 480, [0, 0, 5, 5]), ((0, 0, 32, 24), (64, 48)))
        bounds, output = roi_plan(20000, 12000, [0, 0, 100, 100])
        self.assertLessEqual(max(output), 4096)
        self.assertLessEqual(output[0]*output[1], 8847360+4096)
        self.assertEqual(bounds, (0, 0, 20000, 12000))
        with self.assertRaises(ValueError):
            roi_plan(1, 1, [0, 0, 5, 5])

    def test_native_height_uses_original_pixels_and_only_actual_sign_words(self):
        boxes = [[[0, 0], [80, 0], [80, 16], [0, 16]], [[0, 0], [80, 0], [80, 50], [0, 50]]]
        self.assertEqual(native_sign_height([('CLOSE', .99), ('background', .99)], boxes, 2), 8)
        self.assertEqual(native_sign_height([('CLOSED', .99)], boxes, 1), 16)
        self.assertIsNone(native_sign_height([('DISCLOSED', .99)], boxes, 1))
        self.assertIsNone(native_sign_height([('OPEN', .50)], boxes, 1))
        self.assertIsNone(native_sign_height([('OPEN', .99)], None, 1))
        self.assertIsNone(native_sign_height([('OPEN', .99)], [], 1))

    def test_tiny_readable_sign_cannot_confirm_status_after_upscaling(self):
        for status in ('OPEN', 'CLOSED'):
            decision = dict(status=status, confidence=.99, reason='Readable sign', brightness=200)
            result = guard_small_sign(decision, 8)
            self.assertEqual(result['status'], 'UNCERTAIN')
            self.assertEqual(result['confidence'], 0)
            self.assertIn('native pixels', result['reason'])
            self.assertEqual(decision['status'], status)
            self.assertIs(guard_small_sign(decision, 10), decision)
            self.assertIs(guard_small_sign(decision, None), decision)

    def test_unsupported_usb_high_resolution_falls_back_without_leaking_source(self):
        image = MagicMock()
        image.shape = (480, 640, 3)
        image.__getitem__.return_value = image
        cap = MagicMock()
        cap.get.side_effect = [640, 480]
        cap.isOpened.return_value = True
        cap.read.side_effect = [(False, None), (True, image)]
        gray = MagicMock()
        gray.mean.return_value = 200
        cv = SimpleNamespace(VideoCapture=lambda: cap, CAP_PROP_FRAME_WIDTH=3, CAP_PROP_FRAME_HEIGHT=4,
                             COLOR_BGR2GRAY=6, INTER_CUBIC=2, INTER_AREA=3, cvtColor=lambda *_: gray)
        result = SimpleNamespace(txts=['CLOSE'], scores=[.99], boxes=[[[0, 0], [80, 0], [80, 30], [0, 30]]])
        rapid = SimpleNamespace(RapidOCR=lambda **_: lambda _: result)
        config = dict(kind='usb', source='0', roi=[0, 0, 100, 100],
                      schedule=dict(open='00:00', close='23:59', days=list(range(7))))
        with patch.dict('sys.modules', {'cv2': cv, 'numpy': SimpleNamespace(), 'rapidocr': rapid}):
            reading = analyse(config)
        self.assertEqual(cap.set.call_args_list[0].args, (3, 3840))
        self.assertEqual(cap.set.call_args_list[1].args, (4, 2160))
        self.assertEqual(cap.set.call_args_list[2].args, (3, 640))
        self.assertEqual(cap.set.call_args_list[3].args, (4, 480))
        self.assertEqual(reading['status'], 'CLOSED')
        self.assertEqual(reading['quality']['frameWidth'], 640)
        self.assertEqual(reading['quality']['nativeTextBoxHeight'], 30)
        self.assertNotIn('txts', reading)
        self.assertNotIn('source', reading)
        cap.release.assert_called_once()


if __name__ == '__main__':
    unittest.main()
