import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  Calendar,
  BookOpen,
  Shield,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { AttendanceRecord } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const StudentPortal: React.FC = () => {
  const { user } = useAuth();

  const [studentHistory, setStudentHistory] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Correction Request Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [requestedStatus, setRequestedStatus] = useState('Present');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    // In our seed data, student Aarav Mehta has student ID 1
    // We can fetch student ID 1 for demonstration or from student profile
    const fetchStudentAttendance = async () => {
      try {
        const studentId = 1; // Primary demo student Aarav Mehta
        const data = await apiRequest<any>(`/attendance/student/${studentId}/history`);
        setStudentHistory(data);
      } catch (err) {
        console.error('Failed to load student history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentAttendance();
  }, []);

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;

    setIsSubmitting(true);
    setSubmitSuccess(null);
    try {
      await apiRequest('/attendance/corrections', {
        method: 'POST',
        body: JSON.stringify({
          attendance_record_id: selectedRecordId,
          student_id: studentHistory?.student_id || 1,
          requested_status: requestedStatus,
          reason: correctionReason,
        }),
      });

      setSubmitSuccess('Dispute request submitted to course faculty for audit review.');
      setTimeout(() => {
        setShowCorrectionModal(false);
        setSubmitSuccess(null);
        setCorrectionReason('');
      }, 1500);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !studentHistory) {
    return <div className="p-12 text-center text-slate-400">Loading student attendance ledger...</div>;
  }

  const {
    attendance_percentage,
    student_name,
    enrollment_number,
    roll_number,
    present_count,
    late_count,
    absent_count,
    subject_breakdown,
    records,
  } = studentHistory;

  const isCompliant = attendance_percentage >= 75.0;

  return (
    <div className="space-y-6">
      {/* Profile & KPI Header */}
      <div className="bg-gradient-to-r from-deepNavy to-midnight p-6 rounded-3xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-aiTeal to-electricBlue flex items-center justify-center text-midnight font-black text-2xl shadow-glow-teal">
            {student_name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-aiTeal/20 text-aiTeal-light font-mono">
                {enrollment_number}
              </span>
              <span className="text-xs text-slate-400 font-mono">Roll: {roll_number}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{student_name}</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              MSc IT • Semester I • Division A
            </p>
          </div>
        </div>

        {/* Big Statutory Percentage Circle */}
        <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Statutory Percentage
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-3xl font-black ${
                  isCompliant ? 'text-successGreen' : 'text-dangerRed'
                }`}
              >
                {attendance_percentage}%
              </span>
              <span className="text-xs text-slate-400">/ 75% required</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isCompliant
                ? 'Statutory exam clearance granted'
                : 'Defaulter warning: below 75%'}
            </p>
          </div>

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
              isCompliant
                ? 'bg-successGreen/20 text-successGreen'
                : 'bg-dangerRed/20 text-dangerRed'
            }`}
          >
            {isCompliant ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Numerical breakdown bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-soft">
          <span className="text-[10px] font-bold uppercase text-slate-400">Lectures Present</span>
          <p className="text-2xl font-black text-successGreen mt-1">{present_count}</p>
        </div>
        <div className="p-4 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-soft">
          <span className="text-[10px] font-bold uppercase text-slate-400">Late Check-Ins</span>
          <p className="text-2xl font-black text-warningAmber mt-1">{late_count}</p>
        </div>
        <div className="p-4 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-soft">
          <span className="text-[10px] font-bold uppercase text-slate-400">Lectures Absent</span>
          <p className="text-2xl font-black text-dangerRed mt-1">{absent_count}</p>
        </div>
      </div>

      {/* Subject-wise breakdown bars */}
      <div className="bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <h3 className="text-base font-bold text-midnight dark:text-white mb-4">
          Subject-Wise Attendance Breakdown
        </h3>
        <div className="space-y-4">
          {(subject_breakdown || []).map((sub: any) => (
            <div key={sub.subject_id} className="space-y-1.5">
              <div className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-mono font-bold text-aiTeal mr-2">
                    {sub.subject_code}
                  </span>
                  <span className="font-semibold text-midnight dark:text-white">
                    {sub.subject_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">
                    {sub.present + sub.late} / {sub.eligible} sessions
                  </span>
                  <span
                    className={`font-black ${
                      sub.percentage >= 75 ? 'text-successGreen' : 'text-dangerRed'
                    }`}
                  >
                    {sub.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    sub.percentage >= 75 ? 'bg-successGreen' : 'bg-dangerRed'
                  }`}
                  style={{ width: `${sub.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Attendance History Table */}
      <div className="bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-midnight dark:text-white">
              Personal Attendance Session Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified facial check-ins and discrepancy dispute filing
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Subject</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Check-In Time</th>
                <th className="py-3 px-6">Verification Source</th>
                <th className="py-3 px-6 text-right">Dispute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((r: AttendanceRecord) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400">
                    {r.date}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-midnight dark:text-white">
                    {r.subject_name || 'Lecture Module'}
                  </td>
                  <td className="py-3.5 px-6">
                    {r.status === 'Present' && <Badge variant="green" size="sm" dot>Present</Badge>}
                    {r.status === 'Late' && <Badge variant="amber" size="sm" dot>Late</Badge>}
                    {r.status === 'Absent' && <Badge variant="red" size="sm" dot>Absent</Badge>}
                    {r.status === 'Excused' && <Badge variant="blue" size="sm" dot>Excused</Badge>}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-400">
                    {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '—'}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                    {r.attendance_source}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {r.status === 'Absent' && (
                      <button
                        onClick={() => {
                          setSelectedRecordId(r.id);
                          setShowCorrectionModal(true);
                        }}
                        className="text-[11px] font-bold text-aiTeal hover:underline"
                      >
                        File Dispute
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Modal */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="File Attendance Correction / Dispute"
        subtitle="Submit legitimate justification (medical leave / official duty) for faculty verification"
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          {submitSuccess && (
            <div className="p-3 bg-successGreen/10 border border-successGreen/30 rounded-xl text-successGreen text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Requested Status
            </label>
            <select
              value={requestedStatus}
              onChange={e => setRequestedStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-midnight dark:text-white"
            >
              <option value="Present">Present (Physical Attendance Verification)</option>
              <option value="Excused">Excused (Medical Certificate / College Duty)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Justification / Reason *
            </label>
            <textarea
              required
              rows={3}
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="State clear reasons or cite medical certificate ID..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-midnight dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCorrectionModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-aiTeal text-midnight font-bold rounded-xl text-xs hover:bg-aiTeal-light shadow-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit to Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

