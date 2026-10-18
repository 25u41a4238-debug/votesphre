import React from 'react';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface UnauthorizedPageProps {
  navigate: (path: string) => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ navigate }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900">Access Denied (403)</h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You do not possess the required administrative clearance or role to access this area. Access is protected by backend-enforced role authorization.
        </p>

        <div className="pt-4 flex flex-col gap-2">
          <button
            onClick={() => {
              if (user?.account_role === 'OFFICIAL') navigate('/official/dashboard');
              else if (user?.account_role === 'PLATFORM_ADMIN') navigate('/platform-admin/dashboard');
              else navigate('/participant/dashboard');
            }}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            Return to Authorized Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
