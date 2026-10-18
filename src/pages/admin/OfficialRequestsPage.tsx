import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Check, 
  X, 
  Building2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Association, UserProfile } from '../../types/index.ts';

interface OfficialRequestsPageProps {
  navigate: (path: string) => void;
}

export const OfficialRequestsPage: React.FC<OfficialRequestsPageProps> = ({ navigate }) => {
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal / assign associations state
  const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
  const [selectedAssocIds, setSelectedAssocIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      const [reqRes, assocRes] = await Promise.all([
        api.getOfficialRequests(),
        api.getAssociations()
      ]);
      setRequests(reqRes.requests);
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

  const handleOpenApproveModal = (u: UserProfile) => {
    setAssigningUser(u);
    // Default to their requested association
    setSelectedAssocIds(u.association_id ? [u.association_id] : []);
  };

  const handleConfirmApproval = async () => {
    if (!assigningUser) return;
    if (selectedAssocIds.length === 0) {
      alert('Please assign at least one authorized association to this official.');
      return;
    }

    setProcessingId(assigningUser.id);
    try {
      await api.reviewOfficialRequest(assigningUser.id, {
        decision: 'APPROVE',
        authorized_association_ids: selectedAssocIds
      });
      setAssigningUser(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this election official account request?')) {
      return;
    }
    setProcessingId(userId);
    try {
      await api.reviewOfficialRequest(userId, { decision: 'REJECT' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Election Official Account Requests</h1>
        <p className="text-xs text-slate-500 mt-1">
          Scrutinize requests from prospective returning officers and assign authorized association scopes
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No pending official account requests at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((u) => {
            const requestedAssoc = associations.find(a => a.id === u.association_id);
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{u.full_name}</h3>
                    <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Pending Authorization
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{u.email}</div>
                  <div className="text-xs text-slate-700 mt-2">
                    Requested Association: <strong className="text-slate-900">{requestedAssoc?.name || 'Association'}</strong> ({requestedAssoc?.code})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(u.id)}
                    disabled={processingId === u.id}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleOpenApproveModal(u)}
                    disabled={processingId === u.id}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                  >
                    Assign Scopes & Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scope Assignment Modal */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Official Appointment
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Assign Authorized Associations for {assigningUser.full_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the government bodies this returning officer is permitted to administer:
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
              {associations.map((assoc) => {
                const isChecked = selectedAssocIds.includes(assoc.id);
                return (
                  <label key={assoc.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedAssocIds([...selectedAssocIds, assoc.id]);
                        else setSelectedAssocIds(selectedAssocIds.filter(id => id !== assoc.id));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-slate-900">{assoc.name}</strong>
                      <span className="text-slate-400 font-mono ml-1.5">({assoc.code})</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={processingId === assigningUser.id}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Confirm Approval & Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
