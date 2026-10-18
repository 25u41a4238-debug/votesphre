import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  FileText, 
  Calendar,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { api } from '../../lib/api.ts';
import { Election, Association, CandidateApplication } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { SimulatedVerificationModal } from '../../components/common/SimulatedVerificationModal.tsx';

interface ParticipantDashboardProps {
  navigate: (path: string) => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
  const { addListener } = useRealtime();

  const [elections, setElections] = useState<Election[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [elecRes, assocRes, appRes] = await Promise.all([
        api.getElections(),
        api.getAssociations(),
        api.getParticipantApplications()
      ]);
      setElections(elecRes.elections);
      setAssociations(assocRes.associations);
      setApplications(appRes.applications);
    } catch (err) {
      console.error('Failed to load participant data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (
        event.type === 'ELECTION_PUBLISHED' ||
        event.type === 'ELECTION_CREATED' ||
        event.type === 'ELECTION_UPDATED' ||
        event.type === 'CANDIDATE_APPROVED' ||
        event.type === 'VOTE_CAST' ||
        event.type === 'RESULTS_PUBLISHED' ||
        event.type === 'VERIFICATION_UPDATED' ||
        event.type === 'DEMO_RESET'
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [addListener]);

  const userAssociation = associations.find(a => a.id === user?.association_id);
  const votingOpenElections = elections.filter(e => e.status === 'VOTING_OPEN');
  const nominationElections = elections.filter(e => e.status === 'NOMINATION_OPEN');
  const publishedResultsElections = elections.filter(e => e.status === 'RESULTS_PUBLISHED');

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {userAssociation?.name || 'Government Association'}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Participant Portal • Employee ID:{' '}
            <span className="font-mono font-bold text-slate-800">
              {user?.employee_id || 'Not Linked (Click Verify Below)'}
            </span>
          </p>
        </div>

        {/* Identity Verification Status Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 min-w-[280px]">
          <div className="flex items-center gap-2.5">
            {user?.identity_verified ? (
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : user?.verification_status === 'PENDING_REVIEW' ? (
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-900">
                {user?.identity_verified ? 'Identity Verified' : user?.verification_status === 'PENDING_REVIEW' ? 'Review Pending' : 'Unverified Participant'}
              </div>
              <div className="text-[11px] text-slate-500">
                {user?.identity_verified ? 'Eligible for association ballots' : 'Simulated verification required to vote'}
              </div>
            </div>
          </div>

          {!user?.identity_verified && user?.verification_status !== 'PENDING_REVIEW' && (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs shrink-0"
            >
              Verify Now
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Eligible Elections</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{elections.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Under {userAssociation?.code || 'Association'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Voting Open Now</span>
            <Vote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{votingOpenElections.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active ballots available</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Nominations Open</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{nominationElections.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Accepting candidate proposals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">My Applications</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{applications.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Contested candidacy records</div>
        </div>
      </div>

      {/* Voting Open Spotlight Card */}
      {votingOpenElections.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                BALLOT OPEN FOR VOTING
              </span>
              <h3 className="text-lg font-bold text-white">
                {votingOpenElections[0].title}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Voting ends on {new Date(votingOpenElections[0].voting_end).toLocaleString()}. Ballots are encrypted and cast anonymously.
              </p>
            </div>
            <button
              onClick={() => navigate(`/participant/vote/${votingOpenElections[0].id}`)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shrink-0 flex items-center gap-1.5"
            >
              Cast Your Vote
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Available Association Elections Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Association Elections</h3>
            <p className="text-xs text-slate-500">
              Elections organized for {userAssociation?.name || 'your association'}
            </p>
          </div>
          <button
            onClick={() => navigate('/participant/elections')}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            Browse all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {elections.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No published elections currently available for your association.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elections.map((elec) => (
              <div 
                key={elec.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition flex flex-col justify-between bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={elec.status} size="sm" />
                    <span className="text-[11px] text-slate-400 font-mono">
                      {elec.positions.length} position{elec.positions.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                    {elec.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {elec.description}
                  </p>

                  <div className="text-[11px] text-slate-500 space-y-1 mb-4 bg-white p-2.5 rounded-lg border border-slate-200/60">
                    <div className="flex justify-between">
                      <span>Nomination:</span>
                      <span className="font-medium text-slate-700">{new Date(elec.nomination_end).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Voting Closes:</span>
                      <span className="font-medium text-slate-700">{new Date(elec.voting_end).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/participant/elections/${elec.id}`)}
                    className="text-xs font-semibold text-slate-700 hover:text-blue-700"
                  >
                    Details & Rules
                  </button>

                  {elec.status === 'VOTING_OPEN' ? (
                    <button
                      onClick={() => navigate(`/participant/vote/${elec.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Vote Now
                    </button>
                  ) : elec.status === 'NOMINATION_OPEN' ? (
                    <button
                      onClick={() => navigate(`/participant/nominations?electionId=${elec.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Apply Candidate
                    </button>
                  ) : elec.status === 'RESULTS_PUBLISHED' ? (
                    <button
                      onClick={() => navigate(`/participant/results?electionId=${elec.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      View Results
                    </button>
                  ) : elec.status === 'VOTING_CLOSED' ? (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Results Pending
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Scheduled</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulated Verification Modal */}
      <SimulatedVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onVerificationComplete={() => {
          setVerifyModalOpen(false);
          refreshUser();
          loadData();
        }}
        userAssociationId={user?.association_id}
      />
    </div>
  );
};
