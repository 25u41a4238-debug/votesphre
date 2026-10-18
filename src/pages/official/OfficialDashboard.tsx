import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Layers, 
  Clock, 
  Vote, 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { 
  Election, 
  CandidateApplication, 
  ManualVerificationRequest, 
  Association,
  AuditLogItem 
} from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface OfficialDashboardProps {
  navigate: (path: string) => void;
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [elections, setElections] = useState<Election[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<ManualVerificationRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick review modal
  const [reviewingApp, setReviewingApp] = useState<CandidateApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  const loadData = async () => {
    try {
      const [elecRes, assocRes, verifRes, logRes] = await Promise.all([
        api.getElections(),
        api.getAssociations(),
        api.getVerificationRequests(),
        api.getAuditLogs()
      ]);
      setElections(elecRes.elections);
      setAssociations(assocRes.associations);
      setVerificationRequests(verifRes.requests);
      setAuditLogs(logRes.logs.slice(0, 5));

      // Fetch applications across all authorized elections
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

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = addListener(() => {
      loadData();
    });
    return unsubscribe;
  }, [addListener]);

  const handleReviewApplication = async (decision: 'APPROVE' | 'REJECT') => {
    if (!reviewingApp) return;
    setProcessingDecision(true);
    try {
      await api.reviewApplication(reviewingApp.id, {
        decision,
        rejection_reason: decision === 'REJECT' ? rejectionReason : undefined
      });
      setReviewingApp(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setProcessingDecision(false);
    }
  };

  const handleReviewVerification = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.reviewVerificationRequest(requestId, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
    }
  };

  // KPIs
  const totalElections = elections.length;
  const draftElections = elections.filter(e => e.status === 'DRAFT').length;
  const publishedElections = elections.filter(e => e.status !== 'DRAFT').length;
  const nominationOpenElections = elections.filter(e => e.status === 'NOMINATION_OPEN').length;
  const votingOpenElections = elections.filter(e => e.status === 'VOTING_OPEN').length;
  const pendingApplications = applications.filter(a => a.status === 'PENDING').length;
  const awaitingPublicationElections = elections.filter(e => e.status === 'VOTING_CLOSED').length;
  const pendingVerificationCount = verificationRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Electoral Board Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Election Official Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Welcome, {user?.full_name} • Scrutineer Authorization Active
          </p>
        </div>

        <button
          onClick={() => navigate('/official/elections/create')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Election
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Total Elections</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalElections}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Drafts</div>
          <div className="text-xl font-bold text-slate-600 mt-1">{draftElections}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Published</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{publishedElections}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Nominations Open</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{nominationOpenElections}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Voting Open</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{votingOpenElections}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="text-[11px] text-amber-800 font-medium">Pending Apps</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{pendingApplications}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 shadow-xs">
          <div className="text-[11px] text-teal-800 font-medium">Awaiting Results</div>
          <div className="text-xl font-bold text-teal-700 mt-1">{awaitingPublicationElections}</div>
        </div>
      </div>

      {/* Pending Reviews Notice Bar if items awaiting */}
      {(pendingApplications > 0 || pendingVerificationCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Scrutiny Tasks Requiring Official Action:</strong>{' '}
              {pendingApplications} candidate proposal{pendingApplications !== 1 ? 's' : ''} and{' '}
              {pendingVerificationCount} identity review{pendingVerificationCount !== 1 ? 's' : ''} awaiting your review.
            </div>
          </div>
          <button
            onClick={() => navigate('/official/candidates')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 self-start sm:self-auto"
          >
            Review Applications
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Elections Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Elections</h3>
                <p className="text-xs text-slate-500">Authorized elections in your administration queue</p>
              </div>
              <button
                onClick={() => navigate('/official/elections')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                View all elections <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-semibold">Election Title</th>
                    <th className="py-2.5 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold">Eligible Voters</th>
                    <th className="py-2.5 font-semibold">Voted</th>
                    <th className="py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {elections.slice(0, 5).map((elec) => {
                    const assoc = associations.find(a => elec.association_ids.includes(a.id));
                    return (
                      <tr key={elec.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 pr-2">
                          <div className="font-bold text-slate-900">{elec.title}</div>
                          <div className="text-[11px] text-slate-400">{assoc?.name || 'Association'}</div>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={elec.status} size="sm" />
                        </td>
                        <td className="py-3 font-medium text-slate-700">
                          {elec.eligible_employee_ids.length}
                        </td>
                        <td className="py-3 font-medium text-slate-700">
                          {elec.total_voters_participated || 0}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => navigate(`/official/elections/${elec.id}`)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Candidate Applications List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Candidate Applications Awaiting Scrutiny
                </h3>
                <p className="text-xs text-slate-500">Review manifestos and approve or reject submissions</p>
              </div>
              <button
                onClick={() => navigate('/official/candidates')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                All proposals <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {applications.filter(a => a.status === 'PENDING').length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No pending candidate proposals requiring review.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.filter(a => a.status === 'PENDING').slice(0, 3).map((app) => {
                  const elec = elections.find(e => e.id === app.election_id);
                  return (
                    <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{app.candidate_name}</h4>
                          <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {app.employee_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Election: <strong className="text-slate-800">{elec?.title}</strong>
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1 italic">
                          "{app.statement_of_purpose}"
                        </p>
                      </div>

                      <button
                        onClick={() => setReviewingApp(app)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs shrink-0"
                      >
                        Review Proposal
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verification Requests & Audit Activity */}
        <div className="space-y-6">
          {/* Manual Identity Verification Requests Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Manual Verification Queue ({verificationRequests.filter(r => r.status === 'PENDING').length})
            </h3>
            <p className="text-xs text-slate-500">
              Alternate verification submissions from participants who requested official review
            </p>

            {verificationRequests.filter(r => r.status === 'PENDING').length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                No manual verification requests pending.
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequests.filter(r => r.status === 'PENDING').map((req) => (
                  <div key={req.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-slate-900 block">{req.full_name}</strong>
                        <span className="font-mono text-[11px] text-slate-500">{req.employee_id}</span>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                        Pending
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                      <strong>Doc:</strong> {req.document_type}
                      <p className="mt-0.5">{req.reason}</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleReviewVerification(req.id, 'REJECTED')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReviewVerification(req.id, 'APPROVED')}
                        className="px-3 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                      >
                        Approve Identity
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit Events */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              Administrative Audit Log
            </h3>

            <div className="space-y-2.5 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Candidate Modal */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Candidate Proposal Scrutiny
                </span>
                <h3 className="text-lg font-bold text-slate-900">{reviewingApp.candidate_name}</h3>
                <span className="text-xs font-mono text-slate-500">Employee ID: {reviewingApp.employee_id}</span>
              </div>
              <button onClick={() => setReviewingApp(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
              <div>
                <strong className="text-slate-900">Statement of Purpose:</strong>
                <p className="mt-1 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {reviewingApp.statement_of_purpose}
                </p>
              </div>

              <div>
                <strong className="text-slate-900">Qualifications & Experience:</strong>
                <p className="mt-1 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {reviewingApp.qualifications}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Rejection Reason (Mandatory if rejecting):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the statutory reason or incomplete documentation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => handleReviewApplication('REJECT')}
                disabled={processingDecision}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              >
                Reject Candidacy
              </button>
              <button
                onClick={() => handleReviewApplication('APPROVE')}
                disabled={processingDecision}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Approve & Place on Ballot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
