import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { api } from '../../lib/api.ts';
import { 
  ShieldAlert, 
  UserCheck, 
  RotateCcw, 
  Radio, 
  Users, 
  ChevronDown, 
  Check, 
  ExternalLink 
} from 'lucide-react';

export const DemoSwitcherBar: React.FC = () => {
  const { user, switchDemo, logout } = useAuth();
  const { connected } = useRealtime();
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const demoAccounts = [
    {
      id: 'usr-part-1',
      name: 'Jane Doe',
      roleLabel: 'Participant (GEA, Verified)',
      account_role: 'PARTICIPANT',
      verified: true
    },
    {
      id: 'usr-part-2',
      name: 'Marcus Chen',
      roleLabel: 'Participant / Candidate (GEA, Voted)',
      account_role: 'PARTICIPANT',
      verified: true
    },
    {
      id: 'usr-part-3',
      name: 'Sarah Jenkins',
      roleLabel: 'Participant (Teachers, Unverified)',
      account_role: 'PARTICIPANT',
      verified: false
    },
    {
      id: 'usr-official-1',
      name: 'Officer Davis',
      roleLabel: 'Election Official (Approved)',
      account_role: 'OFFICIAL',
      verified: true
    },
    {
      id: 'usr-official-pending',
      name: 'Officer Morales',
      roleLabel: 'Election Official (Pending Approval)',
      account_role: 'OFFICIAL',
      verified: false
    },
    {
      id: 'usr-admin',
      name: 'Comm. Sterling',
      roleLabel: 'Platform Administrator',
      account_role: 'PLATFORM_ADMIN',
      verified: true
    }
  ];

  const handleSwitch = async (id: string) => {
    try {
      await switchDemo(id);
      setMenuOpen(false);
      setMessage('Switched demo account');
      setTimeout(() => setMessage(null), 2500);
      window.location.hash = ''; // reset to top or let router handle
    } catch (err: any) {
      alert(err.message || 'Failed to switch demo account');
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all demo data (elections, ballots, candidates, votes) to default initial state?')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoData();
      setMessage('Demo data successfully reset');
      setTimeout(() => {
        setMessage(null);
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 text-xs py-1.5 px-3 sm:px-6 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Environment Info & Real-Time Sync Indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
            PROTOTYPE DEMO
          </span>
          <span className="hidden md:inline text-slate-400">
            Fictional government associations & anonymous test ballots
          </span>
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 text-[11px]">
            <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className={connected ? 'text-emerald-400' : 'text-amber-400'}>
              {connected ? 'Live Sync Active' : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Center / Right: Switcher & Actions */}
        <div className="flex items-center gap-2">
          {message && (
            <span className="text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 animate-fade-in">
              {message}
            </span>
          )}

          {/* Quick Account Switch Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-2.5 py-1 rounded border border-slate-700 transition"
              title="Switch demo account"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate">
                {user ? `${user.full_name} (${user.account_role === 'OFFICIAL' ? 'Official' : user.account_role === 'PLATFORM_ADMIN' ? 'Admin' : 'Voter'})` : 'Select Demo Account'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-slate-800 rounded-md shadow-xl border border-slate-700 py-1 text-slate-200 z-50">
                <div className="px-3 py-1.5 border-b border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Demo Persona
                </div>
                {demoAccounts.map(acc => {
                  const isCurrent = user?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleSwitch(acc.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700 transition ${isCurrent ? 'bg-slate-700/60 text-blue-300 font-medium' : ''}`}
                    >
                      <div>
                        <div className="text-white font-medium">{acc.name}</div>
                        <div className="text-[11px] text-slate-400">{acc.roleLabel}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reset Demo State Button */}
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 px-2 py-1 rounded text-xs transition disabled:opacity-50"
            title="Reset demo data to clean slate"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
