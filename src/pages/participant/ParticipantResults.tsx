import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  Users, 
  Vote, 
  ShieldCheck, 
  AlertCircle, 
  Search,
  ExternalLink,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Election, Association, ElectionResult } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface ParticipantResultsProps {
  navigate: (path: string) => void;
  initialElectionId?: string;
}

export const ParticipantResults: React.FC<ParticipantResultsProps> = ({ navigate, initialElectionId }) => {
  const { addListener } = useRealtime();

  const [elections, setElections] = useState<Election[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>(initialElectionId || '');
  const [resultsData, setResultsData] = useState<{
    published: boolean;
    results?: ElectionResult[];
    message?: string;
    election?: Election;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingResult, setLoadingResult] = useState(false);

  const loadElections = async () => {
    try {
      const [elecRes, assocRes] = await Promise.all([
        api.getElections(),
        api.getAssociations()
      ]);
      setElections(elecRes.elections);
      setAssociations(assocRes.associations);

      const publishedList = elecRes.elections.filter(e => e.status === 'RESULTS_PUBLISHED');

      if (initialElectionId) {
        setSelectedElectionId(initialElectionId);
      } else if (publishedList.length > 0) {
        setSelectedElectionId(publishedList[0].id);
      } else {
        setSelectedElectionId('');
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

  // Load results for selected election
  const fetchResult = async (id: string) => {
    if (!id) {
      setResultsData(null);
      return;
    }
    setLoadingResult(true);
    try {
      const res = await api.getResults(id);
      setResultsData(res);
    } catch (err) {
      console.error(err);
      setResultsData(null);
    } finally {
      setLoadingResult(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchResult(selectedElectionId);
    } else {
      setResultsData(null);
    }
  }, [selectedElectionId]);

  // Real-time listener: when results published, refresh immediately
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (event.type === 'RESULTS_PUBLISHED') {
        loadElections();
        if (event.payload?.election_id === selectedElectionId) {
          fetchResult(selectedElectionId);
        } else if (!selectedElectionId && event.payload?.election_id) {
          setSelectedElectionId(event.payload.election_id);
        }
      }
    });
    return unsubscribe;
  }, [addListener, selectedElectionId]);

  const publishedElections = elections.filter(e => e.status === 'RESULTS_PUBLISHED');
  const selectedElection = elections.find(e => e.id === selectedElectionId);
  const assocName = associations.find(a => selectedElection?.association_ids.includes(a.id))?.name || 'Association';

  // Check if results are legitimately published for this election
  const isResultsPublic = resultsData?.published && selectedElection?.status === 'RESULTS_PUBLISHED';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Official Election Results</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              Public Certified Tallies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Certified results and declaration records made public by the Election Officer
          </p>
        </div>

        {/* Election Selector Dropdown - Only lists elections whose results have been made public */}
        {publishedElections.length > 0 && (
          <div className="w-full sm:w-80">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Select Public Election Event:
            </label>
            <select
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium shadow-xs"
            >
              {publishedElections.map((elec) => (
                <option key={elec.id} value={elec.id}>
                  {elec.title} (Certified)
                </option>
              ))}
              {selectedElection && selectedElection.status !== 'RESULTS_PUBLISHED' && (
                <option value={selectedElection.id} disabled>
                  {selectedElection.title} (Results Not Public)
                </option>
              )}
            </select>
          </div>
        )}
      </div>

      {loading || loadingResult ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading certified results record...</div>
      ) : publishedElections.length === 0 && (!selectedElection || selectedElection.status !== 'RESULTS_PUBLISHED') ? (
        /* No elections have public results yet */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            No Election Results Public Yet
          </h3>

          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            In accordance with statutory election regulations, election results are never displayed in the voter portal while voting or nominations are active. Results will appear here only when they are officially certified and made public in the Election Officer portal.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/participant/elections')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Browse Active Elections
            </button>
            <button
              onClick={() => navigate('/participant/dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : !isResultsPublic ? (
        /* Results Not Yet Made Public Screen */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            Results Are Not Public For This Election Event
          </h3>

          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Ballots for <strong className="text-slate-900">{selectedElection?.title || 'this election event'}</strong> are securely sealed in the electronic vault. Results are strictly protected and will be shown in the voter portal only when officially certified and made public in the Election Officer portal.
          </p>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Current Election Stage:</span> 
              <StatusBadge status={selectedElection?.status || 'PENDING'} size="sm" />
            </div>
            <div className="text-[11px] text-amber-800">
              {selectedElection?.status === 'VOTING_OPEN' && 'Ballots are currently being cast and remain encrypted in the vault.'}
              {selectedElection?.status === 'NOMINATION_OPEN' && 'Candidate nominations are currently open.'}
              {selectedElection?.status === 'VOTING_CLOSED' && 'Voting has concluded. Waiting for the Election Officer to audit and publish certified results.'}
              {(!selectedElection || selectedElection?.status === 'DRAFT') && 'This election is not yet in results stage.'}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (publishedElections.length > 0) {
                  setSelectedElectionId(publishedElections[0].id);
                } else {
                  navigate('/participant/elections');
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs"
            >
              {publishedElections.length > 0 ? 'View Certified Public Elections' : 'Browse Active Elections'}
            </button>
            <button
              onClick={() => navigate('/participant/dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* CERTIFIED RESULTS DISPLAY - Shown ONLY when results are made public in Election Officer portal */
        <div className="space-y-6">
          {/* Certificate Header Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700/60 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                OFFICIAL CERTIFIED RESULT DECLARATION
              </div>
              <span className="text-xs text-slate-400">
                Published: {new Date(resultsData?.results?.[0]?.published_at || Date.now()).toLocaleString()}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {selectedElection?.title}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Association: <strong className="text-white">{assocName}</strong> • Certified by Returning Officer:{' '}
                <strong className="text-teal-300">{resultsData?.results?.[0]?.published_by_name || 'Chief Scrutineer'}</strong>
              </p>
            </div>

            {/* Quick aggregate turnout stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="text-[11px] text-slate-400">Eligible Voter Roll</div>
                <div className="text-xl font-bold text-white">{resultsData?.results?.[0]?.total_eligible || 0}</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="text-[11px] text-slate-400">Valid Ballots Cast</div>
                <div className="text-xl font-bold text-teal-300">{resultsData?.results?.[0]?.total_valid_ballots || 0}</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="text-[11px] text-slate-400">Voter Turnout</div>
                <div className="text-xl font-bold text-blue-300">{resultsData?.results?.[0]?.turnout_percentage || 0}%</div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="text-[11px] text-slate-400">Result Status</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">FINAL CERTIFIED</div>
              </div>
            </div>
          </div>

          {/* Results per position */}
          <div className="space-y-6">
            {resultsData?.results?.map((res, idx) => {
              const pos = selectedElection?.positions.find(p => p.id === res.position_id);
              return (
                <div key={res.id || idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {pos?.title || 'Contested Representative Seat'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Total Valid Votes: <strong>{res.total_valid_ballots}</strong>
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                      Tally Finalized
                    </span>
                  </div>

                  {/* Candidate Vote Breakdown Bars */}
                  <div className="space-y-4 pt-1">
                    {res.candidate_results.map((c) => (
                      <div key={c.candidate_id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{c.candidate_name}</span>
                            {c.is_winner && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3 text-amber-600" />
                                ELECTED
                              </span>
                            )}
                          </div>
                          <div className="text-right font-mono">
                            <strong className="text-slate-900">{c.votes} votes</strong>{' '}
                            <span className="text-slate-500">({c.vote_percentage}%)</span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              c.is_winner ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.max(c.vote_percentage, 1)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
