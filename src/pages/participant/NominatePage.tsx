import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Building2
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Election, ElectionPosition } from '../../types/index.ts';

interface NominatePageProps {
  navigate: (path: string) => void;
  initialElectionId?: string;
}

export const NominatePage: React.FC<NominatePageProps> = ({ navigate, initialElectionId }) => {
  const { user } = useAuth();

  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState(initialElectionId || '');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [statement, setStatement] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getElections();
        // Filter to NOMINATION_OPEN elections matching user's association
        const open = res.elections.filter(e => e.status === 'NOMINATION_OPEN');
        setElections(open);

        if (initialElectionId) {
          const match = open.find(e => e.id === initialElectionId);
          if (match && match.positions.length > 0) {
            setSelectedElectionId(match.id);
            setSelectedPositionId(match.positions[0].id);
          }
        } else if (open.length > 0) {
          setSelectedElectionId(open[0].id);
          if (open[0].positions.length > 0) {
            setSelectedPositionId(open[0].positions[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialElectionId]);

  const selectedElection = elections.find(e => e.id === selectedElectionId);

  // When selected election changes, reset position
  useEffect(() => {
    if (selectedElection && selectedElection.positions.length > 0) {
      if (!selectedElection.positions.some(p => p.id === selectedPositionId)) {
        setSelectedPositionId(selectedElection.positions[0].id);
      }
    }
  }, [selectedElectionId, selectedElection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user?.identity_verified) {
      setError('You must complete simulated identity verification before applying as a candidate.');
      return;
    }

    if (!selectedElectionId || !selectedPositionId) {
      setError('Please select an active election and position.');
      return;
    }

    if (!statement.trim() || !qualifications.trim()) {
      setError('Statement of purpose and qualifications are mandatory.');
      return;
    }

    if (!declarationAccepted) {
      setError('You must affirm the candidate statutory declarations.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitApplication(selectedElectionId, {
        position_id: selectedPositionId,
        statement_of_purpose: statement.trim(),
        qualifications: qualifications.trim(),
        required_declarations: true
      });
      setSubmittedApp(res.application);
    } catch (err: any) {
      setError(err.message || 'Failed to submit candidate proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading open nomination windows...</div>;
  }

  if (submittedApp) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Nomination Proposal Submitted</h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your candidate application for <strong className="text-slate-800">{user?.full_name}</strong> has been transmitted to the Board of Scrutineers for formal credential review.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-1.5 max-w-sm mx-auto">
            <div><span className="text-slate-500">Status:</span> <strong className="text-amber-700">PENDING OFFICIAL REVIEW</strong></div>
            <div><span className="text-slate-500">Application ID:</span> <code className="font-mono text-slate-800">{submittedApp.id}</code></div>
            <div><span className="text-slate-500">Submitted at:</span> <span className="text-slate-700">{new Date(submittedApp.submitted_at).toLocaleString()}</span></div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/participant/applications')}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Track Application Status
            </button>
            <button
              onClick={() => navigate('/participant/dashboard')}
              className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/participant/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
            Civil Service Nomination Portal
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Apply to Contest Election
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Submit your candidate proposal during the official nomination window. Scrutineers review all qualifications prior to ballot publishing.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {elections.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
            There are currently no active elections accepting candidate nominations.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Applicant details (read-only from employee record) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Candidate Name:</span>
                <strong className="text-slate-900 text-sm">{user?.full_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Employee ID:</span>
                <span className="font-mono font-bold text-slate-900">{user?.employee_id || 'NOT VERIFIED'}</span>
              </div>
            </div>

            {/* Select Election */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Election *
              </label>
              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {elections.map((elec) => (
                  <option key={elec.id} value={elec.id}>
                    {elec.title} (Closes {new Date(elec.nomination_end).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Position */}
            {selectedElection && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Position Being Contested *
                </label>
                <select
                  value={selectedPositionId}
                  onChange={(e) => setSelectedPositionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {selectedElection.positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title} ({pos.number_of_seats} seat{pos.number_of_seats > 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Statement of Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Candidate Statement of Purpose / Manifesto *
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={4}
                placeholder="State your objectives, priorities, and commitments to fellow association members..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">This statement is displayed on voter ballots upon approval.</p>
            </div>

            {/* Qualifications & Experience */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Qualifications & Civil Service Experience *
              </label>
              <textarea
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                rows={3}
                placeholder="Detail your departmental roles, years of service, committee experience, and academic credentials..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Required Declarations */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-blue-900 leading-relaxed">
                  I solemnly declare that I am an active member in good standing, free of disciplinary disqualification, and pledge to adhere to the association election charter and electoral bylaws.
                </span>
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/participant/dashboard')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !declarationAccepted}
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  'Submit Candidate Application'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
