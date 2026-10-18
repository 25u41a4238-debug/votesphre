import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Users, 
  FileCheck2, 
  Award, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Radio,
  FileText
} from 'lucide-react';
import { api } from '../lib/api.ts';
import { Election, Association } from '../types/index.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [elecRes, assocRes] = await Promise.all([
          api.getElections(),
          api.getAssociations()
        ]);
        setElections(elecRes.elections);
        setAssociations(assocRes.associations);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/60 text-blue-300 text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official Digital Voting Prototype
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight">
            Secure and Transparent Association Elections
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A centralized digital platform to manage elections, review candidate nominations, enable eligible employees to vote, and publish official results.
          </p>

          {/* Call to action buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/30 transition flex items-center gap-2 group"
            >
              Register Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              Sign In to Portal
            </button>
          </div>

          {/* Quick stats counter */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-blue-400">5</div>
              <div className="text-xs text-slate-400 mt-0.5">Government Associations</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Anonymous Ballots</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-indigo-400">Real-Time</div>
              <div className="text-xs text-slate-400 mt-0.5">Dual-Portal Sync</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-2xl font-bold text-amber-400">Simulated</div>
              <div className="text-xs text-slate-400 mt-0.5">Identity Verification</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Process Overview</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How the Voting Platform Works</h3>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Designed to guarantee auditability for election officials while ensuring absolute ballot privacy for eligible voters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Affiliation & ID Verification</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Voters register under their association and undergo simulated liveness and employee ID validation before accessing ballots.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Nominations & Scrutiny</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Members submit candidacy proposals during nomination windows. Election officials review credentials and approve contenders.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Confidential Ballot Casting</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Single-vote enforcement via atomic backend transactions. Voter participation is recorded separately from secret ballot choices.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-4">
              4
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">Certified Result Publication</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ballots remain sealed during voting. Once voting closes, Scrutineers tally results and authorize certified publication.
            </p>
          </div>
        </div>
      </section>

      {/* Two Role-Based Portals Comparison */}
      <section className="py-12 bg-slate-100/70 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-slate-900">One Unified System, Two Portals</h3>
            <p className="text-sm text-slate-600 mt-1">
              Both portals operate against the exact same synchronized PostgreSQL data model.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Participant Portal Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Participant Portal</h4>
                  <p className="text-xs text-slate-500">For association civil servants and prospective candidates</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Browse authorized elections tailored to your government association</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Simulate biometric identity verification with instant feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Submit candidate nominations with manifesto and declarations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Cast sealed anonymous ballots with unique non-identifying receipt codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>View certified official results upon publication</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/login?role=PARTICIPANT')}
                  className="w-full py-2.5 px-4 text-center text-xs sm:text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                >
                  Enter Participant Portal →
                </button>
              </div>
            </div>

            {/* Election Official Portal Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Election Official Portal</h4>
                  <p className="text-xs text-slate-500">For Scrutineers, Returning Officers, and Board Administrators</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Create elections with 5-step wizard and bulk eligible employee ID upload</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Review and adjudicate candidate proposals with audit logging</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Manage manual employee identity verification requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Monitor live participation turnout without seeing voter candidate choices</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Seal elections, calculate final tallies, and publish official certificates</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/login?role=OFFICIAL')}
                  className="w-full py-2.5 px-4 text-center text-xs sm:text-sm font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200"
                >
                  Enter Official Portal →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Elections Showcase */}
      <section id="elections" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Current Ballot Registry</h2>
            <h3 className="text-2xl font-bold text-slate-900">Active Association Elections</h3>
          </div>
          <button
            onClick={() => navigate('/participant/elections')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 self-start sm:self-auto"
          >
            View all elections <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.filter(e => e.status !== 'DRAFT').slice(0, 3).map((elec) => {
            const assocName = associations.find(a => elec.association_ids.includes(a.id))?.name || 'Government Association';
            return (
              <div 
                key={elec.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusBadge status={elec.status} size="sm" />
                    <span className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">{assocName}</span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 line-clamp-2 mb-2">
                    {elec.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                    {elec.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nomination Deadline:</span>
                      <span className="font-medium text-slate-800">{new Date(elec.nomination_end).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Voting Closes:</span>
                      <span className="font-medium text-slate-800">{new Date(elec.voting_end).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eligible Voters:</span>
                      <span className="font-medium text-slate-800">{elec.total_eligible_voters || elec.eligible_employee_ids.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/participant/elections/${elec.id}`)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    View Details
                  </button>
                  {elec.status === 'VOTING_OPEN' ? (
                    <button
                      onClick={() => navigate(`/participant/vote/${elec.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      Cast Ballot Now
                    </button>
                  ) : elec.status === 'RESULTS_PUBLISHED' ? (
                    <button
                      onClick={() => navigate(`/participant/results`)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                    >
                      View Results
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Nominations Stage</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security & Privacy Explanation */}
      <section className="py-12 bg-slate-900 text-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-blue-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold text-lg text-white">Ballot Secrecy & Privacy Architecture</h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            In compliance with democratic election standards, this portal implements strict physical separation between voter participation records and submitted ballot choices. When a vote is confirmed, your identity verifies that a ballot was cast, but the actual candidate selection is encrypted and stored anonymously without any employee or user identifier. Neither association leaders nor platform administrators can inspect who voted for whom.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="border border-slate-800 bg-slate-800/40 p-4 rounded-xl">
              <h5 className="font-semibold text-white text-xs mb-1">Decoupled Tables</h5>
              <p className="text-[11px] text-slate-400">
                Participation is audited independently from ballot content to guarantee individual ballot secrecy.
              </p>
            </div>
            <div className="border border-slate-800 bg-slate-800/40 p-4 rounded-xl">
              <h5 className="font-semibold text-white text-xs mb-1">Atomic Transactions</h5>
              <p className="text-[11px] text-slate-400">
                Duplicate voting attempts are rejected instantly at the backend database boundary.
              </p>
            </div>
            <div className="border border-slate-800 bg-slate-800/40 p-4 rounded-xl">
              <h5 className="font-semibold text-white text-xs mb-1">Tally Sealing</h5>
              <p className="text-[11px] text-slate-400">
                Candidate vote counts are sealed during live voting to prevent bias or early leaks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-semibold text-slate-200">Government Association Voting Portal</div>
            <p className="text-slate-500 max-w-md">
              A prototype demonstration platform using fictional employees, associations, and test ballots. Not certified for binding statutory public elections.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <button onClick={() => navigate('/login')} className="hover:text-white transition">Login</button>
            <button onClick={() => navigate('/register')} className="hover:text-white transition">Register</button>
            <button onClick={() => navigate('/participant/elections')} className="hover:text-white transition">Elections</button>
            <button onClick={() => navigate('/platform-admin/dashboard')} className="hover:text-white transition">Admin Portal</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
