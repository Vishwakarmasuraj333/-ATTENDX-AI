import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'teal' | 'blue' | 'green' | 'amber' | 'red';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'teal',
}) => {
  const colorMap = {
    teal: {
      bg: 'bg-aiTeal/10 dark:bg-aiTeal/20',
      text: 'text-aiTeal',
      border: 'hover:border-aiTeal/40',
      glow: 'group-hover:shadow-glow-teal',
    },
    blue: {
      bg: 'bg-electricBlue/10 dark:bg-electricBlue/20',
      text: 'text-electricBlue',
      border: 'hover:border-electricBlue/40',
      glow: 'group-hover:shadow-glow-blue',
    },
    green: {
      bg: 'bg-successGreen/10 dark:bg-successGreen/20',
      text: 'text-successGreen',
      border: 'hover:border-successGreen/40',
      glow: 'group-hover:shadow-sm',
    },
    amber: {
      bg: 'bg-warningAmber/10 dark:bg-warningAmber/20',
      text: 'text-warningAmber',
      border: 'hover:border-warningAmber/40',
      glow: 'group-hover:shadow-sm',
    },
    red: {
      bg: 'bg-dangerRed/10 dark:bg-dangerRed/20',
      text: 'text-dangerRed',
      border: 'hover:border-dangerRed/40',
      glow: 'group-hover:shadow-sm',
    },
  };

  const currentTheme = colorMap[accentColor];

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`group relative bg-white dark:bg-deepNavy rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft transition-all duration-300 ${currentTheme.border} ${currentTheme.glow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${currentTheme.bg} ${currentTheme.text} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-extrabold text-midnight dark:text-white tracking-tight">
          {value}
        </h3>
        {trend && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              trend.isPositive
                ? 'bg-successGreen/10 text-successGreen-dark dark:text-successGreen-light'
                : 'bg-dangerRed/10 text-dangerRed-dark dark:text-dangerRed-light'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

