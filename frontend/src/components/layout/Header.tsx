import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Bell,
  Shield,
  Cpu,
  Calendar,
  Menu,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Logo } from '../ui/Logo';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = await apiRequest<any[]>('/notifications');
        setNotifications(data);
      } catch {
        // fallback
      }
    };
    fetchNotifs();

    // Format current institutional date
    const now = new Date();
    setCurrentDateStr(
      now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-18 bg-white/90 dark:bg-deepNavy/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 shadow-xs">
      {/* Left: Mobile Toggle, Brand & Campus Identity */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={onMenuClick}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-midnight dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-aiTeal/50"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile-only compact logo */}
        <div className="lg:hidden flex items-center">
          <Logo size="sm" showText={false} />
        </div>

        {/* Institutional Campus Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 via-aiTeal/15 to-electricBlue/20 border border-aiTeal/20 items-center justify-center text-aiTeal-dark dark:text-aiTeal shrink-0 shadow-sm">
            <Award className="w-5 h-5" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-midnight dark:text-white tracking-tight truncate">
                Trinity Institute of Technology & AI
              </h2>
              <span className="hidden md:inline-flex px-1.5 py-0.5 rounded-md bg-aiTeal/10 dark:bg-aiTeal/20 border border-aiTeal/30 text-aiTeal-dark dark:text-aiTeal font-mono font-bold text-[10px]">
                TIT-AI
              </span>
              <span className="hidden xl:inline-flex px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                NAAC A++
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
              <span>Smart Biometric Campus Vision</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
              <span className="hidden sm:inline">AY 2025–2026 Term I</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center: Live Biometric AI Inference Pipeline Badge */}
      <div className="hidden 2xl:flex items-center gap-2.5 px-3 py-1 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-full text-xs shadow-inner">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>YuNet & SFace Biometric Core</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">•</span>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          512-D ONNX • 58ms
        </span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
          Active
        </span>
      </div>

      {/* Right: Academic Actions, Theme, Notifications & User Pill */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Academic Date Pill */}
        {currentDateStr && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/40 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-aiTeal" />
            <span>{currentDateStr}</span>
          </div>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Color Theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-xl text-slate-500 hover:text-midnight dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-aiTeal/50"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-warningAmber transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-deepNavy transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View Notifications"
            title="Notifications"
            className="p-2.5 rounded-xl relative text-slate-500 hover:text-midnight dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-aiTeal/50"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dangerRed opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-dangerRed" />
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-deepNavy rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-midnight dark:text-white">
                    Campus Notifications
                  </span>
                  <span className="text-[10px] bg-aiTeal/15 text-aiTeal-dark dark:text-aiTeal font-bold px-1.5 py-0.2 rounded-full">
                    {unreadCount} new
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifMenu(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto px-2 py-1.5 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      All caught up!
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      No pending alerts or notifications
                    </p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-midnight dark:text-white group-hover:text-aiTeal transition-colors">
                          {n.title}
                        </p>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden sm:block text-right min-w-0 max-w-[140px]">
            <p className="text-xs font-bold text-midnight dark:text-white truncate">
              {user?.full_name || 'Academic User'}
            </p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] font-semibold text-aiTeal-dark dark:text-aiTeal bg-aiTeal/10 dark:bg-aiTeal/20 px-1.5 py-0.2 rounded uppercase tracking-wider">
                {user?.role || 'User'}
              </span>
            </div>
          </div>
          <div className="relative group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-deepNavy via-slate-800 to-aiTeal p-[1.5px] shadow-sm">
              <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            {/* Live active presence dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-deepNavy" />
          </div>
        </div>
      </div>
    </header>
  );
};
