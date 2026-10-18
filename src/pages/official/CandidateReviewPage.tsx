import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Check, 
  X,
  Loader2
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { CandidateApplication, Election } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface CandidateReviewPageProps {
  navigate: (path: string) => void;
}

export const CandidateReviewPage: React.FC<CandidateReviewPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Review modal state
  const [selectedApp, setSelectedApp] = useState<CandidateApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      const elecRes = await api.getElections();
      setElections(elecRes.elections);

      const appsPromises = elecRes.elections.map(e => api.getElectionApplications(e.id).catch(() => ({ applications: [] })));
      const appsResults = await Promise.all(appsPromises);
      const allApps = appsResults.flatMap(r => r.applications);
      setApplications(allApps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const unsub = addListener(() => loadData());
    return unsub;
  }, [addListener]);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedApp) return;
    if (decision === 'REJECT' && !rejectionReason.trim()) {
      alert('Please provide a statutory rejection reason for the candidate audit file.');
      return;
    }

    setProcessing(true);
    try {
      await api.reviewApplication(selectedApp.id, {
        decision,
        rejection_reason: decision === 'REJECT' ? rejectionReason.trim() : undefined
      });
      setSelectedApp(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Decision processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = applications.filter(a => {
    const matchesSearch = a.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
                          a.employee_id.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Candidate Applications Scrutiny</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review candidate eligibility, examine manifestos, and determine ballot placement
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search candidate name or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Submissions' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'APPROVED', label: 'Approved on Ballot' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'WITHDRAWN', label: 'Withdrawn' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Candidate</th>
                <th className="py-3 px-4 font-semibold">Election</th>
                <th className="py-3 px-4 font-semibold">Position</th>
                <th className="py-3 px-4 font-semibold">Submitted</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No candidate applications matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => {
                  const elec = elections.find(e => e.id === app.election_id);
                  const pos = elec?.positions.find(p => p.id === app.position_id);

                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.candidate_name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{app.employee_id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate">
                        {elec?.title || 'Election'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {pos?.title || 'Contested Seat'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setRejectionReason(app.rejection_reason || '');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          View & Scrutinize
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scrutiny Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Candidacy Proposal Dossier
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedApp.candidate_name}</h3>
                <span className="text-xs font-mono text-slate-500">Employee ID: {selectedApp.employee_id}</span>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
              <div>
                <strong className="text-slate-900">Statement of Purpose / Manifesto:</strong>
                <p className="mt-1 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedApp.statement_of_purpose}
                </p>
              </div>

              <div>
                <strong className="text-slate-900">Qualifications & Relevant Experience:</strong>
                <p className="mt-1 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedApp.qualifications}
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900">
                ✓ Candidate completed statutory declarations and affirmed membership in good standing.
              </div>

              {selectedApp.status === 'PENDING' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Rejection Reason (Required if rejecting candidacy):
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete service seniority records or disciplinary disqualification..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              )}

              {selectedApp.status === 'REJECTED' && selectedApp.rejection_reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800">
                  <strong className="block text-rose-900">Recorded Rejection Reason:</strong>
                  <span>{selectedApp.rejection_reason}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-mono">Status: {selectedApp.status}</span>

              {selectedApp.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision('REJECT')}
                    disabled={processing}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  >
                    Reject Candidacy
                  </button>
                  <button
                    onClick={() => handleDecision('APPROVE')}
                    disabled={processing}
                    className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    Approve Candidate
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
