import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Upload,
  UserCheck,
  Phone,
  Mail,
  Shield,
  Trash2,
  Edit,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Student, Department, Course, ClassGroup, Division } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const StudentManagement: React.FC = () => {
  const { hasRole } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [biometricFilter, setBiometricFilter] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // New Student Form
  const [newStudent, setNewStudent] = useState({
    enrollment_number: '',
    roll_number: '',
    full_name: '',
    email: '',
    phone: '',
    department_id: 1,
    course_id: 1,
    academic_year_id: 1,
    semester_id: 1,
    class_id: 1,
    division_id: 1,
    admission_date: new Date().toISOString().split('T')[0],
  });

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkStatus, setBulkStatus] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [stData, dpData, crData, clData, dvData] = await Promise.all([
        apiRequest<Student[]>('/students'),
        apiRequest<Department[]>('/academic/departments'),
        apiRequest<Course[]>('/academic/courses'),
        apiRequest<ClassGroup[]>('/academic/classes'),
        apiRequest<Division[]>('/academic/divisions'),
      ]);
      setStudents(stData);
      setDepartments(dpData);
      setCourses(crData);
      setClasses(clData);
      setDivisions(dvData);
    } catch (err) {
      console.error('Failed to load student management data:', err);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiRequest<Student>('/students', {
        method: 'POST',
        body: JSON.stringify(newStudent),
      });
      setStudents(prev => [...prev, res]);
      setShowAddModal(false);
      setNewStudent({
        enrollment_number: '',
        roll_number: '',
        full_name: '',
        email: '',
        phone: '',
        department_id: departments[0]?.id || 1,
        course_id: courses[0]?.id || 1,
        academic_year_id: 1,
        semester_id: 1,
        class_id: classes[0]?.id || 1,
        division_id: divisions[0]?.id || 1,
        admission_date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      alert(`Could not create student: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;

    setIsSaving(true);
    setBulkStatus(null);
    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const token = localStorage.getItem('attendx_token');
      const response = await fetch('http://localhost:8000/api/v1/students/bulk-import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Bulk import failed');
      }

      const res = await response.json();
      setBulkStatus(res);
      fetchInitialData();
    } catch (err: any) {
      alert(`Bulk import error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrollment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === 'ALL' || s.department_id === Number(deptFilter);
    const matchesBio =
      biometricFilter === 'ALL' ||
      (biometricFilter === 'YES' && s.biometric_enrolled) ||
      (biometricFilter === 'NO' && !s.biometric_enrolled);

    return matchesSearch && matchesDept && matchesBio;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-deepNavy p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-midnight dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-aiTeal" /> Student Academic Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student cohort roster, biometric enrolment verification & automated account provisioning
          </p>
        </div>

        {hasRole(['Super Admin', 'College Admin', 'HOD', 'Class Coordinator']) && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors border border-slate-300 dark:border-slate-700"
            >
              <Upload className="w-4 h-4 text-aiTeal" />
              <span>Bulk CSV Import</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-aiTeal hover:bg-aiTeal-light text-midnight font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-glow-teal transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by name, roll number, or enrollment..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-midnight dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Department
          </label>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Biometric Enrolled
          </label>
          <select
            value={biometricFilter}
            onChange={e => setBiometricFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="YES">Enrolled (Face Template Active)</option>
            <option value="NO">Pending Enrollment</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Roll</th>
                <th className="py-3.5 px-6">Student Details</th>
                <th className="py-3.5 px-6">Enrollment Number</th>
                <th className="py-3.5 px-6">Department & Course</th>
                <th className="py-3.5 px-6">Division</th>
                <th className="py-3.5 px-6">Biometrics</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono font-bold text-midnight dark:text-white">
                      {st.roll_number}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-deepNavy border border-slate-700 flex items-center justify-center font-bold text-xs text-aiTeal">
                          {st.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-midnight dark:text-white">
                            {st.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{st.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400">
                      {st.enrollment_number}
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-midnight dark:text-white">
                        {st.department_name}
                      </p>
                      <p className="text-[10px] text-slate-400">{st.course_name}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant="navy" size="sm">
                        {st.division_name || 'Div A'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6">
                      {st.biometric_enrolled ? (
                        <Badge variant="green" size="sm" dot>Enrolled</Badge>
                      ) : (
                        <Badge variant="amber" size="sm" dot>Pending</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedStudent(st)}
                        className="p-1.5 text-slate-400 hover:text-aiTeal hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Profile Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Student"
        subtitle="Enrolls student record into semester cohort & auto-provisions student portal login"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newStudent.full_name}
                onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })}
                placeholder="e.g. Aarav Mehta"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Enrollment Number (Unique) *
              </label>
              <input
                type="text"
                required
                value={newStudent.enrollment_number}
                onChange={e => setNewStudent({ ...newStudent, enrollment_number: e.target.value })}
                placeholder="e.g. TIT-2025-IT-016"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={newStudent.email}
                onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                placeholder="student@trinity.edu.in"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={newStudent.roll_number}
                onChange={e => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                placeholder="e.g. 115"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={newStudent.department_id}
                onChange={e => setNewStudent({ ...newStudent, department_id: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course
              </label>
              <select
                value={newStudent.course_id}
                onChange={e => setNewStudent({ ...newStudent, course_id: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-aiTeal text-midnight font-bold rounded-xl text-xs hover:bg-aiTeal-light shadow-glow-teal"
            >
              {isSaving ? 'Registering...' : 'Save & Enrol Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Batch Student Import (CSV)"
        subtitle="Upload a standard CSV roster containing enrollment numbers, roll numbers, and names"
      >
        <form onSubmit={handleBulkImport} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center">
            <FileSpreadsheet className="w-10 h-10 text-aiTeal mx-auto mb-2" />
            <p className="text-xs font-semibold text-midnight dark:text-white mb-1">
              Select CSV File from Computer
            </p>
            <input
              type="file"
              accept=".csv"
              required
              onChange={e => setBulkFile(e.target.files ? e.target.files[0] : null)}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-aiTeal/15 file:text-aiTeal hover:file:bg-aiTeal/25 cursor-pointer"
            />
          </div>

          {bulkStatus && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-successGreen">
                Processed {bulkStatus.total_processed} rows • {bulkStatus.successfully_imported} imported successfully!
              </p>
              {bulkStatus.failed_rows?.length > 0 && (
                <p className="text-dangerRed">
                  {bulkStatus.failed_rows.length} rows failed validation.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving || !bulkFile}
              className="px-5 py-2 bg-aiTeal text-midnight font-bold rounded-xl text-xs hover:bg-aiTeal-light"
            >
              {isSaving ? 'Importing Rows...' : 'Upload & Process'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Profile Details Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student Profile: ${selectedStudent.full_name}`}
          subtitle={`Roll: ${selectedStudent.roll_number} • ${selectedStudent.enrollment_number}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-deepNavy to-aiTeal flex items-center justify-center text-white font-black text-xl shadow-md">
                {selectedStudent.full_name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-midnight dark:text-white">
                  {selectedStudent.full_name}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedStudent.enrollment_number}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {selectedStudent.biometric_enrolled ? (
                    <Badge variant="green" size="sm" dot>Biometric Enrolled (AES-256)</Badge>
                  ) : (
                    <Badge variant="amber" size="sm" dot>Biometrics Pending</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 block mb-1">Email Address</span>
                <span className="font-semibold text-midnight dark:text-white">{selectedStudent.email}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 block mb-1">Contact Phone</span>
                <span className="font-semibold text-midnight dark:text-white">{selectedStudent.phone || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 block mb-1">Department</span>
                <span className="font-semibold text-midnight dark:text-white">{selectedStudent.department_name}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 block mb-1">Course & Cohort</span>
                <span className="font-semibold text-midnight dark:text-white">{selectedStudent.course_name}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

