import React, { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { Association } from '../../types/index.ts';

interface AssociationsPageProps {
  navigate: (path: string) => void;
}

export const AssociationsPage: React.FC<AssociationsPageProps> = ({ navigate }) => {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadAssociations = async () => {
    try {
      const res = await api.getAssociations();
      setAssociations(res.associations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssociations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setSubmitting(true);
    try {
      await api.createAssociation({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim()
      });
      setName('');
      setCode('');
      setDescription('');
      await loadAssociations();
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await api.toggleAssociation(id);
      await loadAssociations();
    } catch (err: any) {
      alert(err.message || 'Toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Government Associations Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage authorized civil service employee bodies eligible to host digital elections
        </p>
      </div>

      {/* Add New Association Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          Register New Government Association
        </h3>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Association Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Environmental Officers Association"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Code / Acronym *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. EOA"
                className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description & Scope</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Representing regional environmental protection and forestry service personnel..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Register Association
            </button>
          </div>
        </form>
      </div>

      {/* Association List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-sm">Configured Associations ({associations.length})</span>
        </div>

        <div className="divide-y divide-slate-100">
          {associations.map((assoc) => (
            <div key={assoc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{assoc.name}</span>
                  <span className="font-mono text-[10px] font-semibold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                    {assoc.code}
                  </span>
                </div>
                <p className="text-slate-500 mt-0.5">{assoc.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  assoc.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {assoc.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <button
                  onClick={() => handleToggle(assoc.id)}
                  disabled={togglingId === assoc.id}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition"
                >
                  {assoc.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
