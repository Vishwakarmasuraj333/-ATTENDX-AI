import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanFace,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  Camera,
  Activity,
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CameraFeed, CameraFeedHandle } from '../components/face/CameraFeed';
import { FaceBoundingBox, BoundingBoxData } from '../components/face/FaceBoundingBox';
import { LivenessIndicator } from '../components/face/LivenessIndicator';
import { Badge } from '../components/ui/Badge';
import { apiRequest } from '../api/client';
import { AttendanceSession } from '../types';

interface LiveEventItem {
  id: string;
  student_name: string;
  enrollment_number: string;
  roll_number: string;
  confidence: number;
  liveness_score: number;
  time: string;
  status: string;
}

export const LiveAttendance: React.FC = () => {
  const cameraRef = useRef<CameraFeedHandle>(null);

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [detectionResults, setDetectionResults] = useState<BoundingBoxData[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEventItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live session counters
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Load available sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await apiRequest<AttendanceSession[]>('/attendance/sessions');
        setSessions(data);
        if (data.length > 0) {
          const active = data.find(s => s.status === 'Active') || data[0];
          setSelectedSessionId(active.id);
          setActiveSession(active);
          setPresentCount(active.present_count);
          setAbsentCount(active.absent_count);
          setLateCount(active.late_count);
        }
      } catch (err) {
        console.error('Failed to load attendance sessions:', err);
      }
    };
    fetchSessions();
  }, []);

  // Update active session when dropdown selection changes
  const handleSessionChange = (sessId: number) => {
    setSelectedSessionId(sessId);
    const target = sessions.find(s => s.id === sessId);
    if (target) {
      setActiveSession(target);
      setPresentCount(target.present_count);
      setAbsentCount(target.absent_count);
      setLateCount(target.late_count);
    }
  };

  // Connect WebSocket for real-time live events
  useEffect(() => {
    if (!selectedSessionId) return;

    const wsUrl = `ws://localhost:8000/api/v1/face-engine/ws/attendance/${selectedSessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = event => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'ATTENDANCE_MARKED') {
          // Play subtle audio verification chime if enabled
          if (soundEnabled) {
            playVerificationTone();
          }

          setPresentCount(payload.present_count);
          setAbsentCount(payload.absent_count);

          const newEvt: LiveEventItem = {
            id: Math.random().toString(),
            student_name: payload.student_name,
            enrollment_number: payload.enrollment_number,
            roll_number: payload.roll_number,
            confidence: payload.confidence,
            liveness_score: payload.liveness_score,
            time: payload.check_in_time,
            status: 'Verified',
          };
          setLiveEvents(prev => [newEvt, ...prev.slice(0, 19)]);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [selectedSessionId, soundEnabled]);

  // Audio chime using Web Audio API synthesis (no external audio files needed!)
  const playVerificationTone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable
    }
  };

  // Live frame processing loop (runs when isScanning is active)
  useEffect(() => {
    let intervalId: any = null;

    if (isScanning && selectedSessionId) {
      intervalId = setInterval(async () => {
        if (!cameraRef.current) return;
        const frameBase64 = cameraRef.current.captureFrame();
        if (!frameBase64) return;

        try {
          const res = await apiRequest<{
            session_id: number;
            faces_detected_count: number;
            results: BoundingBoxData[];
            latency_ms: number;
          }>('/face-engine/verify-frame', {
            method: 'POST',
            body: JSON.stringify({
              session_id: selectedSessionId,
              image_base64: frameBase64,
            }),
          });

          setDetectionResults(res.results || []);

          // Process verified detections
          res.results.forEach(r => {
            if (r.attendance_marked) {
              // Also add to local live events list
              const newEvt: LiveEventItem = {
                id: Math.random().toString(),
                student_name: r.matched_student_name || 'Student',
                enrollment_number: r.matched_enrollment_number || '',
                roll_number: '',
                confidence: r.confidence_score,
                liveness_score: r.liveness_score,
                time: new Date().toLocaleTimeString(),
                status: 'Verified',
              };
              setLiveEvents(prev => [newEvt, ...prev.slice(0, 19)]);
            }
          });
        } catch (err) {
          console.warn('Frame verification tick notice:', err);
        }
      }, 1200); // 1.2s cadence for smooth deep learning inference
    } else {
      setDetectionResults([]);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, selectedSessionId]);

  return (
    <div className="space-y-6">
      {/* Header & Session Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-deepNavy p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-aiTeal/10 rounded-2xl text-aiTeal">
            <ScanFace className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-midnight dark:text-white">
              Live Face Recognition Attendance
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              YuNet DNN Face Detection • SFace Cosine Matching • Anti-Spoofing Liveness
            </p>
          </div>
        </div>

        {/* Session Selector & Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSessionId || ''}
            onChange={e => handleSessionChange(Number(e.target.value))}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-midnight dark:text-white focus:outline-none focus:border-aiTeal"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.subject_code} • {s.subject_name?.slice(0, 24)}... ({s.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-aiTeal transition-colors"
            title={soundEnabled ? 'Mute verification chime' : 'Enable verification chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-aiTeal" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all ${
              isScanning
                ? 'bg-dangerRed text-white hover:bg-dangerRed-dark shadow-dangerRed/20'
                : 'bg-aiTeal text-midnight hover:bg-aiTeal-light shadow-glow-teal'
            }`}
          >
            {isScanning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Stop Live Recognition</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Live Recognition</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Live Video Feed (2 cols) & Real-Time Verified Roster (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Viewport & Recognition Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-midnight">
            <CameraFeed
              ref={cameraRef}
              className="w-full h-full"
              overlayChildren={
                <>
                  <LivenessIndicator isScanning={isScanning} />
                  <FaceBoundingBox results={detectionResults} />
                </>
              }
            />

            {/* Top Status Bar Inside Video */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md ${
                  isScanning
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-slate-800/80 text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                {isScanning ? 'LIVE INFERENCE STREAM' : 'CAMERA STANDBY'}
              </span>
              {activeSession && (
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-midnight/80 backdrop-blur-md text-slate-300 border border-slate-700/80">
                  {activeSession.room || 'Classroom Hall'}
                </span>
              )}
            </div>
          </div>

          {/* Real-time Session KPI Pills */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-soft">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eligible Class</p>
              <p className="text-xl font-black text-midnight dark:text-white mt-0.5">
                {activeSession?.eligible_students_count || 0}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-soft">
              <p className="text-[10px] font-bold text-successGreen uppercase tracking-wider">Verified Present</p>
              <p className="text-xl font-black text-successGreen mt-0.5">{presentCount}</p>
            </div>
            <div className="p-3 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-soft">
              <p className="text-[10px] font-bold text-warningAmber uppercase tracking-wider">Late Arrivals</p>
              <p className="text-xl font-black text-warningAmber mt-0.5">{lateCount}</p>
            </div>
            <div className="p-3 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-soft">
              <p className="text-[10px] font-bold text-dangerRed uppercase tracking-wider">Unverified Absent</p>
              <p className="text-xl font-black text-dangerRed mt-0.5">{absentCount}</p>
            </div>
          </div>
        </div>

        {/* Right: Real-time Live Check-In Feed */}
        <div className="bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-midnight dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-aiTeal" /> Live Verification Stream
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                WebSocket event feed
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-aiTeal/15 text-aiTeal font-bold rounded-full">
              {liveEvents.length} events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
            {liveEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ScanFace className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Awaiting facial verification events
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Click 'Start Live Recognition' above to begin scanning students.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {liveEvents.map((evt, idx) => (
                  <motion.div
                    key={evt.id || idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-successGreen/15 text-successGreen flex items-center justify-center font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-midnight dark:text-white">
                          {evt.student_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {evt.enrollment_number}
                          </span>
                          <span className="text-[10px] text-aiTeal font-mono font-semibold">
                            Match: {(evt.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {evt.time}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-successGreen font-bold rounded">
                        PAD Live
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

