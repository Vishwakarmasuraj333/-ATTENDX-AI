import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Building2,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Percent,
  ScanFace,
  UserCheck,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { apiRequest } from '../api/client';
import { DashboardAnalyticsResponse } from '../types';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiRequest<DashboardAnalyticsResponse>('/analytics/dashboard');
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-dangerRed/10 border border-dangerRed/30 rounded-2xl text-dangerRed-light">
        <h3 className="font-bold text-base mb-1">Failed to load live dashboard statistics</h3>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  const { kpis, daily_trends, department_comparison, distribution, subject_stats } = data;

  // Pie chart data
  const pieData = [
    { name: 'Present', value: distribution.present_pct, color: '#22C987' },
    { name: 'Absent', value: distribution.absent_pct, color: '#F05D6C' },
    { name: 'Late', value: distribution.late_pct, color: '#F5A524' },
    { name: 'Excused', value: distribution.excused_pct, color: '#55A6FF' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-deepNavy to-midnight p-6 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-aiTeal/10 rounded-full blur-3xl pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-aiTeal/20 text-aiTeal-light border border-aiTeal/30">
              {user?.role} Portal
            </span>
            <span className="text-xs text-slate-400">• Institutional Governance</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Facial recognition verification stream is operational across active lecture halls.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          {hasRole(['Super Admin', 'College Admin', 'HOD', 'Faculty', 'Class Coordinator']) && (
            <button
              onClick={() => navigate('/live-attendance')}
              className="px-4 py-2.5 rounded-xl bg-aiTeal hover:bg-aiTeal-light text-midnight font-extrabold text-xs flex items-center gap-2 shadow-glow-teal transition-all"
            >
              <ScanFace className="w-4 h-4" />
              <span>Launch Live Attendance</span>
            </button>
          )}
          {hasRole(['Super Admin', 'College Admin', 'HOD', 'Faculty']) && (
            <button
              onClick={() => navigate('/face-enrollment')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-aiTeal" />
              <span>Enroll Student Face</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Overall Attendance Rate"
          value={`${kpis.overall_attendance_percentage}%`}
          subtitle="Institutional statutory compliance"
          icon={Percent}
          accentColor="teal"
          trend={{ value: '2.4% vs last term', isPositive: true }}
        />
        <MetricCard
          title="Present Today"
          value={kpis.present_students_today}
          subtitle={`Across ${kpis.active_attendance_sessions} active sessions`}
          icon={CheckCircle2}
          accentColor="green"
        />
        <MetricCard
          title="Absent Defaulters"
          value={kpis.absent_students_today}
          subtitle="Flagged for counseling"
          icon={XCircle}
          accentColor="red"
        />
        <MetricCard
          title="Late Check-Ins"
          value={kpis.late_arrivals_today}
          subtitle="Arrived after grace window"
          icon={Clock}
          accentColor="amber"
        />
      </div>

      {/* Secondary Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div className="border-r border-slate-100 dark:border-slate-800 pr-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled Students</p>
          <p className="text-xl font-bold text-midnight dark:text-white mt-1">{kpis.total_students}</p>
        </div>
        <div className="border-r border-slate-100 dark:border-slate-800 pr-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Faculty Instructors</p>
          <p className="text-xl font-bold text-midnight dark:text-white mt-1">{kpis.total_faculty}</p>
        </div>
        <div className="border-r border-slate-100 dark:border-slate-800 pr-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Academic Departments</p>
          <p className="text-xl font-bold text-midnight dark:text-white mt-1">{kpis.total_departments}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Divisions</p>
          <p className="text-xl font-bold text-midnight dark:text-white mt-1">{kpis.total_classes}</p>
        </div>
      </div>

      {/* Charts Row: Trend Line & Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-midnight dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-aiTeal" /> Daily Attendance Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                7-day verified attendance volume & compliance rate
              </p>
            </div>
            <Badge variant="teal" size="sm">Real Database Records</Badge>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#13B8A6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#13B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101827',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  name="Attendance %"
                  stroke="#13B8A6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-midnight dark:text-white mb-1">
              Attendance Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Institutional breakdown of status codes
            </p>
          </div>

          <div className="h-52 relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Percentage']}
                  contentStyle={{
                    backgroundColor: '#101827',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-midnight dark:text-white">
                {distribution.present_pct}%
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Present</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{p.name}:</span>
                <span className="font-bold text-midnight dark:text-white ml-auto">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row: Department Comparison & Top Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Bar Chart */}
        <div className="bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-midnight dark:text-white">
                Departmental Attendance Comparison
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Average attendance compliance by faculty department
              </p>
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={department_comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="department_code" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{
                    backgroundColor: '#101827',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="attendance_rate" fill="#55A6FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subjects Attendance Ledger */}
        <div className="bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-midnight dark:text-white">
                Curriculum Subjects Attendance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time lecture records per course module
              </p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-aiTeal font-bold hover:underline flex items-center gap-1"
            >
              Export Report <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {subject_stats.map(sub => (
              <div
                key={sub.subject_code}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-aiTeal">
                      {sub.subject_code}
                    </span>
                    <h4 className="text-xs font-bold text-midnight dark:text-white">
                      {sub.subject_name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {sub.total_sessions} sessions completed
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-midnight dark:text-white">
                    {sub.average_attendance}%
                  </span>
                  <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.average_attendance >= 75 ? 'bg-successGreen' : 'bg-dangerRed'
                      }`}
                      style={{ width: `${sub.average_attendance}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

