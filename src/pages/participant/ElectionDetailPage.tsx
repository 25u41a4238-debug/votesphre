import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Vote, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Award, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  User, 
  Check
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Election, Candidate, Association } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { SimulatedVerificationModal } from '../../components/common/SimulatedVerificationModal.tsx';

interface ElectionDetailPageProps {
  electionId: string;
  navigate: (path: string) => void;
}

export const ElectionDetailPage: React.FC<ElectionDetailPageProps> = ({ electionId, navigate }) => {
  const { user } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [participationRecords, setParticipationRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [elecRes, assocRes] = await Promise.all([
          api.getElection(electionId),
          api.getAssociations()
        ]);
        setElection(elecRes.election);
        setCandidates(elecRes.candidates);
        setIsEligible(elecRes.isEligible);
        setHasVoted(elecRes.hasVoted);
        setParticipationRecords(elecRes.participationRecords);
        setAssociations(assocRes.associations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [electionId, user]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading election record...</div>;
  }

  if (!election) {
    return (
      <div className="py-12 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">Election record not found</h3>
        <button onClick={() => navigate('/participant/elections')} className="text-xs text-blue-600 underline">
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/participant/elections')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Elections
      </button>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={election.status} size="lg" />
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {assocNames || 'Association Election'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {election.title}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed">
          {election.description}
        </p>

        {/* Voter Eligibility Notice Card */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          hasVoted
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : isEligible && user?.identity_verified
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-3">
            {hasVoted ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            ) : isEligible && user?.identity_verified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold">
                {hasVoted 
                  ? 'Ballot Successfully Recorded' 
                  : isEligible && user?.identity_verified 
                  ? 'Eligible Voter Confirmed' 
                  : !user?.identity_verified 
                  ? 'Identity Verification Pending' 
                  : 'Eligibility Check Required'}
              </div>
              <div className="text-xs mt-0.5">
                {hasVoted 
                  ? `Your anonymous vote has been confirmed and sealed. Receipt Ref: ${participationRecords[0]?.confirmation_reference || 'CONFIRMED'}`
                  : isEligible && user?.identity_verified
                  ? `Employee ${user?.employee_id} is on the official voter roll for this election.`
                  : !user?.identity_verified
                  ? 'Please complete simulated identity verification to unlock ballot actions.'
                  : `Employee ${user?.employee_id || 'ID'} is not on the Scrutineers' eligibility roll for this election.`}
              </div>
            </div>
          </div>

          {!user?.identity_verified ? (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
            >
              Verify Identity
            </button>
          ) : election.status === 'VOTING_OPEN' && isEligible && !hasVoted ? (
            <button
              onClick={() => navigate(`/participant/vote/${election.id}`)}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md flex items-center gap-1.5"
            >
              <Vote className="w-4 h-4" />
              Cast Ballot Now
            </button>
          ) : election.status === 'NOMINATION_OPEN' && isEligible ? (
            <button
              onClick={() => navigate(`/participant/nominations?electionId=${election.id}`)}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
            >
              Apply as Candidate
            </button>
          ) : election.status === 'RESULTS_PUBLISHED' ? (
            <button
              onClick={() => navigate(`/participant/results?electionId=${election.id}`)}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              View Official Results
            </button>
          ) : election.status === 'VOTING_CLOSED' ? (
            <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 border border-amber-200 px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Voting Ended · Results Awaiting Publication
            </span>
          ) : null}
        </div>
      </div>

      {/* Grid: Schedule & Instructions vs Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Positions and Approved Candidates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              Contested Positions & Approved Candidates ({candidates.length})
            </h3>

            {election.positions.map((pos) => {
              const positionCandidates = candidates.filter(c => c.position_id === pos.id);
              return (
                <div key={pos.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{pos.title}</h4>
                      <p className="text-xs text-slate-500">{pos.instructions || 'Single seat representative'}</p>
                    </div>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                      {pos.number_of_seats} Seat{pos.number_of_seats > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Candidate List */}
                  {positionCandidates.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200">
                      No approved candidates yet. Nominations are {election.status === 'NOMINATION_OPEN' ? 'open for application' : 'closed'}.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {positionCandidates.map((cand) => (
                        <div key={cand.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                                {cand.candidate_name.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-bold text-sm text-slate-900">{cand.candidate_name}</h5>
                                <span className="text-[11px] text-slate-400 font-mono">ID: {cand.employee_id}</span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3" />
                              Approved Candidate
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 space-y-1">
                            <div>
                              <strong className="text-slate-900">Statement of Purpose:</strong>
                              <p className="text-slate-600 mt-0.5">{cand.statement_of_purpose}</p>
                            </div>
                            <div className="pt-1">
                              <strong className="text-slate-900">Qualifications & Experience:</strong>
                              <p className="text-slate-600 mt-0.5">{cand.qualifications}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Voting Instructions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              Official Scrutineer Voting Instructions
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {election.instructions || 'Ensure you review the statements of all approved candidates. Ballots are submitted in a single atomic transaction. You will be provided with an immutable confirmation code upon casting your ballot.'}
            </p>
          </div>
        </div>

        {/* Right Column: Schedule & Rules */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Election Schedule
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Nomination Period</span>
                <div className="text-slate-500">
                  {new Date(election.nomination_start).toLocaleString()}
                </div>
                <div className="text-slate-500">to</div>
                <div className="font-medium text-slate-800">
                  {new Date(election.nomination_end).toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-0.5">Voting Period</span>
                <div className="text-slate-500">
                  {new Date(election.voting_start).toLocaleString()}
                </div>
                <div className="text-slate-500">to</div>
                <div className="font-medium text-slate-800">
                  {new Date(election.voting_end).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              Statutory Eligibility Requirements
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {election.eligibility_requirements || 'Civil service members in good standing under the designated association.'}
            </p>
          </div>
        </div>
      </div>

      <SimulatedVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onVerificationComplete={() => {
          setVerifyModalOpen(false);
          window.location.reload();
        }}
        electionId={election.id}
        eligibleEmployeeIds={election.eligible_employee_ids}
        userAssociationId={user?.association_id}
      />
    </div>
  );
};
