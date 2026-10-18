import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api.ts';
import { NotificationItem } from '../../types/index.ts';

interface ParticipantNotificationsProps {
  navigate: (path: string) => void;
}

export const ParticipantNotifications: React.FC<ParticipantNotificationsProps> = ({ navigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const handleClickItem = async (n: NotificationItem) => {
    if (!n.is_read) {
      try {
        await api.markNotificationRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      } catch (err) {}
    }
    if (n.related_election_id) {
      navigate(`/participant/elections/${n.related_election_id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time updates regarding elections, nomination decisions, and voting confirmation
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No notifications on file.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickItem(n)}
              className={`p-4 text-left hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                !n.is_read ? 'bg-blue-50/40' : ''
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-blue-600' : 'bg-transparent'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                {n.related_election_id && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 mt-2">
                    View Election <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
