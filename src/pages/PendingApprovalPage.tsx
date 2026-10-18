import React from 'react';
import { ShieldAlert, Clock, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface PendingApprovalPageProps {
  navigate: (path: string) => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({ navigate }) => {
  const { user, refreshUser, logout } = useAuth();

  const handleRefresh = async () => {
    await refreshUser();
    if (user?.approval_status === 'APPROVED') {
      navigate('/official/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900">Official Authorization Pending</h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Your Election Official account request for <strong className="text-slate-900">{user?.full_name}</strong> is currently awaiting statutory approval from the Platform Administrator.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left text-xs text-amber-900 space-y-1">
          <div className="font-semibold">Security Governance Protocol:</div>
          <div>• Creation of official election drafts is locked until authorized.</div>
          <div>• Scrutineer candidate review queues are restricted.</div>
          <div>• You will receive an in-app alert when your credentials are confirmed.</div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleRefresh}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Authorization Status
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full py-2 px-4 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
