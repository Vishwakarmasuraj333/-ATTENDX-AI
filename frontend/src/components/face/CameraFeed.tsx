import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';

export interface CameraFeedHandle {
  captureFrame: () => string | null;
  videoElement: HTMLVideoElement | null;
}

interface CameraFeedProps {
  onStreamReady?: () => void;
  className?: string;
  overlayChildren?: React.ReactNode;
}

export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(({
  onStreamReady,
  className = '',
  overlayChildren,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Expose capture method to parent
  useImperativeHandle(ref, () => ({
    videoElement: videoRef.current,
    captureFrame: () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return null;
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    },
  }));

  // Fetch available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn('Could not list media devices:', err);
      }
    };
    getDevices();
  }, []);

  // Initialize camera stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let isCancelled = false;

    const startCamera = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Webcam API is not supported in this browser.');
        }

        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          currentStream.getTracks().forEach(t => t.stop());
          return;
        }

        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsInitializing(false);
            if (onStreamReady) onStreamReady();
          };
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Camera access error:', err);
          setError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please enable camera access in your browser.'
              : err.name === 'NotFoundError'
              ? 'No camera hardware detected on this device.'
              : `Camera initialization error: ${err.message}`
          );
          setIsInitializing(false);
        }
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedDeviceId]);

  return (
    <div className={`relative bg-midnight rounded-3xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100" // Mirrored view
      />

      {/* Loading state */}
      {isInitializing && (
        <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
          <RefreshCw className="w-8 h-8 text-aiTeal animate-spin" />
          <p className="text-sm font-semibold tracking-wide">
            Initializing High-Res Camera Sensor...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-midnight/90 flex flex-col items-center justify-center p-6 text-center">
          <CameraOff className="w-12 h-12 text-dangerRed mb-3" />
          <h4 className="text-base font-bold text-white mb-1">
            Camera Sensor Unavailable
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {error}
          </p>
          <button
            onClick={() => setSelectedDeviceId(selectedDeviceId)}
            className="px-4 py-2 bg-aiTeal hover:bg-aiTeal-dark text-midnight font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      )}

      {/* Overlay Children (Bounding boxes, HUD, scanner) */}
      {overlayChildren}

      {/* Bottom Camera Selector Bar */}
      {devices.length > 1 && (
        <div className="absolute bottom-4 left-4 z-20">
          <select
            value={selectedDeviceId}
            onChange={e => setSelectedDeviceId(e.target.value)}
            className="bg-midnight/80 backdrop-blur-md text-white text-xs border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-aiTeal"
          >
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});

