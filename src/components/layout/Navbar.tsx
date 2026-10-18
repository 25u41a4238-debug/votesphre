import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  CheckCheck, 
  ChevronRight,
  ExternalLink,
  Layers,
  Award,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { api } from '../../lib/api.ts';
import { NotificationItem } from '../../types/index.ts';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, logout, isOfficial, isPlatformAdmin, isParticipant, isAuthenticated } = useAuth();
  const { addListener } = useRealtime();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.notifications.filter(n => !n.is_read).length);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, currentPath]);

  // Real-time listener for new notifications
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (
        event.type === 'ELECTION_PUBLISHED' ||
        event.type === 'VOTE_CAST' ||
        event.type === 'CANDIDATE_APPROVED' ||
        event.type === 'RESULTS_PUBLISHED' ||
        event.type === 'OFFICIAL_APPROVED' ||
        event.type === 'VERIFICATION_UPDATED' ||
        event.type === 'OFFICIAL_REQUEST_SUBMITTED'
      ) {
        fetchNotifications();
      }
    });
    return unsubscribe;
  }, [addListener]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {}
    }
    setNotifPopoverOpen(false);

    if (notif.related_election_id) {
      if (isOfficial) {
        navigate(`/official/elections/${notif.related_election_id}`);
      } else {
        navigate(`/participant/elections/${notif.related_election_id}`);
      }
    } else if (notif.notification_type === 'OFFICIAL_REQUEST' && isPlatformAdmin) {
      navigate('/platform-admin/official-requests');
    }
  };

  const navLinks = () => {
    if (!isAuthenticated) {
      return [
        { label: 'Home', path: '/' },
        { label: 'How It Works', path: '/#how-it-works' },
        { label: 'Elections', path: '/#elections' },
      ];
    }

    if (isPlatformAdmin) {
      return [
        { label: 'Admin Dashboard', path: '/platform-admin/dashboard' },
        { label: 'Official Requests', path: '/platform-admin/official-requests' },
        { label: 'Associations', path: '/platform-admin/associations' },
        { label: 'Demo Management', path: '/platform-admin/demo-management' },
      ];
    }

    if (isOfficial) {
      return [
        { label: 'Dashboard', path: '/official/dashboard' },
        { label: 'Manage Elections', path: '/official/elections' },
        { label: 'Candidate Applications', path: '/official/candidates' },
        { label: 'Results Management', path: '/official/results' },
        { label: 'Official Profile', path: '/official/profile' },
      ];
    }

    // Participant
    return [
      { label: 'Dashboard', path: '/participant/dashboard' },
      { label: 'Elections', path: '/participant/elections' },
      { label: 'My Applications', path: '/participant/applications' },
      { label: 'Official Results', path: '/participant/results' },
      { label: 'My Profile', path: '/participant/profile' },
    ];
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(isAuthenticated ? (isOfficial ? '/official/dashboard' : isPlatformAdmin ? '/platform-admin/dashboard' : '/participant/dashboard') : '/')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md border border-blue-500/30 group-hover:scale-105 transition">
                <Vote className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base tracking-tight leading-tight text-slate-100">
                  Government Association
                </div>
                <div className="text-[11px] font-medium text-blue-300 flex items-center gap-1.5">
                  <span>Voting Portal</span>
                  {user?.account_role && (
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold bg-blue-950 border border-blue-800 text-blue-300">
                      {user.account_role === 'OFFICIAL' ? 'Official Portal' : user.account_role === 'PLATFORM_ADMIN' ? 'Platform Admin' : 'Participant'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks().map((link) => {
              const active = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                    active 
                      ? 'bg-slate-800 text-white shadow-xs' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Notifications, User & Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNotifPopoverOpen(!notifPopoverOpen)}
                    className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifPopoverOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          In-App Notifications ({notifications.length})
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition flex items-start gap-2.5 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                            >
                              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-blue-600' : 'bg-transparent'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-slate-900 truncate">{n.title}</div>
                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2 border-t border-slate-100 text-center">
                        <button
                          onClick={() => {
                            setNotifPopoverOpen(false);
                            navigate(isOfficial ? '/official/notifications' : '/participant/notifications');
                          }}
                          className="text-xs text-blue-700 hover:underline font-semibold"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill & Logout */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-200">{user?.full_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {isOfficial ? 'Election Official' : isPlatformAdmin ? 'Platform Admin' : user?.employee_id || 'Participant'}
                    </div>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-md hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks().map((link) => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {link.label}
            </button>
          ))}
          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-800 mt-2">
              <div className="px-3 py-1 text-xs text-slate-400">
                Signed in as <strong className="text-white">{user?.full_name}</strong> ({user?.account_role})
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-400 font-medium hover:bg-slate-800 rounded-md"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
