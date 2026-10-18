import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.tsx';

interface RealtimeContextType {
  connected: boolean;
  lastEvent: { type: string; payload?: any; timestamp: number } | null;
  addListener: (callback: (event: { type: string; payload?: any }) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, refreshUser } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload?: any; timestamp: number } | null>(null);
  const listenersRef = useRef<Set<(event: any) => void>>(new Set());

  const addListener = useCallback((callback: (event: any) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        eventSource = new EventSource('/api/realtime/stream');

        eventSource.onopen = () => {
          setConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEvent({ ...data, timestamp: Date.now() });

            // Notify all registered listeners
            listenersRef.current.forEach(fn => fn(data));

            // If user's own status changed, refresh profile
            if (data.type === 'OFFICIAL_APPROVED' || data.type === 'VERIFICATION_UPDATED') {
              refreshUser();
            }
          } catch (err) {
            console.error('SSE JSON parse error:', err);
          }
        };

        eventSource.onerror = () => {
          setConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Exponential backoff or simple reconnect after 3s
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [token, refreshUser]);

  return (
    <RealtimeContext.Provider value={{ connected, lastEvent, addListener }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
