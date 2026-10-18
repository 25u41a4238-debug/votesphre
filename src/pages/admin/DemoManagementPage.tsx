import React, { useState, useEffect } from 'react';
import { 
  Users, 
  RotateCcw, 
  Lock, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  Key
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Employee, Association } from '../../types/index.ts';

interface DemoManagementPageProps {
  navigate: (path: string) => void;
}

export const DemoManagementPage: React.FC<DemoManagementPageProps> = ({ navigate }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [empRes, assocRes] = await Promise.all([
        api.getEmployees(),
        api.getAssociations()
      ]);
      setEmployees(empRes.employees);
      setAssociations(assocRes.associations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResetDemo = async () => {
    if (!confirm('This will wipe all active election changes, test votes, and newly created accounts, restoring the database to the initial prototype state. Proceed?')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoData();
      setResetMessage('Prototype database successfully reset to clean seed state.');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prototype Demo Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review fictional civil servants, credentials, and manage prototype demonstration state
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          Reset Demo Data to Initial State
        </button>
      </div>

      {resetMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {resetMessage}
        </div>
      )}

      {/* Demo Credentials Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-600" />
          Pre-Seeded Demo Credentials
        </h3>
        <p className="text-xs text-slate-600">
          These test accounts are configured for demonstration. You can log in using their credentials or use the 1-click switcher in the top banner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
            <span className="font-bold text-blue-900 block">Jane Doe (Participant)</span>
            <div className="text-slate-600">Email: <code className="font-mono text-slate-900">jane.doe@gov-portal.demo</code></div>
            <div className="text-slate-600">Pass: <code className="font-mono text-slate-900">Demo123!</code></div>
            <div className="text-[11px] text-blue-700 mt-1">GEA • EMP-10023 • Verified</div>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1">
            <span className="font-bold text-indigo-900 block">Officer Davis (Election Official)</span>
            <div className="text-slate-600">Email: <code className="font-mono text-slate-900">official@gov-portal.demo</code></div>
            <div className="text-slate-600">Pass: <code className="font-mono text-slate-900">Official123!</code></div>
            <div className="text-[11px] text-indigo-700 mt-1">Authorized for GEA & Teachers</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1">
            <span className="font-bold text-slate-900 block">Comm. Sterling (Platform Admin)</span>
            <div className="text-slate-600">Email: <code className="font-mono text-slate-900">admin@gov-portal.demo</code></div>
            <div className="text-slate-600">Pass: <code className="font-mono text-slate-900">Admin123!</code></div>
            <div className="text-[11px] text-slate-700 mt-1">System Overseer</div>
          </div>
        </div>
      </div>

      {/* Ballot Secrecy Architecture Card */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-md border border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Ballot Secrecy & Data Architecture Inspection
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The database schema maintains strict physical separation:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <strong className="text-blue-300 block mb-1">voter_participation table</strong>
            <p className="text-slate-400 text-[11px]">
              Stores: <code>id</code>, <code>election_id</code>, <code>employee_id</code>, <code>submitted_at</code>, <code>confirmation_reference</code>.
            </p>
            <div className="text-rose-400 text-[10px] mt-1 font-semibold">
              STRICTLY EXCLUDES CANDIDATE SELECTION
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <strong className="text-emerald-300 block mb-1">ballots table (Sealed Vault)</strong>
            <p className="text-slate-400 text-[11px]">
              Stores: <code>id</code>, <code>election_id</code>, <code>position_id</code>, <code>candidate_id</code>, <code>ballot_reference</code>.
            </p>
            <div className="text-emerald-400 text-[10px] mt-1 font-semibold">
              STRICTLY EXCLUDES EMPLOYEE / VOTER IDENTITY
            </div>
          </div>
        </div>
      </div>

      {/* Fictional Employee Records Registry */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Fictional Civil Service Employee Registry</h3>
            <p className="text-xs text-slate-500">Seed records used to validate employee IDs during registration and voting</p>
          </div>
          <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            {employees.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-3">Employee ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Association</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Designation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const assoc = associations.find(a => a.id === emp.association_id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 font-mono">
                    <td className="py-2.5 px-3 font-bold text-blue-700">{emp.employee_id}</td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{emp.full_name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">{emp.email}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{assoc?.name || 'Association'}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{emp.department}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{emp.designation}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
