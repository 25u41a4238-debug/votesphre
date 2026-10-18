import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Vote, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Lock,
  ChevronRight,
  Printer
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Election, ElectionResult } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface OfficialResultsPageProps {
  navigate: (path: string) => void;
  initialElectionId?: string;
}

export const OfficialResultsPage: React.FC<OfficialResultsPageProps> = ({ navigate, initialElectionId }) => {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>(initialElectionId || '');
  const [resultsData, setResultsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadElections = async () => {
    try {
      const res = await api.getElections();
      setElections(res.elections);
      if (initialElectionId) {
        setSelectedElectionId(initialElectionId);
      } else if (res.elections.length > 0) {
        setSelectedElectionId(res.elections[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
  }, [initialElectionId]);

  const fetchResults = async (id: string) => {
    if (!id) return;
    setLoadingResults(true);
    try {
      const res = await api.getResults(id);
      setResultsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchResults(selectedElectionId);
    }
  }, [selectedElectionId]);

  // Real-time listener
  useEffect(() => {
    const unsub = addListener((e) => {
      if (e.type === 'VOTE_CAST' || e.type === 'RESULTS_PUBLISHED' || e.type === 'ELECTION_UPDATED') {
        loadElections();
        if (selectedElectionId) fetchResults(selectedElectionId);
      }
    });
    return unsub;
  }, [addListener, selectedElectionId]);

  const handlePublishResults = async () => {
    setPublishing(true);
    try {
      const res = await api.publishResults(selectedElectionId);
      setSuccessMessage('Election results certified and published to the public portal!');
      await fetchResults(selectedElectionId);
      await loadElections();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setSuccessMessage(err.message || 'Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  const selectedElection = elections.find(e => e.id === selectedElectionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Election Results Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit voter participation, verify sealed tally counts, and publish certified election results
          </p>
        </div>

        {/* Election Selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium shadow-xs"
          >
            {elections.map((elec) => (
              <option key={elec.id} value={elec.id}>
                {elec.title} ({elec.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {loading || loadingResults ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading election scrutineer data...</div>
      ) : !resultsData ? (
        <div className="py-12 text-center text-xs text-slate-400">Select an election to audit results.</div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedElection?.status || 'VOTING_OPEN'} size="md" />
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedElection?.id}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedElection?.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Closes: {new Date(selectedElection?.voting_end || Date.now()).toLocaleString()}
              </p>
            </div>

            {/* Publication Action Button */}
            {selectedElection?.status === 'VOTING_OPEN' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Voting is currently open. Ballots remain sealed until voting closes.</span>
              </div>
            ) : selectedElection?.status === 'RESULTS_PUBLISHED' ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 text-xs font-semibold text-teal-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Results Officially Certified & Published</span>
              </div>
            ) : (
              <button
                onClick={handlePublishResults}
                disabled={publishing}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-60"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Authorize & Publish Official Results
              </button>
            )}
          </div>

          {/* Aggregate Turnout Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Eligible Roll</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {selectedElection?.eligible_employee_ids.length || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Authorized employees</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Voters Participated</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {selectedElection?.total_voters_participated || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Valid ballots cast</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Participation Turnout</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {selectedElection?.eligible_employee_ids.length 
                  ? Math.round(((selectedElection.total_voters_participated || 0) / selectedElection.eligible_employee_ids.length) * 100)
                  : 0}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Overall turnout</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500">Ballot Secrecy Status</div>
              <div className="text-xs font-bold text-emerald-700 mt-2 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                ENCRYPTED & SEALED
              </div>
            </div>
          </div>

          {/* Voting Open: Candidate Tally Sealed Notice */}
          {selectedElection?.status === 'VOTING_OPEN' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Candidate Vote Totals are Sealed
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                In strict adherence to electoral integrity principles, candidate counts are sealed while voting is actively open. This prevents early leakage or influencing participating voters. Once voting closes, the Scrutineers tally preview will unlock.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate(`/official/elections/${selectedElection.id}`)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                >
                  Manage Election Schedule
                </button>
              </div>
            </div>
          ) : resultsData.published ? (
            /* Published Results View */
            <div className="space-y-4">
              {resultsData.results?.map((res: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Official Certified Tally</span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">Final Candidate Standings</h4>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                      {res.total_valid_ballots} Total Votes
                    </span>
                  </div>

                  <div className="space-y-3">
                    {res.candidate_results.map((c: any) => (
                      <div key={c.candidate_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{c.candidate_name}</span>
                            {c.is_winner && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                WINNER / ELECTED
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {c.votes} votes ({c.vote_percentage}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.is_winner ? 'bg-teal-600' : 'bg-slate-400'}`}
                            style={{ width: `${Math.max(c.vote_percentage, 1)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Voting Closed: Preview Tally Before Publication */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Pre-Publication Scrutiny Preview (Voting Closed)
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Voting has closed. Below is the preliminary unsealed calculation. Review the standings before issuing final certification and publishing to participants.
                </p>
              </div>

              {resultsData.preview?.map((res: any, idx: number) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{res.position_title}</h4>
                      <p className="text-xs text-slate-500">Valid Ballots Counted: {res.total_valid_ballots}</p>
                    </div>
                    <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                      Awaiting Publication Authorization
                    </span>
                  </div>

                  <div className="space-y-3">
                    {res.candidate_results.map((c: any) => (
                      <div key={c.candidate_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{c.candidate_name}</span>
                            {c.is_winner && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                Leading / Projected Winner
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-900">
                            {c.votes} votes ({c.vote_percentage}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.is_winner ? 'bg-emerald-600' : 'bg-slate-400'}`}
                            style={{ width: `${Math.max(c.vote_percentage, 1)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handlePublishResults}
                      disabled={publishing}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                    >
                      {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      Certify & Publish This Result
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
