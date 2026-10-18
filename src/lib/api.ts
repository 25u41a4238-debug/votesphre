import { 
  Association, 
  Employee, 
  UserProfile, 
  Election, 
  CandidateApplication, 
  Candidate, 
  ElectionResult, 
  NotificationItem, 
  ManualVerificationRequest,
  AuditLogItem 
} from '../types/index.ts';

const TOKEN_KEY = 'gov_voting_portal_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ token: string; user: UserProfile }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (payload: any) => request<{ token: string; user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getMe: () => request<{ user: UserProfile }>('/api/auth/me'),
  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  switchDemo: (userId: string) => request<{ token: string; user: UserProfile }>('/api/auth/switch-demo', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),

  // Associations & Employees
  getAssociations: () => request<{ associations: Association[] }>('/api/associations'),
  createAssociation: (payload: any) => request<{ association: Association }>('/api/associations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  toggleAssociation: (id: string) => request<{ association: Association }>(`/api/associations/${id}/toggle`, {
    method: 'PATCH',
  }),
  getEmployees: (associationId?: string) => {
    const query = associationId ? `?association_id=${encodeURIComponent(associationId)}` : '';
    return request<{ employees: Employee[] }>(`/api/employees${query}`);
  },
  verifyEmployeeId: (employee_id: string, association_id?: string) => 
    request<{ eligible: boolean; employee?: Employee; reason?: string }>('/api/employees/verify-id', {
      method: 'POST',
      body: JSON.stringify({ employee_id, association_id }),
    }),

  // Verification
  simulateVerification: (simulate_success: boolean, employee_id: string) =>
    request<{ success: boolean; status: string; error?: string }>('/api/verification/simulate', {
      method: 'POST',
      body: JSON.stringify({ simulate_success, employee_id }),
    }),
  requestManualVerification: (payload: { employee_id: string; reason: string; document_type: string }) =>
    request<{ success: boolean; request: ManualVerificationRequest }>('/api/verification/request-manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getVerificationRequests: () => request<{ requests: ManualVerificationRequest[] }>('/api/verification/requests'),
  reviewVerificationRequest: (id: string, status: 'APPROVED' | 'REJECTED') =>
    request<{ request: ManualVerificationRequest }>(`/api/verification/requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  // Elections
  getElections: () => request<{ elections: Election[] }>('/api/elections'),
  getElection: (id: string) => request<{
    election: Election;
    candidates: Candidate[];
    isEligible: boolean;
    hasVoted: boolean;
    participationRecords: any[];
  }>(`/api/elections/${id}`),
  createElection: (payload: any) => request<{ election: Election }>('/api/elections', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateElection: (id: string, payload: any) => request<{ election: Election }>(`/api/elections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  publishElection: (id: string) => request<{ election: Election }>(`/api/elections/${id}/publish`, {
    method: 'POST',
  }),
  closeVoting: (id: string) => request<{ election: Election }>(`/api/elections/${id}/close-voting`, {
    method: 'POST',
  }),

  // Candidate applications
  getElectionApplications: (electionId: string) => 
    request<{ applications: CandidateApplication[] }>(`/api/elections/${electionId}/applications`),
  getParticipantApplications: () => 
    request<{ applications: CandidateApplication[] }>('/api/participant/applications'),
  submitApplication: (electionId: string, payload: any) =>
    request<{ application: CandidateApplication }>(`/api/elections/${electionId}/applications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  reviewApplication: (applicationId: string, payload: { decision: 'APPROVE' | 'REJECT'; rejection_reason?: string }) =>
    request<{ application: CandidateApplication; candidate?: Candidate }>(`/api/applications/${applicationId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  withdrawApplication: (applicationId: string) =>
    request<{ application: CandidateApplication }>(`/api/applications/${applicationId}/withdraw`, {
      method: 'POST',
    }),

  // Voting
  castVote: (electionId: string, payload: { position_id: string; candidate_id: string }) =>
    request<{ success: boolean; confirmationReference: string; submitted_at: string }>(`/api/elections/${electionId}/vote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Results
  getResults: (electionId: string) => request<{
    published: boolean;
    results?: ElectionResult[];
    preview?: any[];
    can_publish?: boolean;
    voting_is_open?: boolean;
    message?: string;
    election?: Election;
  }>(`/api/elections/${electionId}/results`),
  publishResults: (electionId: string) => request<{ success: boolean; results: ElectionResult[] }>(`/api/elections/${electionId}/publish-results`, {
    method: 'POST',
  }),

  // Notifications
  getNotifications: () => request<{ notifications: NotificationItem[] }>('/api/notifications'),
  markNotificationRead: (id: string) => request<{ notification: NotificationItem }>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/api/notifications/read-all', {
    method: 'POST',
  }),

  // Admin & Audit
  getOfficialRequests: () => request<{ requests: UserProfile[] }>('/api/admin/official-requests'),
  reviewOfficialRequest: (id: string, payload: { decision: 'APPROVE' | 'REJECT'; authorized_association_ids?: string[] }) =>
    request<{ success: boolean; status: string }>(`/api/admin/official-requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAuditLogs: () => request<{ logs: AuditLogItem[] }>('/api/admin/audit-logs'),
  resetDemoData: () => request<{ success: boolean; message: string }>('/api/admin/reset-demo', {
    method: 'POST',
  }),
};
