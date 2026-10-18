import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft, 
  Plus, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { CandidateApplication, Election } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface ParticipantApplicationsProps {
  navigate: (path: string) => void;
}

export const ParticipantApplications: React.FC<ParticipantApplicationsProps> = ({ navigate }) => {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [appRes, elecRes] = await Promise.all([
        api.getParticipantApplications(),
        api.getElections()
      ]);
      setApplications(appRes.applications);
      setElections(elecRes.elections);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Are you sure you wish to withdraw this candidacy application? This action cannot be undone.')) {
      return;
    }
    setWithdrawingId(appId);
    try {
      await api.withdrawApplication(appId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Candidate Applications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status, review Scrutineer decisions, and manage contested election nominations
          </p>
        </div>
        <button
          onClick={() => navigate('/participant/nominations')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Nomination
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Applications on Record</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not submitted any candidacy proposals. When nomination periods open, you can apply to run for association seats.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/participant/nominations')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Browse Open Nominations
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const elec = elections.find(e => e.id === app.election_id);
            const pos = elec?.positions.find(p => p.id === app.position_id);

            return (
              <div 
                key={app.id} 
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {elec?.title || 'Election'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Position: <strong className="text-slate-800">{pos?.title || 'Contested Position'}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} size="md" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700">Statement of Purpose:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {app.statement_of_purpose}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700">Qualifications:</span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {app.qualifications}
                      </p>
                    </div>

                    {app.status === 'REJECTED' && app.rejection_reason && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800">
                        <strong className="block text-rose-900">Scrutineer Rejection Reason:</strong>
                        <span className="mt-0.5 block">{app.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <span>
                    Submitted: {new Date(app.submitted_at).toLocaleString()}
                  </span>

                  {app.status === 'PENDING' && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={withdrawingId === app.id}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                    >
                      {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw Candidacy'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
