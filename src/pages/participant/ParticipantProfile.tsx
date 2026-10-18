import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  IdCard, 
  Calendar 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { Association } from '../../types/index.ts';
import { SimulatedVerificationModal } from '../../components/common/SimulatedVerificationModal.tsx';

interface ParticipantProfileProps {
  navigate: (path: string) => void;
}

export const ParticipantProfile: React.FC<ParticipantProfileProps> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAssociations();
        setAssociations(res.associations);
      } catch (err) {}
    }
    load();
  }, []);

  const userAssociation = associations.find(a => a.id === user?.association_id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Participant Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your civil service credentials, association affiliation, and identity verification status
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* User Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xl">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {user?.account_role}
                </span>
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {user?.employee_id ? `ID: ${user.employee_id}` : 'Employee ID Unlinked'}
                </span>
              </div>
            </div>
          </div>

          {!user?.identity_verified && (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              Verify Identity
            </button>
          )}
        </div>

        {/* Verification Status Banner */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          user?.identity_verified
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : user?.verification_status === 'PENDING_REVIEW'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {user?.identity_verified ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : user?.verification_status === 'PENDING_REVIEW' ? (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-0.5">
            <strong className="block font-semibold">
              {user?.identity_verified 
                ? 'Identity Verification Verified' 
                : user?.verification_status === 'PENDING_REVIEW' 
                ? 'Manual Review In Progress' 
                : 'Identity Not Yet Verified'}
            </strong>
            <p>
              {user?.identity_verified
                ? `Authorized via ${user.verification_method === 'SIMULATED_FACIAL' ? 'Simulated Facial Liveness' : 'Official Scrutineer Review'}. Eligible to participate in association voting.`
                : user?.verification_status === 'PENDING_REVIEW'
                ? 'Your identification file is currently queued for official scrutineer examination.'
                : 'You must complete simulated verification before you can vote or contest an election.'}
            </p>
          </div>
        </div>

        {/* Association Affiliation Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Association Affiliation
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Declared Association:</span>
              <strong className="text-slate-900">{userAssociation?.name || 'Government Association'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Association Code:</span>
              <span className="font-mono font-bold text-slate-800">{userAssociation?.code || 'GOV'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member Since:</span>
              <span className="text-slate-700">{new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <SimulatedVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onVerificationComplete={() => {
          setVerifyModalOpen(false);
          refreshUser();
        }}
        userAssociationId={user?.association_id}
      />
    </div>
  );
};
