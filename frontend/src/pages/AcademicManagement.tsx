import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  Edit,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Department, Course, Subject, ClassGroup } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const AcademicManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'courses' | 'subjects' | 'classes'>('departments');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);

  // Modals
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Forms
  const [newDept, setNewDept] = useState({ name: '', code: '', description: '', hod_name: '', college_id: 1 });
  const [newCourse, setNewCourse] = useState({ name: '', code: '', department_id: 1, degree_level: 'Postgraduate', total_semesters: 4 });
  const [newSubject, setNewSubject] = useState({ subject_name: '', subject_code: '', department_id: 1, course_id: 1, semester_id: 1, credit_hours: 4, total_lectures_planned: 45 });

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      const [dp, cr, sb, cl] = await Promise.all([
        apiRequest<Department[]>('/academic/departments'),
        apiRequest<Course[]>('/academic/courses'),
        apiRequest<Subject[]>('/academic/subjects'),
        apiRequest<ClassGroup[]>('/academic/classes'),
      ]);
      setDepartments(dp);
      setCourses(cr);
      setSubjects(sb);
      setClasses(cl);
    } catch (err) {
      console.error('Failed to load academic governance structure:', err);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest<Department>('/academic/departments', {
        method: 'POST',
        body: JSON.stringify(newDept),
      });
      setDepartments([...departments, created]);
      setShowAddDeptModal(false);
      setNewDept({ name: '', code: '', description: '', hod_name: '', college_id: 1 });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest<Course>('/academic/courses', {
        method: 'POST',
        body: JSON.stringify(newCourse),
      });
      setCourses([...courses, created]);
      setShowAddCourseModal(false);
      setNewCourse({ name: '', code: '', department_id: 1, degree_level: 'Postgraduate', total_semesters: 4 });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest<Subject>('/academic/subjects', {
        method: 'POST',
        body: JSON.stringify(newSubject),
      });
      setSubjects([...subjects, created]);
      setShowAddSubjectModal(false);
      setNewSubject({ subject_name: '', subject_code: '', department_id: 1, course_id: 1, semester_id: 1, credit_hours: 4, total_lectures_planned: 45 });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-deepNavy p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-midnight dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-aiTeal" /> Campus Academic Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hierarchy: College → Department → Course → Academic Year → Semester → Class → Division → Subject
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'departments'
                ? 'bg-white dark:bg-deepNavy text-midnight dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-midnight dark:hover:text-white'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'courses'
                ? 'bg-white dark:bg-deepNavy text-midnight dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-midnight dark:hover:text-white'
            }`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'subjects'
                ? 'bg-white dark:bg-deepNavy text-midnight dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-midnight dark:hover:text-white'
            }`}
          >
            Curriculum Subjects ({subjects.length})
          </button>
        </div>
      </div>

      {/* Departments View */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-midnight dark:text-white">
              Institutional Academic Departments
            </h3>
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="px-4 py-2 bg-aiTeal hover:bg-aiTeal-light text-midnight font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(d => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-white dark:bg-deepNavy border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-aiTeal bg-aiTeal/10 px-2 py-0.5 rounded">
                      {d.code}
                    </span>
                    <h4 className="text-sm font-bold text-midnight dark:text-white">
                      {d.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {d.description || 'Configured academic department unit.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    HOD: <strong className="text-midnight dark:text-white">{d.hod_name || 'Designated Dean'}</strong>
                  </p>
                </div>
                <Badge variant="teal" size="sm">Active</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courses View */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-midnight dark:text-white">
              Registered Degree Programmes & Courses
            </h3>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="px-4 py-2 bg-aiTeal hover:bg-aiTeal-light text-midnight font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(c => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white dark:bg-deepNavy border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-electricBlue bg-electricBlue/10 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <h4 className="text-sm font-bold text-midnight dark:text-white">
                      {c.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Degree Level: <strong className="text-midnight dark:text-white">{c.degree_level}</strong> • {c.total_semesters} Semesters
                  </p>
                </div>
                <Badge variant="blue" size="sm">Accredited</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subjects View */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-midnight dark:text-white">
              Curriculum Lecture Modules & Syllabi
            </h3>
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="px-4 py-2 bg-aiTeal hover:bg-aiTeal-light text-midnight font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          <div className="bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase">
                  <th className="py-3 px-6">Subject Code</th>
                  <th className="py-3 px-6">Subject Name</th>
                  <th className="py-3 px-6">Credits</th>
                  <th className="py-3 px-6">Planned Lectures</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-6 font-mono font-bold text-aiTeal">
                      {s.subject_code}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-midnight dark:text-white">
                      {s.subject_name}
                    </td>
                    <td className="py-3.5 px-6 font-mono">{s.credit_hours} Credits</td>
                    <td className="py-3.5 px-6 font-mono">{s.total_lectures_planned} Sessions</td>
                    <td className="py-3.5 px-6">
                      <Badge variant="teal" size="sm">Active Syllabus</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Dept Modal */}
      <Modal isOpen={showAddDeptModal} onClose={() => setShowAddDeptModal(false)} title="Create Academic Department">
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={newDept.name}
              onChange={e => setNewDept({ ...newDept, name: e.target.value })}
              placeholder="e.g. Artificial Intelligence & Data Science"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Code *</label>
            <input
              type="text"
              required
              value={newDept.code}
              onChange={e => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
              placeholder="e.g. AIDS"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-midnight dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Head of Department (HOD)</label>
            <input
              type="text"
              value={newDept.hod_name}
              onChange={e => setNewDept({ ...newDept, hod_name: e.target.value })}
              placeholder="e.g. Dr. Ramesh Gupta"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddDeptModal(false)} className="px-4 py-2 text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-aiTeal font-bold rounded-xl text-xs text-midnight">Save Department</button>
          </div>
        </form>
      </Modal>

      {/* Add Course Modal */}
      <Modal isOpen={showAddCourseModal} onClose={() => setShowAddCourseModal(false)} title="Create Degree Programme / Course">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={newCourse.name}
              onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
              placeholder="e.g. Master of Computer Applications"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Code *</label>
            <input
              type="text"
              required
              value={newCourse.code}
              onChange={e => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
              placeholder="e.g. MCA"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-midnight dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
            <select
              value={newCourse.department_id}
              onChange={e => setNewCourse({ ...newCourse, department_id: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddCourseModal(false)} className="px-4 py-2 text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-aiTeal font-bold rounded-xl text-xs text-midnight">Save Course</button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal isOpen={showAddSubjectModal} onClose={() => setShowAddSubjectModal(false)} title="Register Curriculum Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={newSubject.subject_name}
              onChange={e => setNewSubject({ ...newSubject, subject_name: e.target.value })}
              placeholder="e.g. Cryptography & Blockchain Protocols"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Code *</label>
            <input
              type="text"
              required
              value={newSubject.subject_code}
              onChange={e => setNewSubject({ ...newSubject, subject_code: e.target.value.toUpperCase() })}
              placeholder="e.g. MIT205"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-midnight dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddSubjectModal(false)} className="px-4 py-2 text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-aiTeal font-bold rounded-xl text-xs text-midnight">Save Subject</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

