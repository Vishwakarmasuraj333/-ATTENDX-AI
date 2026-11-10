import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { Modal } from '../components/ui/Modal';
import { Logo } from '../components/ui/Logo';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@trinity.edu.in');
  const [password, setPassword] = useState('Admin@123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiRequest<{
        access_token: string;
        token_type: string;
        user: {
          id: number;
          email: string;
          full_name: string;
          role: any;
          role_id: number;
          avatar_url?: string;
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(response.access_token, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersona = (pEmail: string, pPass: string) => {
    setEmail(pEmail);
    setPassword(pPass);
    setErrorMessage(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetSuccess(null);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail, new_password: newPassword }),
      });
      setResetSuccess('Password reset successfully. You may now log in.');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-aiTeal/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-electricBlue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header with Precision Vector Logo */}
        <motion.div
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6 flex flex-col items-center"
        >
          <div className="mb-3">
            <Logo size="xl" showText={false} />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black tracking-tight text-white">
              Attend<span className="text-aiTeal bg-clip-text text-transparent bg-gradient-to-r from-aiTeal to-electricBlue">X</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-aiTeal/20 to-electricBlue/20 border border-aiTeal/40 text-aiTeal font-black text-xs tracking-wider uppercase">
              AI
            </span>
          </div>

          <h2 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-aiTeal" />
            <span>Trinity Institute of Technology & AI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
              TIT-AI
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Smart Biometric Campus Vision • AY 2025–26
          </p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-deepNavy/85 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50"
        >
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 bg-dangerRed/10 border border-dangerRed/30 rounded-xl text-dangerRed-light text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Campus Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. admin@trinity.edu.in"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-aiTeal focus:ring-1 focus:ring-aiTeal transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Account Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-aiTeal hover:underline transition-all"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-aiTeal focus:ring-1 focus:ring-aiTeal transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-aiTeal to-aiTeal-dark hover:from-aiTeal-light hover:to-aiTeal text-midnight font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-glow-teal hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Academic Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-aiTeal" /> Quick Demo Role Switcher
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPersona('admin@trinity.edu.in', 'Admin@123')}
                className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-[11px] font-semibold border border-slate-700/60 hover:border-aiTeal/50 transition-all flex flex-col items-center gap-0.5"
              >
                <span>Admin</span>
                <span className="text-[9px] text-aiTeal font-mono">Full Access</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('sharma.it@trinity.edu.in', 'Faculty@123')}
                className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-[11px] font-semibold border border-slate-700/60 hover:border-aiTeal/50 transition-all flex flex-col items-center gap-0.5"
              >
                <span>Faculty</span>
                <span className="text-[9px] text-electricBlue font-mono">IT Dept</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('aarav.mehta@trinity.edu.in', 'Student@123')}
                className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-[11px] font-semibold border border-slate-700/60 hover:border-aiTeal/50 transition-all flex flex-col items-center gap-0.5"
              >
                <span>Student</span>
                <span className="text-[9px] text-emerald-400 font-mono">Self Portal</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security & Biometric Compliance Footer */}
        <div className="text-center mt-6 flex flex-col items-center gap-1 text-slate-500 text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-aiTeal" />
            <span className="font-medium text-slate-400">
              AES-256 Biometric Encryption • YuNet & SFace ONNX
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Compliant with ISO/IEC 30107-3 PAD & FIPS 140-3 Standards
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Account Password"
        subtitle="Enter your campus registered email address and desired new password"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetSuccess && (
            <div className="p-3 bg-successGreen/10 border border-successGreen/30 rounded-xl text-successGreen-light text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registered Campus Email
            </label>
            <input
              type="email"
              required
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="e.g. sharma.it@trinity.edu.in"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white focus:outline-none focus:border-aiTeal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-midnight dark:text-white focus:outline-none focus:border-aiTeal"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="px-4 py-2 bg-aiTeal text-midnight font-bold rounded-xl text-xs hover:bg-aiTeal-light transition-all"
            >
              {resetLoading ? 'Resetting...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
