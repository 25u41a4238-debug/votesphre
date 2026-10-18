import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Vote,
  Award
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Election, Association } from '../../types/index.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ParticipantElectionsProps {
  navigate: (path: string) => void;
}

export const ParticipantElections: React.FC<ParticipantElectionsProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { addListener } = useRealtime();

  const [elections, setElections] = useState<Election[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [associationFilter, setAssociationFilter] = useState('ALL');

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

  // Real-time listener for newly published or created elections
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (
        event.type === 'ELECTION_PUBLISHED' ||
        event.type === 'ELECTION_CREATED' ||
        event.type === 'ELECTION_UPDATED' ||
        event.type === 'CANDIDATE_APPROVED' ||
        event.type === 'VOTE_CAST' ||
        event.type === 'RESULTS_PUBLISHED' ||
        event.type === 'DEMO_RESET'
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [addListener]);

  const filtered = elections.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                          e.description.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (associationFilter !== 'ALL' && !e.association_ids.includes(associationFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Association Elections</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore all open, scheduled, and concluded elections authorized for your membership
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search elections by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'VOTING_OPEN', label: 'Voting Open' },
              { id: 'NOMINATION_OPEN', label: 'Nominations' },
              { id: 'RESULTS_PUBLISHED', label: 'Results' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={associationFilter}
            onChange={(e) => setAssociationFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Associations</option>
            {associations.map(a => (
              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No published elections matching the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(elec => {
            const assocName = associations.find(a => elec.association_ids.includes(a.id))?.name || 'Association';
            const isMyAssoc = Boolean(user?.association_id && elec.association_ids.includes(user.association_id));
            const isEligible = Boolean(user?.employee_id && elec.eligible_employee_ids.includes(user.employee_id));

            return (
              <div 
                key={elec.id} 
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition ${
                  isMyAssoc ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                    <StatusBadge status={elec.status} size="sm" />
                    <div className="flex items-center gap-1">
                      {isMyAssoc && (
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                          My Association
                        </span>
                      )}
                      {isEligible && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                          Eligible Voter
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-2">
                    {elec.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4">
                    {elec.description}
                  </p>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Positions Contested:</span>
                      <span className="font-semibold text-slate-800">{elec.positions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Approved Candidates:</span>
                      <span className="font-semibold text-slate-800">{elec.approved_candidates_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Voting Closes:</span>
                      <span className="font-semibold text-slate-800">{new Date(elec.voting_end).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/participant/elections/${elec.id}`)}
                    className="text-xs font-semibold text-slate-700 hover:text-blue-700"
                  >
                    View Details
                  </button>

                  {elec.status === 'VOTING_OPEN' ? (
                    <button
                      onClick={() => navigate(`/participant/vote/${elec.id}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                    >
                      Cast Vote
                    </button>
                  ) : elec.status === 'NOMINATION_OPEN' ? (
                    <button
                      onClick={() => navigate(`/participant/nominations?electionId=${elec.id}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                    >
                      Apply Candidate
                    </button>
                  ) : elec.status === 'RESULTS_PUBLISHED' ? (
                    <button
                      onClick={() => navigate(`/participant/results?electionId=${elec.id}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs"
                    >
                      View Results
                    </button>
                  ) : elec.status === 'VOTING_CLOSED' ? (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Results Pending
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Scheduled</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
