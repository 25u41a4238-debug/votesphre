import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Mail, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { Association } from '../../types/index.ts';

interface OfficialProfileProps {
  navigate: (path: string) => void;
}

export const OfficialProfile: React.FC<OfficialProfileProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [associations, setAssociations] = useState<Association[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAssociations();
        setAssociations(res.associations);
      } catch (err) {}
    }
    load();
  }, []);

  const authorizedAssocs = associations.filter(a => 
    (user?.authorized_association_ids || [user?.association_id]).includes(a.id)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Election Official Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Scrutineer credentials, authorized associations, and statutory appointment details
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xl">
            {user?.full_name?.charAt(0) || 'O'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Authorized Election Official
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Status: ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Authorized Association Jurisdictions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Authorized Association Jurisdictions
          </h3>
          <p className="text-xs text-slate-500">
            You are formally authorized to organize elections, manage eligible employee rosters, and scrutinize candidate nominations for the following bodies:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {authorizedAssocs.map((assoc) => (
              <div key={assoc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                <div className="font-bold text-slate-900">{assoc.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">Code: {assoc.code}</div>
                <div className="text-[10px] text-emerald-700 font-semibold pt-1">✓ Statutory Scrutiny Clearance</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Audit Charter */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Official Scrutineer Charter & Audit Protocol
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            As an Election Official, every decision to approve or reject a candidate, publish an election, close voting, or publish results is permanently logged in the immutable audit repository with your actor ID and timestamp.
          </p>
        </div>
      </div>
    </div>
  );
};
