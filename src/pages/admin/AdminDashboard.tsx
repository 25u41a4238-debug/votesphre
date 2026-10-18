import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Layers, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Association, Election, AuditLogItem } from '../../types/index.ts';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [associations, setAssociations] = useState<Association[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [officialRequests, setOfficialRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [assocRes, elecRes, reqRes, logRes] = await Promise.all([
        api.getAssociations(),
        api.getElections(),
        api.getOfficialRequests(),
        api.getAuditLogs()
      ]);
      setAssociations(assocRes.associations);
      setElections(elecRes.elections);
      setOfficialRequests(reqRes.requests);
      setAuditLogs(logRes.logs.slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    const unsub = addListener(() => loadData());
    return unsub;
  }, [addListener]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Governance & Root Oversight
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Platform Administration
          </h1>
          <p className="text-xs text-slate-500">
            System Overseer: {user?.full_name} • Full Privileged Access
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/platform-admin/demo-management')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
          >
            Demo & Test Data Tools
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Official Requests Pending</div>
          <div className={`text-2xl font-bold mt-1 ${officialRequests.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {officialRequests.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting credential review</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Active Associations</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {associations.filter(a => a.active).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Civil service directories</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Elections</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {elections.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all associations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Audit Events Logged</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {auditLogs.length}+
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recorded administrative actions</div>
        </div>
      </div>

      {/* Main Grid: Pending Official Requests + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Official Account Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Pending Official Requests ({officialRequests.length})
            </h3>
            <button
              onClick={() => navigate('/platform-admin/official-requests')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              Manage all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {officialRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No pending election official registration requests.
            </div>
          ) : (
            <div className="space-y-3">
              {officialRequests.map((req) => {
                const assoc = associations.find(a => a.id === req.association_id);
                return (
                  <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-sm text-slate-900 block">{req.full_name}</strong>
                      <span className="text-slate-500">{req.email}</span>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Requested Body: <span className="font-semibold">{assoc?.name || 'Association'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/platform-admin/official-requests')}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700"
                    >
                      Scrutinize Request
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Association Directory Quick View */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Association Directory ({associations.length})
            </h3>
            <button
              onClick={() => navigate('/platform-admin/associations')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              Configure directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {associations.map((assoc) => (
              <div key={assoc.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{assoc.name}</span>
                  <span className="ml-2 font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                    {assoc.code}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  assoc.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {assoc.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          System-Wide Audit Trail
        </h3>
        <p className="text-xs text-slate-500">
          Cryptographically referenced administrative events and state alterations
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{log.actor_name}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                      {log.actor_role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">{log.action}</td>
                  <td className="py-2.5 px-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
