import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  User,
  Phone,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import { Association } from '../types/index.ts';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loadingAssocs, setLoadingAssocs] = useState(true);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [accountRole, setAccountRole] = useState<'PARTICIPANT' | 'OFFICIAL'>('PARTICIPANT');
  const [selectedAssociationId, setSelectedAssociationId] = useState('');
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [associationSearch, setAssociationSearch] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOfficialPending, setCreatedOfficialPending] = useState(false);

  useEffect(() => {
    async function loadAssocs() {
      try {
        const res = await api.getAssociations();
        setAssociations(res.associations.filter(a => a.active));
        if (res.associations.length > 0) {
          setSelectedAssociationId(res.associations[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAssocs(false);
      }
    }
    loadAssocs();
  }, []);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid work or government email address is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    setStep(2);
  };

  const handleStep2Next = () => {
    setError(null);
    setStep(3);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAssociationId) {
      setError('Please select an association from the official directory');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        contact_number: contactNumber.trim() || undefined,
        password,
        account_role: accountRole,
        association_id: selectedAssociationId,
        employee_id: employeeIdInput.trim() || undefined
      });

      if (accountRole === 'OFFICIAL') {
        setCreatedOfficialPending(true);
        setStep(4);
      } else {
        // Participant goes directly to dashboard
        navigate('/participant/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssociations = associations.filter(a => 
    a.name.toLowerCase().includes(associationSearch.toLowerCase()) ||
    a.code.toLowerCase().includes(associationSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            Civil Service Portal Registration
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Portal Account
          </h2>
          <p className="text-xs text-slate-600">
            Step {step} of 4 • {
              step === 1 ? 'Personal Information' :
              step === 2 ? 'Account Type' :
              step === 3 ? 'Association Affiliation' : 'Confirmation'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex items-center justify-between px-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step === s 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                  : step > s 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 sm:w-20 h-1 mx-1 rounded ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work / Government Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gov-department.gov"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Already have an account? Log in
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  Continue to Step 2
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Account Type */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">How would you like to use the platform?</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select your functional role. Election Official accounts require administrator verification before access is granted.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Participant Option Card */}
                <div
                  onClick={() => setAccountRole('PARTICIPANT')}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition flex items-start gap-3.5 ${
                    accountRole === 'PARTICIPANT'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${accountRole === 'PARTICIPANT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Participant</span>
                      {accountRole === 'PARTICIPANT' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Participate in eligible association elections and apply as a candidate. Cast confidential ballots for approved candidates.
                    </p>
                  </div>
                </div>

                {/* Election Official Option Card */}
                <div
                  onClick={() => setAccountRole('OFFICIAL')}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition flex items-start gap-3.5 ${
                    accountRole === 'OFFICIAL'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg shrink-0 ${accountRole === 'OFFICIAL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Election Official</span>
                      {accountRole === 'OFFICIAL' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Organize elections and manage candidate applications for an authorized association. Monitor voter turnout and certify results.
                    </p>
                    <div className="mt-2 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block border border-amber-200">
                      Requires Platform Administrator Approval
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStep2Next}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  Continue to Step 3
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Association Selection */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Which association do you belong to?</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {accountRole === 'PARTICIPANT'
                    ? 'Select your registered civil service association. This declared affiliation determines election eligibility.'
                    : 'Select the association you are requesting authorization to administer.'}
                </p>
              </div>

              {/* Search input for dropdown */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter official associations directory..."
                  value={associationSearch}
                  onChange={(e) => setAssociationSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selectable Association Cards */}
              <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {filteredAssociations.map((assoc) => {
                  const isSelected = selectedAssociationId === assoc.id;
                  return (
                    <div
                      key={assoc.id}
                      onClick={() => setSelectedAssociationId(assoc.id)}
                      className={`cursor-pointer p-3 rounded-lg border transition text-left flex items-start justify-between gap-2 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 shadow-xs' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{assoc.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                            {assoc.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{assoc.description}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>

              {accountRole === 'PARTICIPANT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID (Optional at registration)
                  </label>
                  <input
                    type="text"
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value.toUpperCase())}
                    placeholder="e.g. EMP-10023"
                    className="w-full px-3 py-2 text-xs uppercase font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    You can also verify this inside the portal using simulated facial identity verification.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Confirmation Screen for Election Officials */}
          {step === 4 && createdOfficialPending && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Official Account Request Pending</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your request to register as an Election Official for{' '}
                <strong className="text-slate-800">
                  {associations.find(a => a.id === selectedAssociationId)?.name}
                </strong>{' '}
                has been recorded in the platform authorization queue.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 text-left">
                <strong>Important Notice:</strong> Administrative rights, election creation wizards, and candidate scrutiny functions are unlocked only after authorization by the Platform Administrator.
              </div>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate('/pending-approval')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                >
                  View Approval Status
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Return to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
