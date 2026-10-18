import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Calendar, 
  Users, 
  Award, 
  Vote, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Lock,
  Clock
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Election, Candidate, Association } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface ManageElectionPageProps {
  electionId: string;
  navigate: (path: string) => void;
}

export const ManageElectionPage: React.FC<ManageElectionPageProps> = ({ electionId, navigate }) => {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [elecRes, assocRes] = await Promise.all([
        api.getElection(electionId),
        api.getAssociations()
      ]);
      setElection(elecRes.election);
      setCandidates(elecRes.candidates);
      setAssociations(assocRes.associations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [electionId]);

  useEffect(() => {
    const unsub = addListener(() => loadData());
    return unsub;
  }, [addListener]);

  const handlePublish = async () => {
    setActing(true);
    try {
      const res = await api.publishElection(electionId);
      setElection(res.election);
      setActionMessage('Election has been published successfully.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'Publishing failed');
    } finally {
      setActing(false);
    }
  };

  const handleCloseVoting = async () => {
    setActing(true);
    try {
      const res = await api.closeVoting(electionId);
      setElection(res.election);
      setActionMessage('Voting period has been formally closed.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to close voting');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading election administration record...</div>;
  }

  if (!election) {
    return (
      <div className="py-12 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">Election record not found</h3>
        <button onClick={() => navigate('/official/elections')} className="text-xs text-blue-600 underline">
          Back to elections
        </button>
      </div>
    );
  }

  const assocNames = associations
    .filter(a => election.association_ids.includes(a.id))
    .map(a => a.name)
    .join(', ');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/official/elections')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Elections
      </button>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Main Admin Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={election.status} size="lg" />
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {assocNames || 'Association Election'}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{election.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Created by {election.created_by_name} on {new Date(election.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Action buttons based on status */}
          <div className="flex items-center gap-2">
            {election.status === 'DRAFT' && (
              <button
                onClick={handlePublish}
                disabled={acting}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Election
              </button>
            )}

            {election.status === 'VOTING_OPEN' && (
              <button
                onClick={handleCloseVoting}
                disabled={acting}
                className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Close Voting Now
              </button>
            )}

            {(election.status === 'VOTING_CLOSED' || election.status === 'RESULTS_PUBLISHED') && (
              <button
                onClick={() => navigate(`/official/results?electionId=${election.id}`)}
                className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                {election.status === 'RESULTS_PUBLISHED' ? 'View Certified Results' : 'Tally & Publish Results'}
              </button>
            )}

            {election.status !== 'DRAFT' && (
              <button
                onClick={() => navigate(`/participant/elections/${election.id}`)}
                className="px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 shadow-xs flex items-center gap-1.5 transition"
              >
                View on Voter Portal →
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
          {election.description}
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Eligible Voter Roll</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{election.eligible_employee_ids.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Authorized civil servants</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Ballots Recorded</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{election.total_voters_participated || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Participation count</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Approved Candidates</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{candidates.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">On active ballot</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Turnout Rate</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {election.eligible_employee_ids.length > 0
              ? Math.round(((election.total_voters_participated || 0) / election.eligible_employee_ids.length) * 100)
              : 0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Live participation</div>
        </div>
      </div>

      {/* Grid: Positions & Approved Candidates vs Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contested Positions and Candidates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              Contested Positions & Balloted Candidates
            </h3>

            {election.positions.map((pos) => {
              const posCandidates = candidates.filter(c => c.position_id === pos.id);
              return (
                <div key={pos.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{pos.title}</h4>
                      <p className="text-[11px] text-slate-500">{pos.instructions}</p>
                    </div>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                      {pos.number_of_seats} Seat{pos.number_of_seats > 1 ? 's' : ''}
                    </span>
                  </div>

                  {posCandidates.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200">
                      No candidates approved yet for this position.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {posCandidates.map((c) => (
                        <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-slate-900">{c.candidate_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: {c.employee_id}</div>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Approved on Ballot
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Authorized Voter Roll Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                Authorized Voter Roll ({election.eligible_employee_ids.length} Employees)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Only employees with these IDs can pass the verification gatekeeper and submit ballots.
            </p>

            <div className="max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-2">
              {election.eligible_employee_ids.map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Schedule & Ballot Secrecy Rule */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Configured Schedule
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Nomination Window</span>
                <div className="text-slate-500">{new Date(election.nomination_start).toLocaleString()}</div>
                <div className="text-slate-500">to</div>
                <div className="font-medium text-slate-800">{new Date(election.nomination_end).toLocaleString()}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Voting Window</span>
                <div className="text-slate-500">{new Date(election.voting_start).toLocaleString()}</div>
                <div className="text-slate-500">to</div>
                <div className="font-medium text-slate-800">{new Date(election.voting_end).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-md border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              Ballot Secrecy Guarantee
            </div>
            <p className="text-slate-300 leading-relaxed">
              Officials can view aggregate participation and voter counts, but under statutory protocol cannot view individual candidate choices for any employee ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
