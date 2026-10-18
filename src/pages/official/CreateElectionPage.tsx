import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  FileText, 
  Loader2,
  Sparkles,
  ShieldCheck,
  Vote,
  ExternalLink,
  Zap
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Association, Employee } from '../../types/index.ts';

interface CreateElectionPageProps {
  navigate: (path: string) => void;
}

export const CreateElectionPage: React.FC<CreateElectionPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [associationEmployees, setAssociationEmployees] = useState<Employee[]>([]);

  // Launch Mode
  const [launchPhase, setLaunchPhase] = useState<'NOMINATION_OPEN' | 'VOTING_OPEN' | 'CUSTOM'>('NOMINATION_OPEN');

  // Step 1: Election Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssocIds, setSelectedAssocIds] = useState<string[]>([]);
  const [positions, setPositions] = useState([
    { id: 'pos-1', title: 'Association President', number_of_seats: 1, instructions: 'Single seat executive council leadership' }
  ]);
  const [eligibilityRequirements, setEligibilityRequirements] = useState('All active permanent association members with verified credentials.');
  const [instructions, setInstructions] = useState('Mark your chosen candidate on the electronic ballot. All votes are anonymous.');

  // Step 2: Eligible Employees
  const [individualEmpId, setIndividualEmpId] = useState('');
  const [bulkEmpText, setBulkEmpText] = useState('');
  const [eligibleList, setEligibleList] = useState<string[]>([]);
  const [empErrors, setEmpErrors] = useState<string | null>(null);

  // Schedules
  const now = new Date();
  const formatDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultNomStart = formatDateTimeLocal(now);
  const defaultNomEnd = formatDateTimeLocal(new Date(now.getTime() + 5 * 86400000));
  const defaultVoteStart = formatDateTimeLocal(new Date(now.getTime() + 5 * 86400000));
  const defaultVoteEnd = formatDateTimeLocal(new Date(now.getTime() + 10 * 86400000));

  const [nomStart, setNomStart] = useState(defaultNomStart);
  const [nomEnd, setNomEnd] = useState(defaultNomEnd);
  const [voteStart, setVoteStart] = useState(defaultVoteStart);
  const [voteEnd, setVoteEnd] = useState(defaultVoteEnd);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedElection, setPublishedElection] = useState<any>(null);

  // Load associations & employees
  useEffect(() => {
    async function load() {
      try {
        const [assocRes, empRes] = await Promise.all([
          api.getAssociations(),
          api.getEmployees()
        ]);
        const activeAssocs = assocRes.associations.filter(a => a.active);
        setAssociations(activeAssocs);
        setAssociationEmployees(empRes.employees);

        // Pre-select user's association or first association
        const initialAssocId = user?.association_id || (activeAssocs.length > 0 ? activeAssocs[0].id : 'assoc-1');
        setSelectedAssocIds([initialAssocId]);

        // Pre-populate eligible voters for the selected association
        const matchEmps = empRes.employees.filter(e => e.association_id === initialAssocId);
        if (matchEmps.length > 0) {
          setEligibleList(matchEmps.map(e => e.employee_id));
        }
      } catch (err) {
        console.error('Failed to load association data', err);
      }
    }
    load();
  }, [user]);

  // Handle phase quick switch
  const handlePhaseChange = (phase: 'NOMINATION_OPEN' | 'VOTING_OPEN' | 'CUSTOM') => {
    setLaunchPhase(phase);
    const current = new Date();
    if (phase === 'VOTING_OPEN') {
      // Voting is open now; nominations occurred in the past
      setNomStart(formatDateTimeLocal(new Date(current.getTime() - 7 * 86400000)));
      setNomEnd(formatDateTimeLocal(new Date(current.getTime() - 3600000)));
      setVoteStart(formatDateTimeLocal(current));
      setVoteEnd(formatDateTimeLocal(new Date(current.getTime() + 7 * 86400000)));
    } else if (phase === 'NOMINATION_OPEN') {
      // Nominations are open now
      setNomStart(formatDateTimeLocal(current));
      setNomEnd(formatDateTimeLocal(new Date(current.getTime() + 5 * 86400000)));
      setVoteStart(formatDateTimeLocal(new Date(current.getTime() + 5 * 86400000)));
      setVoteEnd(formatDateTimeLocal(new Date(current.getTime() + 10 * 86400000)));
    }
  };

  // Pre-fill demo data
  const handlePreFillDemo = () => {
    const selectedAssoc = associations.find(a => selectedAssocIds.includes(a.id)) || associations[0];
    const assocCode = selectedAssoc ? selectedAssoc.code : 'GEA';
    const assocName = selectedAssoc ? selectedAssoc.name : 'Government Employees Association';

    setTitle(`2026 ${assocCode} General Executive Council Election`);
    setDescription(`Official biennial election of the executive leadership council for ${assocName}. All authorized civil service personnel are invited to cast their ballots.`);
    
    // Set 2 contested positions
    setPositions([
      { id: 'pos-1', title: 'Association President', number_of_seats: 1, instructions: 'Vote for one candidate for president' },
      { id: 'pos-2', title: 'General Secretary', number_of_seats: 1, instructions: 'Vote for one candidate for general secretary' }
    ]);

    // Populate all eligible employees for the selected association
    const matchEmps = associationEmployees.filter(e => selectedAssocIds.includes(e.association_id));
    if (matchEmps.length > 0) {
      setEligibleList(matchEmps.map(e => e.employee_id));
    } else if (associationEmployees.length > 0) {
      setEligibleList(associationEmployees.slice(0, 5).map(e => e.employee_id));
    }

    setEligibilityRequirements('All active permanent association members with verified employee credentials.');
    setInstructions('Mark your designated candidate choice for each contested seat. Ballots are cryptographically anonymous.');
    setError(null);
  };

  // Position helpers
  const addPosition = () => {
    setPositions(prev => [
      ...prev,
      { id: `pos-${prev.length + 1}`, title: '', number_of_seats: 1, instructions: '' }
    ]);
  };

  const removePosition = (index: number) => {
    if (positions.length <= 1) return;
    setPositions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePosition = (index: number, field: string, val: any) => {
    setPositions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Eligible employee helpers
  const handleAddIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!individualEmpId.trim()) return;
    const clean = individualEmpId.trim().toUpperCase();
    if (eligibleList.includes(clean)) {
      setEmpErrors(`Employee ID ${clean} is already added to the roll.`);
      return;
    }
    setEligibleList(prev => [...prev, clean]);
    setIndividualEmpId('');
    setEmpErrors(null);
  };

  const handleBulkAdd = () => {
    if (!bulkEmpText.trim()) return;
    const tokens = bulkEmpText
      .split(/[\s,;\n]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    const newUnique: string[] = [];
    const duplicates: string[] = [];

    tokens.forEach(t => {
      if (eligibleList.includes(t) || newUnique.includes(t)) {
        duplicates.push(t);
      } else {
        newUnique.push(t);
      }
    });

    setEligibleList(prev => [...prev, ...newUnique]);
    setBulkEmpText('');
    if (duplicates.length > 0) {
      setEmpErrors(`Added ${newUnique.length} new IDs. Skipped ${duplicates.length} duplicate(s).`);
    } else {
      setEmpErrors(null);
    }
  };

  const handleRemoveEmp = (idToRemove: string) => {
    setEligibleList(prev => prev.filter(id => id !== idToRemove));
  };

  const handleSeedFromAssociation = () => {
    const matching = associationEmployees.filter(e => selectedAssocIds.includes(e.association_id));
    const ids = matching.map(e => e.employee_id);
    const combined = Array.from(new Set([...eligibleList, ...ids]));
    setEligibleList(combined.length > 0 ? combined : ['EMP-10023', 'EMP-10045']);
    setEmpErrors(`Populated ${matching.length || 2} employees from selected associations.`);
  };

  // Submission handler
  const handleFinalSubmit = async (publishNow: boolean) => {
    setSubmitting(true);
    setError(null);

    // Prepare reliable fallbacks
    const resolvedAssocs = selectedAssocIds.length > 0 
      ? selectedAssocIds 
      : (associations.length > 0 ? [associations[0].id] : ['assoc-1']);

    const resolvedAssocObj = associations.find(a => resolvedAssocs.includes(a.id));
    const resolvedTitle = title.trim() || `${resolvedAssocObj ? resolvedAssocObj.name : 'Association'} Leadership Election ${new Date().getFullYear()}`;

    // Ensure positions have titles
    const resolvedPositions = positions.map((p, idx) => ({
      id: p.id,
      title: p.title.trim() || `Executive Officer Seat #${idx + 1}`,
      number_of_seats: p.number_of_seats || 1,
      instructions: p.instructions || 'Cast one vote'
    }));

    // Ensure voter roster has IDs
    let resolvedVoters = [...eligibleList];
    if (resolvedVoters.length === 0) {
      const match = associationEmployees.filter(e => resolvedAssocs.includes(e.association_id));
      resolvedVoters = match.length > 0 ? match.map(e => e.employee_id) : ['EMP-10023', 'EMP-10045'];
      setEligibleList(resolvedVoters);
    }

    try {
      const res = await api.createElection({
        title: resolvedTitle,
        description: description.trim() || `Official association election for ${resolvedAssocObj ? resolvedAssocObj.name : 'authorized association members'}.`,
        association_ids: resolvedAssocs,
        positions: resolvedPositions,
        eligibility_requirements: eligibilityRequirements.trim(),
        instructions: instructions.trim(),
        eligible_employee_ids: resolvedVoters,
        nomination_start: nomStart,
        nomination_end: nomEnd,
        voting_start: voteStart,
        voting_end: voteEnd,
        publish_now: publishNow,
        initial_phase: launchPhase
      });

      if (publishNow) {
        setPublishedElection(res.election);
      } else {
        navigate(`/official/elections/${res.election.id}`);
      }
    } catch (err: any) {
      console.error('Election submission failed:', err);
      setError(err.message || 'Election creation failed. Please check form entries.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Cancel */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/official/elections')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel & Return to Elections
        </button>

        <button
          type="button"
          onClick={handlePreFillDemo}
          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          ⚡ Pre-fill Sample Election
        </button>
      </div>

      {/* Header Wizard Banner with Quick Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
              Official Election Wizard
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              Create & Publish Association Election
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure contested positions, voter eligibility rolls, and publish directly to the Voter Portal.
            </p>
          </div>

          {/* Quick Publish Button at top */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleFinalSubmit(false)}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleFinalSubmit(true)}
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Publish Election Now
            </button>
          </div>
        </div>

        {/* Clickable 5-step indicators */}
        <div className="flex items-center justify-between text-xs font-semibold border-t border-slate-100 pt-4 overflow-x-auto gap-2">
          {[
            { s: 1 as const, label: '1. Details & Scope' },
            { s: 2 as const, label: '2. Voter Roll' },
            { s: 3 as const, label: '3. Nominations' },
            { s: 4 as const, label: '4. Voting Schedule' },
            { s: 5 as const, label: '5. Review & Launch' },
          ].map((item) => (
            <button
              key={item.s}
              type="button"
              onClick={() => {
                setError(null);
                setStep(item.s);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition cursor-pointer text-left ${
                step === item.s
                  ? 'bg-blue-600 text-white shadow-xs'
                  : step > item.s
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {step > item.s ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">{item.s}</span>}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong>Action Required:</strong>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* STEP 1: Details & Scope */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 1: Election Scope & Contested Positions</h3>
              <p className="text-xs text-slate-500">Provide the title, participating association, and leadership positions.</p>
            </div>
            
            {/* Quick Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => handlePhaseChange('NOMINATION_OPEN')}
                className={`px-3 py-1.5 rounded-lg transition ${launchPhase === 'NOMINATION_OPEN' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'}`}
              >
                🟢 Nominations Open
              </button>
              <button
                type="button"
                onClick={() => handlePhaseChange('VOTING_OPEN')}
                className={`px-3 py-1.5 rounded-lg transition ${launchPhase === 'VOTING_OPEN' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-slate-600'}`}
              >
                🗳️ Open Voting Now
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Election Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2026 GEA General Executive Council Election"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Description & Mandate
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of the election mandate, governance body, and voting instructions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Participating Associations Checkboxes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2">
                Participating Associations *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {associations.map((assoc) => {
                  const isChecked = selectedAssocIds.includes(assoc.id);
                  return (
                    <label
                      key={assoc.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                        isChecked ? 'bg-blue-50/70 border-blue-400' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssocIds([...selectedAssocIds, assoc.id]);
                          } else {
                            if (selectedAssocIds.length > 1) {
                              setSelectedAssocIds(selectedAssocIds.filter(id => id !== assoc.id));
                            }
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{assoc.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{assoc.code}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Positions Section */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Contested Positions</h4>
                  <p className="text-[11px] text-slate-500">Add the leadership seats being voted upon</p>
                </div>
                <button
                  type="button"
                  onClick={addPosition}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Position
                </button>
              </div>

              {positions.map((pos, idx) => (
                <div key={pos.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Position #{idx + 1}</span>
                    {positions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePosition(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-medium mb-1">Position Title *</label>
                      <input
                        type="text"
                        value={pos.title}
                        onChange={(e) => updatePosition(idx, 'title', e.target.value)}
                        placeholder="e.g. Association President"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Seats Available</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={pos.number_of_seats}
                        onChange={(e) => updatePosition(idx, 'number_of_seats', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleFinalSubmit(true)}
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Publish Election Now
            </button>

            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  setTitle(`2026 ${associations[0]?.code || 'GEA'} Association Election`);
                }
                setStep(2);
              }}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5"
            >
              Continue to Step 2 (Voter Roll)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Eligible Employees Roll */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2: Eligible Employee Roll</h3>
              <p className="text-xs text-slate-500">
                Configure authorized voter IDs. Only civil servants matching this roster will be permitted to access ballots.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedFromAssociation}
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Auto-Populate Association Employees
            </button>
          </div>

          {empErrors && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              {empErrors}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Individual input */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Add Single Employee ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={individualEmpId}
                  onChange={(e) => setIndividualEmpId(e.target.value.toUpperCase())}
                  placeholder="e.g. EMP-10023"
                  className="w-full px-3 py-1.5 text-xs uppercase font-mono rounded-lg border border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddIndividual}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Bulk paste input */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Bulk Paste Employee IDs</label>
              <textarea
                value={bulkEmpText}
                onChange={(e) => setBulkEmpText(e.target.value)}
                placeholder="Paste IDs separated by spaces, commas, or line breaks (e.g. EMP-10023, EMP-10045, EMP-10078)..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
              />
              <button
                type="button"
                onClick={handleBulkAdd}
                className="w-full py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Validate & Add to Roster
              </button>
            </div>
          </div>

          {/* Roster preview list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Voter Roll Preview ({eligibleList.length} Authorized Employees)
              </span>
              {eligibleList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEligibleList([])}
                  className="text-rose-600 hover:underline text-[11px]"
                >
                  Clear all
                </button>
              )}
            </div>

            {eligibleList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No employee IDs added yet. Click "Auto-Populate Association Employees" above to automatically load voter IDs.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-2">
                {eligibleList.map((empId) => (
                  <span
                    key={empId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 font-mono text-xs text-slate-800 shadow-2xs"
                  >
                    {empId}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmp(empId)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back to Details
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Election Now
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5"
              >
                Continue to Step 3 (Nominations)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Nomination Schedule */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Step 3: Candidate Nomination Period</h3>
            <p className="text-xs text-slate-500">
              Designate the window during which verified association members may submit candidacy proposals and manifestos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomination Opening Date & Time *
              </label>
              <input
                type="datetime-local"
                value={nomStart}
                onChange={(e) => setNomStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomination Closing Cutoff Date & Time *
              </label>
              <input
                type="datetime-local"
                value={nomEnd}
                onChange={(e) => setNomEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back to Voter Roll
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Election Now
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5"
              >
                Continue to Step 4 (Voting Dates)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Voting Schedule */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Step 4: Voting Period Schedule</h3>
            <p className="text-xs text-slate-500">
              Define the dates during which eligible voters can access the ballot and submit confidential votes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Voting Opening Date & Time *
              </label>
              <input
                type="datetime-local"
                value={voteStart}
                onChange={(e) => setVoteStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Voting Closing Date & Time *
              </label>
              <input
                type="datetime-local"
                value={voteEnd}
                onChange={(e) => setVoteEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back to Nominations
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Election Now
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center justify-center gap-1.5"
              >
                Continue to Step 5 (Review & Publish)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Publish Summary */}
      {step === 5 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                Final Step 5: Pre-Flight Review
              </span>
              <h3 className="text-xl font-bold text-slate-900">Election Summary & Launch</h3>
            </div>
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Election Title:</span>
                <strong className="text-slate-900 text-sm">{title || 'General Association Election'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Associations:</span>
                <span className="font-semibold text-slate-800">
                  {associations.filter(a => selectedAssocIds.includes(a.id)).map(a => a.name).join(', ') || 'Selected Association'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Voter Roll Count:</span>
                <strong className="text-blue-700">{eligibleList.length || 'All members'} employees</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contested Positions:</span>
                <span className="font-semibold text-slate-800">{positions.map(p => p.title || 'Leadership Seat').join(', ')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-slate-700 block">Nomination Schedule</span>
                <div className="text-slate-500">Opens: {new Date(nomStart).toLocaleString()}</div>
                <div className="text-slate-500">Closes: {new Date(nomEnd).toLocaleString()}</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-slate-700 block">Voting Schedule</span>
                <div className="text-slate-500">Opens: {new Date(voteStart).toLocaleString()}</div>
                <div className="text-slate-500">Closes: {new Date(voteEnd).toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900">
              <strong>Publication Advisory:</strong> When you click <strong>"Publish Election Now"</strong>, the election is immediately added to the live database, synced in real time, and becomes directly visible to association voters on the Voter Portal.
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Back to Schedule
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Election Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Published Success Modal & Direct Voter Portal Access */}
      {publishedElection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block mb-1">
                Election Created & Published Successfully
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {publishedElection.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                The election has been added to the database and is now live and immediately visible to eligible participants on the Voter Portal!
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1.5 text-left">
              <div><span className="text-slate-400">Status:</span> <strong className="text-emerald-700 font-bold uppercase">{publishedElection.status}</strong></div>
              <div><span className="text-slate-400">Authorized Voters:</span> <span className="font-semibold">{publishedElection.eligible_employee_ids?.length || 0} employees</span></div>
              <div><span className="text-slate-400">Contested Positions:</span> <span className="font-semibold">{publishedElection.positions?.map((p: any) => p.title).join(', ')}</span></div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(`/participant/elections/${publishedElection.id}`)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Vote className="w-4 h-4" />
                View on Voter Portal →
              </button>
              <button
                onClick={() => navigate('/participant/elections')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition"
              >
                Voter Portal Election Roll
              </button>
              <button
                onClick={() => navigate(`/official/elections/${publishedElection.id}`)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
              >
                Manage in Official Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
