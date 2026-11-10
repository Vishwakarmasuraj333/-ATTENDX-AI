import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Users,
  MapPin,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { TimetableSlot, Department, Course, ClassGroup, Division, Subject, Faculty } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const TimetableManagement: React.FC = () => {
  const { hasRole } = useAuth();

  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [showAddModal, setShowAddModal] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New slot form
  const [newSlot, setNewSlot] = useState({
    department_id: 1,
    course_id: 1,
    semester_id: 1,
    class_id: 1,
    division_id: 1,
    subject_id: 1,
    faculty_id: 1,
    room: 'Lab 402 - AI Vision Lab',
    day_of_week: 'Monday',
    start_time: '09:30',
    end_time: '11:30',
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tt, dp, cr, cl, dv, sb, fc] = await Promise.all([
        apiRequest<TimetableSlot[]>('/timetables'),
        apiRequest<Department[]>('/academic/departments'),
        apiRequest<Course[]>('/academic/courses'),
        apiRequest<ClassGroup[]>('/academic/classes'),
        apiRequest<Division[]>('/academic/divisions'),
        apiRequest<Subject[]>('/academic/subjects'),
        apiRequest<Faculty[]>('/faculty'),
      ]);
      setTimetables(tt);
      setDepartments(dp);
      setCourses(cr);
      setClasses(cl);
      setDivisions(dv);
      setSubjects(sb);
      setFaculty(fc);

      if (dp.length > 0) setNewSlot(prev => ({ ...prev, department_id: dp[0].id }));
      if (cr.length > 0) setNewSlot(prev => ({ ...prev, course_id: cr[0].id }));
      if (cl.length > 0) setNewSlot(prev => ({ ...prev, class_id: cl[0].id }));
      if (dv.length > 0) setNewSlot(prev => ({ ...prev, division_id: dv[0].id }));
      if (sb.length > 0) setNewSlot(prev => ({ ...prev, subject_id: sb[0].id }));
      if (fc.length > 0) setNewSlot(prev => ({ ...prev, faculty_id: fc[0].id }));
    } catch (err) {
      console.error('Failed to load timetables:', err);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setConflictWarning(null);

    try {
      // 1. Check for schedule conflicts
      const checkRes = await apiRequest<any>('/timetables/check-conflict', {
        method: 'POST',
        body: JSON.stringify(newSlot),
      });

      if (checkRes.has_conflict) {
        setConflictWarning(checkRes.conflict_detail);
        setIsSaving(false);
        return;
      }

      // 2. Submit new timetable slot
      const created = await apiRequest<TimetableSlot>('/timetables', {
        method: 'POST',
        body: JSON.stringify(newSlot),
      });

      setTimetables([...timetables, created]);
      setShowAddModal(false);
    } catch (err: any) {
      setConflictWarning(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const daySlots = timetables.filter(t => t.day_of_week === selectedDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-deepNavy p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-midnight dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-aiTeal" /> Master Timetable & Classroom Allocation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Strict conflict detection engine preventing overlapping faculty schedules & room collisions
          </p>
        </div>

        {hasRole(['Super Admin', 'College Admin', 'HOD', 'Class Coordinator']) && (
          <button
            onClick={() => {
              setConflictWarning(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-aiTeal hover:bg-aiTeal-light text-midnight font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-glow-teal transition-all"
          >
            <Plus className="w-4 h-4" /> Schedule Lecture Slot
          </button>
        )}
      </div>

      {/* Day of Week Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {daysOfWeek.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap ${
              selectedDay === d
                ? 'bg-midnight dark:bg-aiTeal text-white dark:text-midnight shadow-md'
                : 'bg-white dark:bg-deepNavy text-slate-500 hover:text-midnight dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Timetable Schedule Grid */}
      <div className="space-y-3">
        {daySlots.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs">
            No scheduled lectures configured for {selectedDay}. Click 'Schedule Lecture Slot' above to add classes.
          </div>
        ) : (
          daySlots.map(slot => (
            <div
              key={slot.id}
              className="p-5 rounded-3xl bg-white dark:bg-deepNavy border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="px-3.5 py-2 rounded-2xl bg-aiTeal/10 dark:bg-aiTeal/20 text-aiTeal text-center">
                  <Clock className="w-4 h-4 mx-auto mb-0.5" />
                  <span className="font-mono text-xs font-bold block">
                    {slot.start_time} - {slot.end_time}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-aiTeal bg-aiTeal/10 px-2 py-0.5 rounded">
                      {slot.subject_code}
                    </span>
                    <h3 className="text-sm font-bold text-midnight dark:text-white">
                      {slot.subject_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {slot.faculty_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 font-semibold text-midnight dark:text-white">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {slot.room}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="navy" size="md">
                  {slot.class_name || 'Class'} • {slot.division_name || 'Div A'}
                </Badge>
                <Badge variant="teal" size="sm">Active</Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Schedule Classroom Lecture Slot"
        subtitle="Verifies faculty availability and classroom occupancy before booking"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          {conflictWarning && (
            <div className="p-3.5 bg-dangerRed/10 border border-dangerRed/30 rounded-xl text-dangerRed-dark dark:text-dangerRed-light text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{conflictWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Day of Week
              </label>
              <select
                value={newSlot.day_of_week}
                onChange={e => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-midnight dark:text-white"
              >
                {daysOfWeek.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Classroom / Lab *
              </label>
              <input
                type="text"
                required
                value={newSlot.room}
                onChange={e => setNewSlot({ ...newSlot, room: e.target.value })}
                placeholder="e.g. Lab 402 - AI Vision Lab"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time (HH:MM)
              </label>
              <input
                type="text"
                required
                value={newSlot.start_time}
                onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })}
                placeholder="09:30"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-midnight dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time (HH:MM)
              </label>
              <input
                type="text"
                required
                value={newSlot.end_time}
                onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })}
                placeholder="11:30"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-midnight dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={newSlot.subject_id}
                onChange={e => setNewSlot({ ...newSlot, subject_id: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Faculty
              </label>
              <select
                value={newSlot.faculty_id}
                onChange={e => setNewSlot({ ...newSlot, faculty_id: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              >
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.full_name} ({f.faculty_id_code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-aiTeal text-midnight font-bold rounded-xl text-xs hover:bg-aiTeal-light shadow-glow-teal"
            >
              {isSaving ? 'Verifying Conflict Engine...' : 'Check & Confirm Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

