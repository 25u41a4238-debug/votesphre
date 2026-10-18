import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Users, 
  Award, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginPageProps {
  navigate: (path: string) => void;
  defaultRole?: 'PARTICIPANT' | 'OFFICIAL';
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, defaultRole = 'PARTICIPANT' }) => {
  const { login, switchDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [intendedRole, setIntendedRole] = useState<'PARTICIPANT' | 'OFFICIAL'>(defaultRole);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
        intended_role: intendedRole
      });

      // Role check and redirects based on authoritative backend profile
      if (user.account_role === 'PLATFORM_ADMIN') {
        navigate('/platform-admin/dashboard');
      } else if (user.account_role === 'OFFICIAL') {
        if (user.approval_status === 'APPROVED') {
          navigate('/official/dashboard');
        } else {
          navigate('/pending-approval');
        }
      } else {
        // Participant
        navigate('/participant/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (roleType: 'PARTICIPANT' | 'OFFICIAL' | 'ADMIN') => {
    setError(null);
    setSubmitting(true);
    try {
      let targetId = 'usr-part-1';
      if (roleType === 'OFFICIAL') targetId = 'usr-official-1';
      if (roleType === 'ADMIN') targetId = 'usr-admin';

      const user = await switchDemo(targetId);
      if (user.account_role === 'PLATFORM_ADMIN') navigate('/platform-admin/dashboard');
      else if (user.account_role === 'OFFICIAL') navigate('/official/dashboard');
      else navigate('/participant/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Civil Service Single Sign-On
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Portal Authentication
          </h2>
          <p className="text-xs text-slate-600">
            Sign in to access your association voting ballots or administrative dashboard
          </p>
        </div>

        <div className="mt-6 bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-8">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Intended Role Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Portal Role
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIntendedRole('PARTICIPANT')}
                  className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                    intendedRole === 'PARTICIPANT'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Participant
                </button>
                <button
                  type="button"
                  onClick={() => setIntendedRole('OFFICIAL')}
                  className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                    intendedRole === 'OFFICIAL'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Election Official
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Government Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gov-portal.demo"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset demonstration: Pre-seeded accounts use password "Demo123!", "Official123!", or "Admin123!". You can also use the 1-Click Fast Logins below.')}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fast Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Instant Demo Personas
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('PARTICIPANT')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-blue-50/60 hover:border-blue-300 transition text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-blue-900">
                    Jane Doe (Participant)
                  </div>
                  <div className="text-[11px] text-slate-500">Government Employees Association • Verified</div>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('OFFICIAL')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-indigo-50/60 hover:border-indigo-300 transition text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-900">
                    Officer Davis (Election Official)
                  </div>
                  <div className="text-[11px] text-slate-500">Authorized Scrutineer for GEA & Teachers</div>
                </div>
                <span className="text-[11px] text-indigo-600 font-semibold">Login →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition text-xs flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    Commissioner Sterling (Platform Admin)
                  </div>
                  <div className="text-[11px] text-slate-500">Official Approvals & System Management</div>
                </div>
                <span className="text-[11px] text-slate-600 font-semibold">Login →</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-600 font-semibold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
