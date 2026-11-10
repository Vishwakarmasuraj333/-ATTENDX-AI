import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { LiveAttendance } from './pages/LiveAttendance';
import { FaceEnrollment } from './pages/FaceEnrollment';
import { AttendanceManagement } from './pages/AttendanceManagement';
import { StudentManagement } from './pages/StudentManagement';
import { FacultyManagement } from './pages/FacultyManagement';
import { AcademicManagement } from './pages/AcademicManagement';
import { TimetableManagement } from './pages/TimetableManagement';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { StudentPortal } from './pages/StudentPortal';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvasBg dark:bg-midnight flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-aiTeal border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 mt-2">Loading AttendX AI Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Enterprise Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="live-attendance" element={<LiveAttendance />} />
              <Route path="face-enrollment" element={<FaceEnrollment />} />
              <Route path="attendance-management" element={<AttendanceManagement />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="student-portal" element={<StudentPortal />} />
              <Route path="faculty" element={<FacultyManagement />} />
              <Route path="academic" element={<AcademicManagement />} />
              <Route path="timetables" element={<TimetableManagement />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
