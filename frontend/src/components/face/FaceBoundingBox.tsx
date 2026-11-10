import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, UserX } from 'lucide-react';

export interface BoundingBoxData {
  bbox: [number, number, number, number]; // [x, y, w, h] in frame coordinates
  detection_confidence: number;
  liveness_score: number;
  liveness_status: string;
  match_status: 'Verified' | 'Unknown' | 'Low Quality' | 'Spoof Detected' | 'Already Marked' | 'Multiple Faces' | 'Inconclusive';
  confidence_score: number;
  matched_student_name?: string;
  matched_enrollment_number?: string;
  attendance_marked?: boolean;
  message?: string;
}

interface FaceBoundingBoxProps {
  results: BoundingBoxData[];
  videoWidth?: number;
  videoHeight?: number;
}

export const FaceBoundingBox: React.FC<FaceBoundingBoxProps> = ({
  results,
  videoWidth = 640,
  videoHeight = 480,
}) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {results.map((res, idx) => {
        const [x, y, w, h] = res.bbox;
        // Convert to percentage coordinates for responsive overlay
        // Note: For mirrored video, x is flipped: (videoWidth - (x + w)) / videoWidth * 100
        const leftPct = ((videoWidth - (x + w)) / videoWidth) * 100;
        const topPct = (y / videoHeight) * 100;
        const widthPct = (w / videoWidth) * 100;
        const heightPct = (h / videoHeight) * 100;

        let strokeColor = '#55A6FF'; // Electric Blue (default)
        let glowColor = 'rgba(85, 166, 255, 0.4)';
        let statusBadge = 'Analyzing...';
        let badgeBg = 'bg-electricBlue';

        if (res.match_status === 'Verified') {
          strokeColor = '#22C987'; // Success Green
          glowColor = 'rgba(34, 201, 135, 0.5)';
          statusBadge = `Verified: ${res.matched_student_name}`;
          badgeBg = 'bg-successGreen';
        } else if (res.match_status === 'Already Marked') {
          strokeColor = '#F5A524'; // Warning Amber
          glowColor = 'rgba(245, 165, 36, 0.4)';
          statusBadge = `Already Checked-In (${res.matched_student_name})`;
          badgeBg = 'bg-warningAmber';
        } else if (res.match_status === 'Spoof Detected') {
          strokeColor = '#F05D6C'; // Danger Red
          glowColor = 'rgba(240, 93, 108, 0.5)';
          statusBadge = 'Spoof Detected (PAD Alert)';
          badgeBg = 'bg-dangerRed';
        } else if (res.match_status === 'Unknown') {
          strokeColor = '#94A3B8';
          glowColor = 'rgba(148, 163, 184, 0.3)';
          statusBadge = 'Unregistered / Unknown';
          badgeBg = 'bg-slate-600';
        } else if (res.match_status === 'Low Quality') {
          strokeColor = '#F5A524';
          statusBadge = 'Low Quality Capture';
          badgeBg = 'bg-warningAmber';
        } else if (res.match_status === 'Inconclusive') {
          strokeColor = '#F5A524';
          glowColor = 'rgba(245, 165, 36, 0.4)';
          statusBadge = 'Liveness Inconclusive';
          badgeBg = 'bg-warningAmber';
        }

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-xl transition-all duration-150"
            style={{
              left: `${Math.max(2, Math.min(95, leftPct))}%`,
              top: `${Math.max(2, Math.min(95, topPct))}%`,
              width: `${Math.max(8, widthPct)}%`,
              height: `${Math.max(8, heightPct)}%`,
              border: `2px solid ${strokeColor}`,
              boxShadow: `0 0 16px ${glowColor}`,
            }}
          >
            {/* Top Identity Tag */}
            <div
              className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold tracking-tight whitespace-nowrap shadow-md flex items-center gap-1.5 ${badgeBg}`}
            >
              {res.match_status === 'Verified' && <CheckCircle2 className="w-3 h-3" />}
              {res.match_status === 'Spoof Detected' && <XCircle className="w-3 h-3" />}
              {res.match_status === 'Already Marked' && <ShieldCheck className="w-3 h-3" />}
              <span>{statusBadge}</span>
              {res.confidence_score > 0 && (
                <span className="opacity-90 font-mono">
                  {Math.round(res.confidence_score * 100)}%
                </span>
              )}
            </div>

            {/* Bottom Anti-Spoofing & Liveness Tag */}
            {res.liveness_score > 0 && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-midnight/90 border border-slate-700/80 px-2 py-0.5 rounded text-[9px] text-aiTeal font-mono whitespace-nowrap">
                Live: {Math.round(res.liveness_score * 100)}% • {res.liveness_status}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
