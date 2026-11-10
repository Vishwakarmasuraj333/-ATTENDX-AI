import React from 'react';
import { Shield, Sparkles, Activity } from 'lucide-react';

interface LivenessIndicatorProps {
  isScanning?: boolean;
  livenessScore?: number;
  qualityScore?: number;
}

export const LivenessIndicator: React.FC<LivenessIndicatorProps> = ({
  isScanning = true,
  livenessScore,
  qualityScore,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* Top HUD Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-midnight/80 backdrop-blur-md rounded-full border border-slate-700/80 text-white text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-aiTeal" />
          <span>Passive Liveness Active</span>
          {livenessScore !== undefined && (
            <span className="font-mono text-aiTeal">
              {(livenessScore * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {qualityScore !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-midnight/80 backdrop-blur-md rounded-full border border-slate-700/80 text-white text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 text-electricBlue" />
            <span>Image Quality:</span>
            <span className="font-mono text-electricBlue">
              {(qualityScore * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Center Animated Scanner Line */}
      {isScanning && <div className="scanner-line" />}

      {/* Center Target Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-80 rounded-3xl border-2 border-dashed border-white/20 relative">
          {/* Corner brackets */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-aiTeal rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-aiTeal rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-aiTeal rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-aiTeal rounded-br-xl" />
        </div>
      </div>

      {/* Bottom Guidance Prompt */}
      <div className="text-center">
        <span className="inline-block px-4 py-1.5 bg-midnight/85 backdrop-blur-md rounded-full border border-slate-700/80 text-slate-200 text-xs font-medium">
          Align face inside reticle • Ensure ample lighting • Look directly into sensor
        </span>
      </div>
    </div>
  );
};

