import '@testing-library/jest-dom'
import { vi } from 'vitest'

declare const process: any

// Handle HappyDOM animation cancellation rejections from motion/framer-motion
process.on('unhandledRejection', (reason: any) => {
  if (reason?.name === 'AbortError' || reason?.message?.includes('The animation was canceled')) {
    return
  }
})

// Mock HTMLMediaElement srcObject and media playback in HappyDOM
Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
  get() {
    return this._srcObject || null;
  },
  set(val) {
    this._srcObject = val;
  },
  configurable: true,
});

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();

// Mock MediaDevices and getUserMedia for webcam testing
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockImplementation(async (constraints) => {
      return {
        getTracks: () => [
          {
            stop: vi.fn(),
            kind: 'video',
            label: 'Mock HD Webcam',
            enabled: true,
          },
        ],
      }
    }),
    enumerateDevices: vi.fn().mockImplementation(async () => [
      {
        deviceId: 'cam-01',
        kind: 'videoinput',
        label: 'Front Integrated Webcam HD',
        groupId: 'grp-1',
      },
      {
        deviceId: 'cam-02',
        kind: 'videoinput',
        label: 'External USB Classroom Camera',
        groupId: 'grp-2',
      },
    ]),
  },
})

