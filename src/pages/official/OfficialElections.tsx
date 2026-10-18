import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Layers, 
  Calendar, 
  Vote, 
  Award, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Election, Association } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';

interface OfficialElectionsProps {
  navigate: (path: string) => void;
}

export const OfficialElections: React.FC<OfficialElectionsProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [elections, setElections] = useState<Election[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    try {
      const [elecRes, assocRes] = await Promise.all([
        api.getElections(),
        api.getAssociations()
      ]);
      setElections(elecRes.elections);
      setAssociations(assocRes.associations);
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

  const filtered = elections.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                          e.description.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
  });

  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handlePublishDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPublishingId(id);
    try {
      await api.publishElection(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish election');
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Elections</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, configure, publish, and oversee association elections within your jurisdiction
          </p>
        </div>

        <button
          onClick={() => navigate('/official/elections/create')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Election
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search elections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'NOMINATION_OPEN', label: 'Nominations' },
            { id: 'VOTING_OPEN', label: 'Voting Open' },
            { id: 'VOTING_CLOSED', label: 'Voting Closed' },
            { id: 'RESULTS_PUBLISHED', label: 'Published' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Election Title</th>
                <th className="py-3 px-4 font-semibold">Associations</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Nomination Deadline</th>
                <th className="py-3 px-4 font-semibold">Voting Period</th>
                <th className="py-3 px-4 font-semibold">Eligible Voters</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No elections found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((elec) => {
                  const assocNames = associations
                    .filter(a => elec.association_ids.includes(a.id))
                    .map(a => a.name)
                    .join(', ');

                  return (
                    <tr key={elec.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{elec.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{elec.description}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate">
                        {assocNames || 'Association'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={elec.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(elec.nomination_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{new Date(elec.voting_start).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">to {new Date(elec.voting_end).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {elec.eligible_employee_ids.length}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {elec.status === 'DRAFT' && (
                            <button
                              onClick={(e) => handlePublishDraft(elec.id, e)}
                              disabled={publishingId === elec.id}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                            >
                              {publishingId === elec.id ? 'Publishing...' : 'Publish'}
                            </button>
                          )}
                          {elec.status !== 'DRAFT' && (
                            <button
                              onClick={() => navigate(`/participant/elections/${elec.id}`)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition"
                              title="Preview on Voter Portal"
                            >
                              Voter View
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/official/elections/${elec.id}`)}
                            className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
