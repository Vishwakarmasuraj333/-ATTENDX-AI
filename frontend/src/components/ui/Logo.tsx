import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  subtitle = 'Smart Campus Vision',
}) => {
  const iconDimensions = {
    sm: { box: 'w-8 h-8', svg: 24, font: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', svg: 30, font: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12', svg: 36, font: 'text-lg', sub: 'text-[11px]' },
    xl: { box: 'w-16 h-16', svg: 48, font: 'text-2xl', sub: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Precision Engineered Biometric Emblem */}
      <div
        className={`relative ${iconDimensions.box} rounded-2xl bg-gradient-to-br from-slate-900 via-deepNavy to-slate-950 p-[1.5px] shadow-lg shadow-aiTeal/15 group transition-transform duration-300 hover:scale-105`}
      >
        {/* Subtle Gradient Rim Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-aiTeal via-electricBlue to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* Inner Emblem Canvas */}
        <div className="relative w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-radial-gradient from-aiTeal/20 via-transparent to-transparent opacity-60" />

          {/* SVG Biometric Vector Graphics */}
          <svg
            width={iconDimensions.svg}
            height={iconDimensions.svg}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            <defs>
              <linearGradient id="attendxGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <linearGradient id="scanBeamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Reticle Brackets (Camera Target Sensor) */}
            <path
              d="M 10 16 L 10 10 L 16 10"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 38 16 L 38 10 L 32 10"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 10 32 L 10 38 L 16 38"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 38 32 L 38 38 L 32 38"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Stylized Biometric Neural "A" Node Architecture */}
            <path
              d="M 24 12 L 16 34 L 20 34 L 21.8 28.5 L 26.2 28.5 L 28 34 L 32 34 Z"
              fill="url(#attendxGradient)"
              opacity="0.95"
            />
            <path
              d="M 24 17.5 L 22.4 25 L 25.6 25 Z"
              fill="#0B132B"
            />

            {/* Neural Crossbar Node & Pulse Core */}
            <circle cx="24" cy="24" r="2" fill="#55A6FF" filter="url(#neonGlow)" />
            <circle cx="24" cy="12" r="1.5" fill="#10B981" />
            <circle cx="16" cy="34" r="1.5" fill="#3B82F6" />
            <circle cx="32" cy="34" r="1.5" fill="#3B82F6" />

            {/* Laser Biometric Scanline Accent */}
            <line x1="8" y1="24" x2="40" y2="24" stroke="url(#scanBeamGradient)" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Typography & Badge */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-midnight dark:text-white ${iconDimensions.font}`}>
              Attend<span className="text-aiTeal bg-clip-text text-transparent bg-gradient-to-r from-aiTeal to-electricBlue">X</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-aiTeal/15 to-electricBlue/15 border border-aiTeal/30 text-aiTeal-dark dark:text-aiTeal font-extrabold text-[9px] tracking-wider uppercase">
              AI
            </span>
          </div>
          <span className={`font-semibold tracking-tight text-slate-500 dark:text-slate-400 mt-0.5 ${iconDimensions.sub}`}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
