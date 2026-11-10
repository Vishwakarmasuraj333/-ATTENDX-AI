import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Faculty, Department, Subject, Division } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const FacultyManagement: React.FC = () => {
  const { hasRole } = useAuth();

  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  // Forms
  const [newFaculty, setNewFaculty] = useState({
    faculty_id_code: '',
    full_name: '',
    email: '',
    phone: '',
    designation: 'Assistant Professor',
    department_id: 1,
    account_status: 'Active',
  });

  const [allocation, setAllocation] = useState({
    subject_id: 1,
    division_id: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fac, dep, sub, div] = await Promise.all([
        apiRequest<Faculty[]>('/faculty'),
        apiRequest<Department[]>('/academic/departments'),
        apiRequest<Subject[]>('/academic/subjects'),
        apiRequest<Division[]>('/academic/divisions'),
      ]);
      setFacultyList(fac);
      setDepartments(dep);
      setSubjects(sub);
      setDivisions(div);
      if (dep.length > 0) setNewFaculty(prev => ({ ...prev, department_id: dep[0].id }));
      if (sub.length > 0) setAllocation(prev => ({ ...prev, subject_id: sub[0].id }));
      if (div.length > 0) setAllocation(prev => ({ ...prev, division_id: div[0].id }));
    } catch (err) {
      console.error('Failed to load faculty:', err);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<Faculty>('/faculty', {
        method: 'POST',
        body: JSON.stringify(newFaculty),
      });
      setFacultyList([...facultyList, res]);
      setShowAddModal(false);
      setNewFaculty({
        faculty_id_code: '',
        full_name: '',
        email: '',
        phone: '',
        designation: 'Assistant Professor',
        department_id: departments[0]?.id || 1,
        account_status: 'Active',
      });
    } catch (err: any) {
      alert(`Failed to add faculty: ${err.message}`);
    }
  };

  const handleAllocateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;

    try {
      await apiRequest(`/faculty/${selectedFaculty.id}/allocate-subject`, {
        method: 'POST',
        body: JSON.stringify(allocation),
      });
      alert('Subject successfully allocated to faculty.');
      setShowAllocateModal(false);
      fetchData();
    } catch (err: any) {
      alert(`Subject allocation error: ${err.message}`);
    }
  };

  const filteredFaculty = facultyList.filter(f =>
    f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.faculty_id_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-deepNavy p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-midnight dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-aiTeal" /> Faculty & Course Instructor Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Faculty credentials, departmental designation & curriculum course allocations
          </p>
        </div>

        {hasRole(['Super Admin', 'College Admin', 'HOD']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-aiTeal hover:bg-aiTeal-light text-midnight font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-glow-teal transition-all"
          >
            <Plus className="w-4 h-4" /> Add Faculty Member
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search faculty by name, code, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-midnight dark:text-white"
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFaculty.map(f => (
          <div
            key={f.id}
            className="bg-white dark:bg-deepNavy rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-deepNavy to-aiTeal flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {f.full_name.charAt(0)}
                </div>
                <Badge variant="teal" size="sm">
                  {f.designation}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-midnight dark:text-white">
                {f.full_name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {f.faculty_id_code} • {f.department_name}
              </p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{f.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{f.phone || '—'}</span>
                </div>
              </div>

              {/* Allocated Subjects */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Allocated Subjects ({f.assigned_subjects?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(f.assigned_subjects || []).map((sub, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-aiTeal rounded-md border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      {sub.subject_code || 'MIT'}
                    </span>
                  ))}
                  {(!f.assigned_subjects || f.assigned_subjects.length === 0) && (
                    <span className="text-[11px] text-slate-400 italic">No modules allocated yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedFaculty(f);
                  setShowAllocateModal(true);
                }}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-aiTeal hover:text-midnight text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" /> Allocate Subject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Faculty Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register Faculty Member">
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newFaculty.full_name}
                onChange={e => setNewFaculty({ ...newFaculty, full_name: e.target.value })}
                placeholder="e.g. Prof. Rajesh Sharma"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty ID Code *</label>
              <input
                type="text"
                required
                value={newFaculty.faculty_id_code}
                onChange={e => setNewFaculty({ ...newFaculty, faculty_id_code: e.target.value.toUpperCase() })}
                placeholder="e.g. FAC-IT-105"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-midnight dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={newFaculty.email}
                onChange={e => setNewFaculty({ ...newFaculty, email: e.target.value })}
                placeholder="faculty@trinity.edu.in"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
              <select
                value={newFaculty.designation}
                onChange={e => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
            <select
              value={newFaculty.department_id}
              onChange={e => setNewFaculty({ ...newFaculty, department_id: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-aiTeal font-bold rounded-xl text-xs text-midnight">Save Faculty</button>
          </div>
        </form>
      </Modal>

      {/* Allocate Subject Modal */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        title={`Allocate Subject to ${selectedFaculty?.full_name}`}
      >
        <form onSubmit={handleAllocateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Subject</label>
            <select
              value={allocation.subject_id}
              onChange={e => setAllocation({ ...allocation, subject_id: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class Division</label>
            <select
              value={allocation.division_id}
              onChange={e => setAllocation({ ...allocation, division_id: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white"
            >
              {divisions.map(d => (
                <option key={d.id} value={d.id}>{d.division_name} ({d.room_number || 'Room'})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAllocateModal(false)} className="px-4 py-2 text-xs font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-aiTeal font-bold rounded-xl text-xs text-midnight">Allocate Subject</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

