import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanFace,
  ClipboardCheck,
  UserCheck,
  GraduationCap,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  FileSpreadsheet,
  ShieldAlert,
  LogOut,
  UserCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { Logo } from '../ui/Logo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavSection {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    roles: string[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections: NavSection[] = [
    {
      title: 'Biometric Operations',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty', 'Class Coordinator', 'Student'],
        },
        {
          to: '/live-attendance',
          label: 'Live Face Attendance',
          icon: ScanFace,
          badge: 'Live',
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty', 'Class Coordinator'],
        },
        {
          to: '/face-enrollment',
          label: 'Face Registration',
          icon: UserCheck,
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty', 'Class Coordinator'],
        },
        {
          to: '/attendance-management',
          label: 'Attendance Ledger',
          icon: ClipboardCheck,
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty', 'Class Coordinator'],
        },
        {
          to: '/student-portal',
          label: 'My Attendance Portal',
          icon: UserCircle,
          badge: 'Self',
          roles: ['Student'],
        },
      ],
    },
    {
      title: 'Academic & Governance',
      items: [
        {
          to: '/students',
          label: 'Student Directory',
          icon: GraduationCap,
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty', 'Class Coordinator'],
        },
        {
          to: '/faculty',
          label: 'Faculty Directory',
          icon: Users,
          roles: ['Super Admin', 'College Admin', 'HOD'],
        },
        {
          to: '/academic',
          label: 'Campus Governance',
          icon: Building2,
          roles: ['Super Admin', 'College Admin', 'HOD'],
        },
        {
          to: '/timetables',
          label: 'Timetable Scheduling',
          icon: CalendarDays,
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty'],
        },
      ],
    },
    {
      title: 'Intelligence & Compliance',
      items: [
        {
          to: '/analytics',
          label: 'AI & Absenteeism Risk',
          icon: BarChart3,
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty'],
        },
        {
          to: '/reports',
          label: 'Reports & Export',
          icon: FileSpreadsheet,
          roles: ['Super Admin', 'College Admin', 'HOD', 'Faculty'],
        },
        {
          to: '/audit-logs',
          label: 'Security & Audit',
          icon: ShieldAlert,
          roles: ['Super Admin', 'College Admin'],
        },
      ],
    },
  ];

  return (
    <aside
      className={`w-64 bg-midnight border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50 select-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 shrink-0">
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className="transition-transform duration-200 hover:scale-[1.02]"
        >
          <Logo size="md" subtitle="Smart Campus Vision" />
        </NavLink>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map(section => {
          const visibleItems = section.items.filter(item => hasRole(item.roles as any));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>

              {visibleItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-aiTeal text-midnight shadow-glow-teal font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-midnight' : 'text-slate-400 group-hover:text-aiTeal'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                              isActive
                                ? 'bg-midnight text-white'
                                : 'bg-aiTeal/20 text-aiTeal-light border border-aiTeal/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Session Footer & Compliance Pill */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-deepNavy border border-slate-700 flex items-center justify-center text-aiTeal font-bold text-xs shrink-0">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name || 'Academic User'}
              </p>
              <div className="flex items-center gap-1">
                <Badge variant="teal" size="sm">
                  {user?.role || 'Guest'}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out of Session"
            aria-label="Log Out"
            className="p-1.5 text-slate-400 hover:text-dangerRed hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Institutional System Info Badge */}
        <div className="px-2 py-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-aiTeal/70" />
            <span>AttendX AI v2.4</span>
          </div>
          <span className="text-[9px] text-slate-600">FIPS & ISO/IEC</span>
        </div>
      </div>
    </aside>
  );
};
