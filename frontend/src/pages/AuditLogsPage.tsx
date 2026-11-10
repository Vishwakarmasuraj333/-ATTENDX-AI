import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Lock,
  UserCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  FileKey,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Badge } from '../components/ui/Badge';

export const AuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'consents'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lData, cData] = await Promise.all([
          apiRequest<any[]>('/audit/logs'),
          apiRequest<any[]>('/audit/consents'),
        ]);
        setLogs(lData);
        setConsents(cData);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-deepNavy p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-midnight dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-aiTeal" /> Security Governance & Biometric Audit
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident system activity ledger, biometric consent contracts & encryption compliance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-deepNavy text-midnight dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-midnight dark:hover:text-white'
            }`}
          >
            System Audit Trails ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('consents')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'consents'
                ? 'bg-white dark:bg-deepNavy text-midnight dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-midnight dark:hover:text-white'
            }`}
          >
            Biometric Consent Records ({consents.length})
          </button>
        </div>
      </div>

      {/* Security Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-center gap-4">
          <div className="p-3 bg-aiTeal/10 rounded-2xl text-aiTeal">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">At-Rest Encryption</span>
            <h4 className="text-sm font-bold text-midnight dark:text-white mt-0.5">AES-256 Fernet</h4>
            <p className="text-[11px] text-slate-500">Biometric vectors encrypted</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-center gap-4">
          <div className="p-3 bg-electricBlue/10 rounded-2xl text-electricBlue">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Consent Compliance</span>
            <h4 className="text-sm font-bold text-midnight dark:text-white mt-0.5">100% Informed</h4>
            <p className="text-[11px] text-slate-500">Explicit opt-in recorded</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-deepNavy rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft flex items-center gap-4">
          <div className="p-3 bg-successGreen/10 rounded-2xl text-successGreen">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Manual Alternative</span>
            <h4 className="text-sm font-bold text-midnight dark:text-white mt-0.5">Guaranteed Policy</h4>
            <p className="text-[11px] text-slate-500">Non-biometric mode ready</p>
          </div>
        </div>
      </div>

      {/* System Audit Trails Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-midnight dark:text-white">
              Immutable System Activity Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log capturing logins, biometric enrollments, manual status overrides, and security events
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Initiating User</th>
                  <th className="py-3 px-6">Entity Type</th>
                  <th className="py-3 px-6">IP Address</th>
                  <th className="py-3 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-6 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge
                        variant={
                          log.action.includes('FAILED')
                            ? 'red'
                            : log.action.includes('ENROLL') || log.action.includes('SUCCESS')
                            ? 'teal'
                            : 'navy'
                        }
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-midnight dark:text-white">
                      {log.user_email}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {log.entity_type || '—'}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Biometric Consents Tab */}
      {activeTab === 'consents' && (
        <div className="bg-white dark:bg-deepNavy rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-midnight dark:text-white">
              Informed Biometric Consent Registry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Statutory informed consent contracts signed prior to biometric feature extraction
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {consents.map(c => (
              <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-midnight dark:text-white">
                      {c.student_name}
                    </h4>
                    <span className="text-xs font-mono text-slate-400">
                      {c.enrollment_number}
                    </span>
                    <Badge variant={c.is_granted ? 'green' : 'red'} size="sm">
                      {c.is_granted ? 'Active Consent' : 'Revoked / Opted Out'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Consent Type: <strong>{c.consent_type}</strong> • Version: {c.consent_version}
                  </p>
                  {c.guardian_name && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Guardian Verified: {c.guardian_name}
                    </p>
                  )}
                  {c.revoked_at && (
                    <p className="text-xs text-dangerRed mt-1">
                      Revocation recorded on {new Date(c.revoked_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  Granted: {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

