import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Vote, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  User, 
  FileCheck2, 
  Printer, 
  Check 
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Election, Candidate, Association } from '../../types/index.ts';
import { SimulatedVerificationModal } from '../../components/common/SimulatedVerificationModal.tsx';

interface VotingPageProps {
  electionId: string;
  navigate: (path: string) => void;
}

export const VotingPage: React.FC<VotingPageProps> = ({ electionId, navigate }) => {
  const { user } = useAuth();

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [participationRecords, setParticipationRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Voting flow state
  // Step 1: SELECT
  // Step 2: REVIEW
  // Step 3: CONFIRMED
  const [votingStep, setVotingStep] = useState<'SELECT' | 'REVIEW' | 'CONFIRMED'>('SELECT');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [submissionTime, setSubmissionTime] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
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

        if (elecRes.election.positions.length > 0) {
          setSelectedPositionId(elecRes.election.positions[0].id);
        }
      } catch (err: any) {
        setVoteError(err.message || 'Failed to load ballot');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [electionId, user]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Preparing official ballot...</div>;
  }

  if (!election) {
    return (
      <div className="py-12 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-800">Ballot not found</h3>
        <button onClick={() => navigate('/participant/elections')} className="text-xs text-blue-600 underline">
          Return to elections
        </button>
      </div>
    );
  }

  const currentPosition = election.positions.find(p => p.id === selectedPositionId) || election.positions[0];
  const positionCandidates = candidates.filter(c => c.position_id === currentPosition?.id);
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  const handleProceedToReview = () => {
    if (!selectedCandidateId) {
      setVoteError('Please select a candidate before proceeding to review.');
      return;
    }
    setVoteError(null);
    setVotingStep('REVIEW');
  };

  const handleCastVote = async () => {
    if (!selectedCandidateId || !currentPosition) return;
    setSubmittingVote(true);
    setVoteError(null);

    try {
      const res = await api.castVote(election.id, {
        position_id: currentPosition.id,
        candidate_id: selectedCandidateId
      });

      if (res.success) {
        setConfirmationCode(res.confirmationReference);
        setSubmissionTime(res.submitted_at);
        setVotingStep('CONFIRMED');
        setHasVoted(true);
      } else {
        setVoteError('Submission rejected by election engine.');
      }
    } catch (err: any) {
      setVoteError(err.message || 'Ballot submission failed.');
    } finally {
      setSubmittingVote(false);
    }
  };

  // If already voted, show confirmation view
  if (hasVoted && votingStep !== 'CONFIRMED') {
    const existingRef = participationRecords[0]?.confirmation_reference || 'GOV-VOTE-RECORDED';
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/participant/elections')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Elections
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Your Ballot Has Been Cast</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            You have already cast an anonymous ballot for <strong className="text-slate-800">{election.title}</strong>. Under statutory rules, exactly one vote is permitted per eligible employee.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Voter Confirmation Reference
            </div>
            <div className="font-mono text-base font-bold text-blue-700 select-all">
              {existingRef}
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              In accordance with ballot secrecy laws, your candidate choice is sealed in an anonymized vault and cannot be revealed or modified.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/participant/dashboard')}
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs"
            >
              Return to Dashboard
            </button>
            {election?.status === 'RESULTS_PUBLISHED' ? (
              <button
                onClick={() => navigate(`/participant/results?electionId=${election.id}`)}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 shadow-xs"
              >
                View Official Results
              </button>
            ) : (
              <button
                onClick={() => navigate('/participant/elections')}
                className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                View All Elections
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Identity verification gatekeeper
  if (!user?.identity_verified) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate(`/participant/elections/${election.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Election Details
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Identity Verification Required</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Prior to casting a statutory association ballot, all voters must complete simulated facial and employee credential verification.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              Launch Simulated Verification
            </button>
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
  }

  // Not on election eligibility roll
  if (!isEligible) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/participant/elections')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Elections
        </button>

        <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Ineligible for This Election</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Employee <span className="font-mono font-bold text-slate-900">{user?.employee_id}</span> is not registered on the certified voter roll configured by the Scrutineers for this election.
          </p>

          <div className="pt-2">
            <button
              onClick={() => navigate('/participant/elections')}
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Browse Other Elections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => {
          if (votingStep === 'REVIEW') setVotingStep('SELECT');
          else navigate(`/participant/elections/${election.id}`);
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        {votingStep === 'REVIEW' ? 'Back to Candidate Selection' : 'Back to Election Overview'}
      </button>

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
          <Vote className="w-4 h-4 text-emerald-400" />
          Official Electronic Ballot
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {election.title}
        </h1>
        <p className="text-xs text-slate-300">
          Position: <strong className="text-white">{currentPosition.title}</strong> • Single Seat ({currentPosition.number_of_seats} candidate selection permitted)
        </p>
      </div>

      {voteError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>{voteError}</div>
        </div>
      )}

      {/* STEP 1: CANDIDATE SELECTION */}
      {votingStep === 'SELECT' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Your Candidate</h3>
                <p className="text-xs text-slate-500">
                  Carefully review the statements and experience of each approved contender. Click a card to mark your selection.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                Step 1 of 2: Vote Choice
              </span>
            </div>

            {positionCandidates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No approved candidates found on this ballot.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positionCandidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidateId(cand.id)}
                      className={`cursor-pointer rounded-2xl border-2 p-5 transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {cand.candidate_name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-slate-900">{cand.candidate_name}</h4>
                              <span className="text-[11px] text-slate-400 font-mono">Employee ID: {cand.employee_id}</span>
                            </div>
                          </div>

                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                          <div>
                            <span className="font-bold text-slate-900">Statement of Purpose:</span>
                            <p className="text-slate-600 mt-0.5 text-xs line-clamp-3">{cand.statement_of_purpose}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">Qualifications:</span>
                            <p className="text-slate-600 mt-0.5 text-xs line-clamp-2">{cand.qualifications}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                          {isSelected ? '✓ Marked for Vote' : 'Click to Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Ballot is anonymous and untraceable to your employee ID.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate(`/participant/elections/${election.id}`)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToReview}
                disabled={!selectedCandidateId}
                className="px-6 py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50"
              >
                Review Ballot Selection →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BALLOT REVIEW SCREEN */}
      {votingStep === 'REVIEW' && selectedCandidate && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                  Step 2 of 2: Statutory Ballot Review
                </span>
                <h3 className="text-xl font-bold text-slate-900">Confirm Your Vote Choice</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Please verify your selection carefully. Once confirmed, this ballot is permanently cast and cannot be altered.
                </p>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>

            {/* Selected Choice Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Marked Candidate on Ballot
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl">
                  {selectedCandidate.candidate_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedCandidate.candidate_name}</h4>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedCandidate.employee_id} • Contesting {currentPosition.title}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900">Candidate Statement:</span>
                  <p className="mt-0.5 text-slate-600">{selectedCandidate.statement_of_purpose}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-900">Qualifications:</span>
                  <p className="mt-0.5 text-slate-600">{selectedCandidate.qualifications}</p>
                </div>
              </div>
            </div>

            {/* Statutory Ballot Secrecy Declaration */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                Civil Service Ballot Secrecy Protection
              </div>
              <p className="leading-relaxed text-[11px] text-emerald-900">
                Your ballot choice is recorded anonymously into the sealed electronic ballot vault. Your participation is registered to satisfy the one-vote-per-employee rule, but no link between your personal identity and your candidate selection is maintained in the system.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVotingStep('SELECT')}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                ← Go Back & Change Selection
              </button>

              <button
                type="button"
                onClick={handleCastVote}
                disabled={submittingVote}
                className="w-full sm:w-auto px-8 py-3 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submittingVote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sealing Ballot in Vault...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Submit Official Vote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIRMATION RECEIPT */}
      {votingStep === 'CONFIRMED' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Ballot Successfully Cast & Sealed
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your confidential vote for <strong className="text-slate-900">{election.title}</strong> has been encrypted and deposited into the official ballot box.
            </p>
          </div>

          {/* Official Sealed Receipt (Strictly DOES NOT display candidate choice!) */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Official Voter Confirmation Receipt
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Sealed & Validated
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Confirmation Reference:</span>
                <span className="font-mono text-base font-bold text-slate-900 select-all">
                  {confirmationCode}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">Election:</span>
                  <span className="font-medium text-slate-800 line-clamp-1">{election.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Timestamp:</span>
                  <span className="font-medium text-slate-800">{new Date(submissionTime || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 leading-relaxed">
              <strong>Ballot Secrecy Note:</strong> To safeguard the integrity of secret balloting, this confirmation receipt verifies participation only. It deliberately omits your candidate selection.
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Confirmation
            </button>
            <button
              onClick={() => navigate('/participant/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
            >
              Return to Portal Dashboard
            </button>
            {election?.status === 'RESULTS_PUBLISHED' ? (
              <button
                onClick={() => navigate(`/participant/results?electionId=${election.id}`)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold shadow-xs"
              >
                View Official Results
              </button>
            ) : (
              <button
                onClick={() => navigate('/participant/elections')}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                Browse Other Elections
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
