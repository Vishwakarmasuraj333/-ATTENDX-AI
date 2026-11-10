import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'blue' | 'green' | 'amber' | 'red' | 'navy' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  dot = false,
}) => {
  const variantStyles = {
    teal: 'bg-aiTeal/10 text-aiTeal border border-aiTeal/20 dark:bg-aiTeal/20 dark:text-aiTeal-light',
    blue: 'bg-electricBlue/10 text-electricBlue-dark border border-electricBlue/20 dark:bg-electricBlue/20 dark:text-electricBlue-light',
    green: 'bg-successGreen/10 text-successGreen-dark border border-successGreen/20 dark:bg-successGreen/20 dark:text-successGreen-light',
    amber: 'bg-warningAmber/10 text-warningAmber-dark border border-warningAmber/20 dark:bg-warningAmber/20 dark:text-warningAmber-light',
    red: 'bg-dangerRed/10 text-dangerRed-dark border border-dangerRed/20 dark:bg-dangerRed/20 dark:text-dangerRed-light',
    navy: 'bg-deepNavy/10 text-deepNavy border border-deepNavy/20 dark:bg-deepNavy-light/30 dark:text-white',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const dotColors = {
    teal: 'bg-aiTeal',
    blue: 'bg-electricBlue',
    green: 'bg-successGreen',
    amber: 'bg-warningAmber',
    red: 'bg-dangerRed',
    navy: 'bg-deepNavy',
    gray: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

