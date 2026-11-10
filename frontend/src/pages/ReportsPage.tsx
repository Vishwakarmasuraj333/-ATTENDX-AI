import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  BookOpen,
  Filter,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Department, Subject, ClassGroup } from '../types';
import { Badge } from '../components/ui/Badge';

export const ReportsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);

  // Filter params
  const [reportType, setReportType] = useState('daily');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel'>('pdf');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [dps, sbs, cls] = await Promise.all([
          apiRequest<Department[]>('/academic/departments'),
          apiRequest<Subject[]>('/academic/subjects'),
          apiRequest<ClassGroup[]>('/academic/classes'),
        ]);
        setDepartments(dps);
        setSubjects(sbs);
        setClasses(cls);
      } catch (err) {
        console.error('Failed to load report filters:', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleDownloadReport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        report_type: reportType,
        format,
        ...(departmentId ? { department_id: departmentId } : {}),
        ...(subjectId ? { subject_id: subjectId } : {}),
        ...(classId ? { class_id: classId } : {}),
        ...(reportDate ? { date: reportDate } : {}),
      });

      const token = localStorage.getItem('attendx_token');
      const url = `http://localhost:8000/api/v1/reports/export?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate report export');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `AttendX_${reportType}_${new Date().toISOString().split('T')[0]}.${
        format === 'pdf' ? 'pdf' : 'xlsx'
      }`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const reportDescriptions: Record<string, string> = {
    daily: 'Detailed roll-call roster for a specific academic day with exact check-in timestamps and facial verification confidence scores.',
    monthly: 'Aggregated monthly attendance ledger tracking cumulative presents, absents, and statutory percentages per student cohort.',
    semester: 'Official semester terminal compliance ledger required for university examination admit card clearance.',
    department: 'Comparative departmental attendance metrics and instructor lecture fulfillment statistics.',
    subject: 'Module-specific attendance audit tracking individual subject theory and laboratory session compliance.',
    low_attendance: 'Official academic defaulter warning list identifying students falling below statutory minimum 75% threshold.',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-deepNavy p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-midnight dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-aiTeal" /> Institutional Reports & Export Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate publication-ready PDF audit documents & Excel tabular spreadsheets with college branding
          </p>
        </div>

        <Badge variant="teal" size="sm">
          ReportLab & OpenPyXL Engine Active
        </Badge>
      </div>

      {/* Main Filter & Export Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-6">
          <div>
            <h3 className="text-base font-bold text-midnight dark:text-white mb-1">
              Select Report Type
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Choose the institutional scope and reporting criteria
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'daily', name: 'Daily Attendance Roster' },
                { id: 'monthly', name: 'Monthly Ledger & Compliance' },
                { id: 'semester', name: 'Semester Terminal Report' },
                { id: 'low_attendance', name: 'Low Attendance Defaulters (<75%)' },
                { id: 'subject', name: 'Subject-wise Lecture Audit' },
                { id: 'department', name: 'Departmental Summary' },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setReportType(opt.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    reportType === opt.id
                      ? 'border-aiTeal bg-aiTeal/10 dark:bg-aiTeal/15 shadow-sm'
                      : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <p className="text-xs font-bold text-midnight dark:text-white">
                    {opt.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {reportDescriptions[opt.id]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Demographic & Scope Filters */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Report Scope & Filters
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={e => setReportDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Module
                </label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Export Action Card */}
        <div className="bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-midnight dark:text-white mb-2">
              Export Specification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Reports include official Trinity Institute branding, statutory disclaimers, and audit metadata.
            </p>

            <div className="space-y-3">
              <div
                onClick={() => setSelectedFormat('pdf')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between ${
                  selectedFormat === 'pdf'
                    ? 'border-aiTeal bg-aiTeal/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-dangerRed/10 text-dangerRed">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-midnight dark:text-white">
                      Adobe PDF Document
                    </h4>
                    <p className="text-[10px] text-slate-400">Formatted printable tables & letterhead</p>
                  </div>
                </div>
                {selectedFormat === 'pdf' && <CheckCircle2 className="w-4 h-4 text-aiTeal" />}
              </div>

              <div
                onClick={() => setSelectedFormat('excel')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between ${
                  selectedFormat === 'excel'
                    ? 'border-aiTeal bg-aiTeal/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-successGreen/10 text-successGreen">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-midnight dark:text-white">
                      Microsoft Excel (XLSX)
                    </h4>
                    <p className="text-[10px] text-slate-400">Raw structured data for MIS import</p>
                  </div>
                </div>
                {selectedFormat === 'excel' && <CheckCircle2 className="w-4 h-4 text-aiTeal" />}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleDownloadReport(selectedFormat)}
              disabled={isExporting}
              className="w-full py-3 bg-aiTeal hover:bg-aiTeal-light text-midnight font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-glow-teal transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Report...' : `Export ${selectedFormat.toUpperCase()} File`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

