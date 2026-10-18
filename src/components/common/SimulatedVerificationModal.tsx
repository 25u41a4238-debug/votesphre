import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  Loader2,
  Scan,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Association } from '../../types/index.ts';

interface SimulatedVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
  electionId?: string;
  eligibleEmployeeIds?: string[];
  userAssociationId?: string;
}

export const SimulatedVerificationModal: React.FC<SimulatedVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
  electionId,
  eligibleEmployeeIds,
  userAssociationId
}) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<'EMPLOYEE_ID' | 'CAMERA_SIM' | 'MANUAL_REVIEW' | 'SUCCESS'>('EMPLOYEE_ID');
  
  // Step 1 state
  const [employeeIdInput, setEmployeeIdInput] = useState(user?.employee_id || '');
  const [validatingId, setValidatingId] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);
  const [validatedEmployee, setValidatedEmployee] = useState<any>(null);

  // Step 2 state (Camera simulation)
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Step 3 state (Manual review fallback)
  const [manualReason, setManualReason] = useState('Camera lighting simulation failed to match employee photo credentials.');
  const [docType, setDocType] = useState('Official Employee ID Card');
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSubmitted, setManualSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleVerifyEmployeeId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeIdInput.trim()) {
      setIdError('Please enter your Employee ID');
      return;
    }

    setValidatingId(true);
    setIdError(null);

    try {
      const res = await api.verifyEmployeeId(employeeIdInput.trim(), userAssociationId || user?.association_id);
      if (!res.eligible) {
        setIdError(res.reason || 'Employee ID not found or not eligible');
        setValidatingId(false);
        return;
      }

      // Check election eligibility list if provided
      if (eligibleEmployeeIds && eligibleEmployeeIds.length > 0) {
        const isEligibleForElection = eligibleEmployeeIds.includes(res.employee!.employee_id);
        if (!isEligibleForElection) {
          setIdError(`Employee ID ${res.employee!.employee_id} is registered in the association, but is not included in the Scrutineers' eligibility roll for this specific election.`);
          setValidatingId(false);
          return;
        }
      }

      setValidatedEmployee(res.employee);
      setStep('CAMERA_SIM');
    } catch (err: any) {
      setIdError(err.message || 'Validation request failed');
    } finally {
      setValidatingId(false);
    }
  };

  const handleSimulateScan = async (simulateSuccess: boolean) => {
    setIsScanning(true);
    setScanMessage('Initiating simulated facial feature matching against government civil service record...');

    setTimeout(async () => {
      try {
        const empId = validatedEmployee?.employee_id || employeeIdInput;
        const res = await api.simulateVerification(simulateSuccess, empId);

        if (res.success && res.status === 'VERIFIED') {
          await refreshUser();
          setStep('SUCCESS');
          onVerificationComplete();
        } else {
          setScanMessage(res.error || 'Simulated verification failed');
          setStep('MANUAL_REVIEW');
        }
      } catch (err: any) {
        setScanMessage(err.message || 'Verification simulation error');
        setStep('MANUAL_REVIEW');
      } finally {
        setIsScanning(false);
      }
    }, 1800);
  };

  const handleSubmitManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingManual(true);
    try {
      const empId = validatedEmployee?.employee_id || employeeIdInput || user?.employee_id || 'UNKNOWN';
      await api.requestManualVerification({
        employee_id: empId,
        reason: manualReason,
        document_type: docType
      });
      await refreshUser();
      setManualSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit manual review');
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all animate-fade-in">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base text-slate-100">Participant Identity Verification</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prototype Transparency Notice */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2.5 text-xs text-blue-900 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Simulated Verification Environment:</strong> This prototype demonstrates election security workflows without collecting or processing actual biometrics or photographs.
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: Employee ID check */}
          {step === 'EMPLOYEE_ID' && (
            <form onSubmit={handleVerifyEmployeeId} className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Step 1 of 2 • Credential Verification
                </span>
                <h4 className="text-lg font-bold text-slate-900">Enter Government Employee ID</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Validate your civil service identity against association records and election eligibility rolls.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Official Employee ID Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value.toUpperCase())}
                    placeholder="e.g. EMP-10023"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase font-mono text-sm"
                    autoFocus
                  />
                </div>
                <div className="mt-1.5 text-xs text-slate-500">
                  Hint for demo: Try <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">EMP-10023</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">EMP-10045</code> (GEA), or <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">EMP-20011</code> (Teachers).
                </div>
              </div>

              {idError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Validation Issue:</span> {idError}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={validatingId}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {validatingId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking Records...
                    </>
                  ) : (
                    'Verify Credential'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Simulated Facial Verification Screen */}
          {step === 'CAMERA_SIM' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
                  Step 2 of 2 • Biometric Liveness Verification (Simulated)
                </span>
                <h4 className="text-lg font-bold text-slate-900">Simulated Liveness & Facial Check</h4>
                <p className="text-sm text-slate-600">
                  Employee <span className="font-semibold text-slate-900">{validatedEmployee?.full_name}</span> ({validatedEmployee?.employee_id}) verified on roll.
                </p>
              </div>

              {/* Simulated Camera Feed Frame */}
              <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-800 h-56 flex flex-col items-center justify-center text-slate-300">
                <div className="absolute inset-0 border-2 border-dashed border-emerald-500/40 rounded-lg m-4 pointer-events-none flex items-center justify-center">
                  <div className="w-36 h-44 border-2 border-emerald-400 rounded-full opacity-60 flex items-center justify-center">
                    <Scan className="w-12 h-12 text-emerald-400 animate-pulse" />
                  </div>
                </div>

                {isScanning ? (
                  <div className="z-10 text-center px-4">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs font-mono text-emerald-300 animate-pulse">
                      Analyzing facial geometry against digital ID archive...
                    </p>
                  </div>
                ) : (
                  <div className="z-10 text-center px-6">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-medium">Position your face in the oval frame</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ensure even lighting. Simulated test harness below.</p>
                  </div>
                )}

                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-slate-400">
                  <span>CAMERA: 1080P SIM_DEVICE</span>
                  <span>CONFIDENCE REQ: 98.4%</span>
                </div>
              </div>

              {/* Two explicit simulation actions */}
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold text-slate-700">Select Test Simulation Outcome:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSimulateScan(true)}
                    disabled={isScanning}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-3 rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simulate Successful Match
                  </button>

                  <button
                    onClick={() => handleSimulateScan(false)}
                    disabled={isScanning}
                    className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs py-2.5 px-3 rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Simulate Failed Match
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('EMPLOYEE_ID')}
                  className="hover:text-slate-800"
                >
                  ← Back to Employee ID
                </button>
                <button
                  type="button"
                  onClick={() => setStep('MANUAL_REVIEW')}
                  className="text-blue-700 hover:underline"
                >
                  Request Alternate Official Review
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Alternate Manual Verification Path */}
          {step === 'MANUAL_REVIEW' && (
            <div>
              {manualSubmitted ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Review Request Submitted</h4>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Your request for manual verification by the Election Official has been recorded. Officials review alternate submissions via the official portal.
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={onClose}
                      className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                    >
                      Return to Portal
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitManualReview} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Simulated Verification Failed or Inconclusive:</strong>
                      <p className="mt-0.5">
                        {scanMessage || 'Facial geometry threshold match unsuccessful. You may submit a request for manual official review.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">Request Alternate Manual Review</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      An authorized election official will examine your employee identity file.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Supporting Verification Document
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Official Employee ID Card">Official Employee ID Card</option>
                      <option value="Government Service Appointment Letter">Government Service Appointment Letter</option>
                      <option value="Association Membership Certificate">Association Membership Certificate</option>
                      <option value="Departmental Payslip Verification">Departmental Payslip Verification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Reason / Notes for Scrutineer
                    </label>
                    <textarea
                      value={manualReason}
                      onChange={(e) => setManualReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep('CAMERA_SIM')}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      ← Retry Simulated Match
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 text-xs text-slate-600 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingManual}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        {submittingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Submit for Review
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Identity Successfully Verified</h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Your employee identity has been confirmed and authorized. You now have full clearance to participate in eligible elections.
              </p>
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                >
                  Proceed to Elections
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
