import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RealtimeProvider } from './context/RealtimeContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { DemoSwitcherBar } from './components/common/DemoSwitcherBar.tsx';

// Public Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { PendingApprovalPage } from './pages/PendingApprovalPage.tsx';
import { UnauthorizedPage } from './pages/UnauthorizedPage.tsx';

// Participant Pages
import { ParticipantDashboard } from './pages/participant/ParticipantDashboard.tsx';
import { ParticipantElections } from './pages/participant/ParticipantElections.tsx';
import { ElectionDetailPage } from './pages/participant/ElectionDetailPage.tsx';
import { NominatePage } from './pages/participant/NominatePage.tsx';
import { ParticipantApplications } from './pages/participant/ParticipantApplications.tsx';
import { VotingPage } from './pages/participant/VotingPage.tsx';
import { ParticipantResults } from './pages/participant/ParticipantResults.tsx';
import { ParticipantNotifications } from './pages/participant/ParticipantNotifications.tsx';
import { ParticipantProfile } from './pages/participant/ParticipantProfile.tsx';

// Official Pages
import { OfficialDashboard } from './pages/official/OfficialDashboard.tsx';
import { OfficialElections } from './pages/official/OfficialElections.tsx';
import { CreateElectionPage } from './pages/official/CreateElectionPage.tsx';
import { ManageElectionPage } from './pages/official/ManageElectionPage.tsx';
import { CandidateReviewPage } from './pages/official/CandidateReviewPage.tsx';
import { OfficialResultsPage } from './pages/official/OfficialResultsPage.tsx';
import { OfficialNotifications } from './pages/official/OfficialNotifications.tsx';
import { OfficialProfile } from './pages/official/OfficialProfile.tsx';

// Platform Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { OfficialRequestsPage } from './pages/admin/OfficialRequestsPage.tsx';
import { AssociationsPage } from './pages/admin/AssociationsPage.tsx';
import { DemoManagementPage } from './pages/admin/DemoManagementPage.tsx';

function MainRouter() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-semibold text-slate-600 tracking-wider uppercase">
            Loading Government Voting Portal...
          </div>
        </div>
      </div>
    );
  }

  // Parse path and params
  const url = new URL(window.location.href);
  const path = currentPath.split('?')[0];

  // Route matchers
  const participantElectionDetailMatch = path.match(/^\/participant\/elections\/([^\/]+)$/);
  const participantVoteMatch = path.match(/^\/participant\/vote\/([^\/]+)$/);
  const officialManageMatch = path.match(/^\/official\/elections\/([^\/]+)$/);

  // Authorization guards
  const isOfficial = user?.account_role === 'OFFICIAL';
  const isAdmin = user?.account_role === 'PLATFORM_ADMIN';
  const isPendingOfficial = isOfficial && user?.approval_status === 'PENDING';

  // Guard: Official Routes
  if (path.startsWith('/official')) {
    if (!isAuthenticated) {
      return <LoginPage navigate={navigate} defaultRole="OFFICIAL" />;
    }
    if (isPendingOfficial) {
      return <PendingApprovalPage navigate={navigate} />;
    }
    if (!isOfficial && !isAdmin) {
      return <UnauthorizedPage navigate={navigate} />;
    }
  }

  // Guard: Platform Admin Routes
  if (path.startsWith('/platform-admin')) {
    if (!isAuthenticated) {
      return <LoginPage navigate={navigate} defaultRole="OFFICIAL" />;
    }
    if (!isAdmin) {
      return <UnauthorizedPage navigate={navigate} />;
    }
  }

  // Guard: Participant Routes
  if (path.startsWith('/participant')) {
    if (!isAuthenticated) {
      return <LoginPage navigate={navigate} defaultRole="PARTICIPANT" />;
    }
  }

  const renderContent = () => {
    // Public routes
    if (path === '/') return <LandingPage navigate={navigate} />;
    if (path === '/login') {
      const roleParam = url.searchParams.get('role');
      return <LoginPage navigate={navigate} defaultRole={roleParam === 'OFFICIAL' ? 'OFFICIAL' : 'PARTICIPANT'} />;
    }
    if (path === '/register') return <RegisterPage navigate={navigate} />;
    if (path === '/pending-approval') return <PendingApprovalPage navigate={navigate} />;
    if (path === '/unauthorized') return <UnauthorizedPage navigate={navigate} />;

    // Participant routes
    if (path === '/participant/dashboard') return <ParticipantDashboard navigate={navigate} />;
    if (path === '/participant/elections') return <ParticipantElections navigate={navigate} />;
    if (participantElectionDetailMatch) {
      return <ElectionDetailPage electionId={participantElectionDetailMatch[1]} navigate={navigate} />;
    }
    if (path === '/participant/nominations') {
      return <NominatePage navigate={navigate} initialElectionId={url.searchParams.get('electionId') || undefined} />;
    }
    if (path === '/participant/applications') return <ParticipantApplications navigate={navigate} />;
    if (participantVoteMatch) {
      return <VotingPage electionId={participantVoteMatch[1]} navigate={navigate} />;
    }
    if (path === '/participant/results') {
      return <ParticipantResults navigate={navigate} initialElectionId={url.searchParams.get('electionId') || undefined} />;
    }
    if (path === '/participant/notifications') return <ParticipantNotifications navigate={navigate} />;
    if (path === '/participant/profile') return <ParticipantProfile navigate={navigate} />;

    // Official routes
    if (path === '/official/dashboard') return <OfficialDashboard navigate={navigate} />;
    if (path === '/official/elections') return <OfficialElections navigate={navigate} />;
    if (path === '/official/elections/create') return <CreateElectionPage navigate={navigate} />;
    if (officialManageMatch) {
      return <ManageElectionPage electionId={officialManageMatch[1]} navigate={navigate} />;
    }
    if (path === '/official/candidates') return <CandidateReviewPage navigate={navigate} />;
    if (path === '/official/results') {
      return <OfficialResultsPage navigate={navigate} initialElectionId={url.searchParams.get('electionId') || undefined} />;
    }
    if (path === '/official/notifications') return <OfficialNotifications navigate={navigate} />;
    if (path === '/official/profile') return <OfficialProfile navigate={navigate} />;

    // Platform Admin routes
    if (path === '/platform-admin/dashboard') return <AdminDashboard navigate={navigate} />;
    if (path === '/platform-admin/official-requests') return <OfficialRequestsPage navigate={navigate} />;
    if (path === '/platform-admin/associations') return <AssociationsPage navigate={navigate} />;
    if (path === '/platform-admin/demo-management') return <DemoManagementPage navigate={navigate} />;

    // Fallback: Landing Page
    return <LandingPage navigate={navigate} />;
  };

  const isPublicStandalone = path === '/' || path === '/login' || path === '/register';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Demo Switcher & Status Bar */}
      <DemoSwitcherBar />

      {/* Global Navbar */}
      <Navbar currentPath={path} navigate={navigate} />

      {/* Main Page Area */}
      <main className={`flex-1 ${isPublicStandalone ? '' : 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainRouter />
      </RealtimeProvider>
    </AuthProvider>
  );
}
