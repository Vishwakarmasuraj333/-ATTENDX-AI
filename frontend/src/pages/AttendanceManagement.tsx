import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Edit,
  Download,
  Calendar,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { AttendanceSession, AttendanceRecord } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Manual Edit Modal state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [manualStatus, setManualStatus] = useState<string>('Present');
  const [manualRemarks, setManualRemarks] = useState<string>('Manual faculty override');
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Corrections tab state
  const [activeTab, setActiveTab] = useState<'sessions' | 'corrections'>('sessions');
  const [corrections, setCorrections] = useState<any[]>([]);

  // Fetch all sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await apiRequest<AttendanceSession[]>('/attendance/sessions');
        setSessions(data);
        if (data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    };
    fetchSessions();
  }, []);

  // Fetch session records when selectedSessionId changes
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchRecords = async () => {
      setIsLoadingRecords(true);
      try {
        const data = await apiRequest<AttendanceRecord[]>(`/attendance/sessions/${selectedSessionId}/records`);
        setSessionRecords(data);
      } catch (err) {
        console.error('Failed to load session records:', err);
      } finally {
        setIsLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [selectedSessionId]);

  // Fetch correction requests
  useEffect(() => {
    if (activeTab === 'corrections') {
      const fetchCorrections = async () => {
        try {
          const data = await apiRequest<any[]>('/attendance/corrections');
          setCorrections(data);
        } catch (err) {
          console.error('Failed to load corrections:', err);
        }
      };
      fetchCorrections();
    }
  }, [activeTab]);

  // Handle manual attendance save
  const handleSaveManualRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !selectedSessionId) return;

    setIsSavingManual(true);
    try {
      await apiRequest('/attendance/manual-record', {
        method: 'POST',
        body: JSON.stringify({
          session_id: selectedSessionId,
          student_id: editingRecord.student_id,
          status: manualStatus,
          remarks: manualRemarks,
        }),
      });

      // Update local state
      setSessionRecords(prev =>
        prev.map(r =>
          r.id === editingRecord.id
            ? {
                ...r,
                status: manualStatus as any,
                attendance_source: `Manual (${user?.role || 'Faculty'})`,
                remarks: manualRemarks,
              }
            : r
        )
      );

      setEditingRecord(null);
    } catch (err: any) {
      alert(`Manual update failed: ${err.message}`);
    } finally {
      setIsSavingManual(false);
    }
  };

  // Handle review of correction request
  const handleReviewCorrection = async (corrId: number, status: 'Approved' | 'Rejected') => {
    const reason = prompt(`Enter review remarks for ${status}:`, 'Verified by faculty audit');
    if (reason === null) return;

    try {
      await apiRequest(`/attendance/corrections/${corrId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          review_remarks: reason,
        }),
      });

      setCorrections(prev =>
        prev.map(c => (c.id === corrId ? { ...c, status, review_remarks: reason } : c))
      );
    } catch (err: any) {
      alert(`Correction review failed: ${err.message}`);
    }
  };

  const filteredRecords = sessionRecords.filter(r => {
    const matchesSearch =
      (r.student_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (r.roll_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (r.enrollment_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-deepNavy p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-midnight dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-aiTeal" /> Attendance Governance Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Session rosters, manual overrides with audit logging & student dispute requests
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sessions'
                ? 'bg-white dark:bg-deepNavy text-midnight dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-midnight dark:hover:text-white'
            }`}
          >
            Session Roster
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'corrections'
                ? 'bg-white dark:bg-deepNavy text-midnight dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-midnight dark:hover:text-white'
            }`}
          >
            Correction Approvals
          </button>
        </div>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Session Selector & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Select Lecture Session
              </label>
              <select
                value={selectedSessionId || ''}
                onChange={e => setSelectedSessionId(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-midnight dark:text-white focus:outline-none focus:border-aiTeal"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.session_date} • {s.subject_code} ({s.subject_name}) • {s.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Search Student
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Name / Roll / Enrollment..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-midnight dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Session Overview Stats Banner */}
          {selectedSession && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-400">Course / Division:</span>{' '}
                  <span className="font-bold text-midnight dark:text-white">
                    {selectedSession.class_name} • {selectedSession.division_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Faculty:</span>{' '}
                  <span className="font-bold text-midnight dark:text-white">
                    {selectedSession.faculty_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Room:</span>{' '}
                  <span className="font-bold text-midnight dark:text-white">
                    {selectedSession.room || 'Hall'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="teal" size="sm">
                  {selectedSession.present_count} Present
                </Badge>
                <Badge variant="amber" size="sm">
                  {selectedSession.late_count} Late
                </Badge>
                <Badge variant="red" size="sm">
                  {selectedSession.absent_count} Absent
                </Badge>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Roll No</th>
                    <th className="py-3.5 px-6">Student Name</th>
                    <th className="py-3.5 px-6">Enrollment</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Check-In Time</th>
                    <th className="py-3.5 px-6">Attendance Source</th>
                    <th className="py-3.5 px-6">Confidence</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No student attendance records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(r => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-6 font-mono font-bold text-midnight dark:text-white">
                          {r.roll_number}
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-midnight dark:text-white">
                          {r.student_name}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-slate-400">
                          {r.enrollment_number}
                        </td>
                        <td className="py-3.5 px-6">
                          {r.status === 'Present' && (
                            <Badge variant="green" size="sm" dot>Present</Badge>
                          )}
                          {r.status === 'Late' && (
                            <Badge variant="amber" size="sm" dot>Late</Badge>
                          )}
                          {r.status === 'Absent' && (
                            <Badge variant="red" size="sm" dot>Absent</Badge>
                          )}
                          {r.status === 'Excused' && (
                            <Badge variant="blue" size="sm" dot>Excused</Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400">
                          {r.check_in_time
                            ? new Date(r.check_in_time).toLocaleTimeString()
                            : '—'}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                          {r.attendance_source}
                        </td>
                        <td className="py-3.5 px-6 font-mono">
                          {r.confidence_score ? (
                            <span className="text-aiTeal font-bold">
                              {(r.confidence_score * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setManualStatus(r.status);
                              setManualRemarks(r.remarks || 'Manual faculty correction');
                            }}
                            className="p-1.5 text-slate-400 hover:text-aiTeal hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Attendance Status"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Corrections Review Tab */}
      {activeTab === 'corrections' && (
        <div className="bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-midnight dark:text-white">
              Student Attendance Dispute & Correction Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students filing medical certificates or official college duty slips for attendance reconciliation
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {corrections.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No pending attendance correction requests in the queue.
              </div>
            ) : (
              corrections.map(c => (
                <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-bold text-midnight dark:text-white">
                        {c.student_name}
                      </h4>
                      <Badge variant={c.status === 'Approved' ? 'green' : c.status === 'Rejected' ? 'red' : 'amber'} size="sm">
                        {c.status}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        Requested: <strong className="text-aiTeal">{c.requested_status}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                      <strong>Reason:</strong> {c.reason}
                    </p>
                    {c.review_remarks && (
                      <p className="text-xs text-slate-400 mt-1 italic">
                        Faculty review note: {c.review_remarks}
                      </p>
                    )}
                  </div>

                  {c.status === 'Pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewCorrection(c.id, 'Approved')}
                        className="px-4 py-2 bg-successGreen hover:bg-successGreen-dark text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewCorrection(c.id, 'Rejected')}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-dangerRed hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Manual Status Override Modal */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title={`Override Attendance: ${editingRecord?.student_name}`}
        subtitle={`Roll No: ${editingRecord?.roll_number} • Session: ${selectedSession?.session_date}`}
      >
        <form onSubmit={handleSaveManualRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Attendance Status
            </label>
            <select
              value={manualStatus}
              onChange={e => setManualStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-midnight dark:text-white"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused (Medical / Duty)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Audit Justification / Remarks
            </label>
            <textarea
              required
              rows={3}
              value={manualRemarks}
              onChange={e => setManualRemarks(e.target.value)}
              placeholder="State legitimate reason for manual attendance override..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-midnight dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingRecord(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingManual}
              className="px-5 py-2 bg-aiTeal text-midnight font-bold rounded-xl text-xs hover:bg-aiTeal-light shadow-sm"
            >
              {isSavingManual ? 'Saving Audit Record...' : 'Apply Status Override'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

