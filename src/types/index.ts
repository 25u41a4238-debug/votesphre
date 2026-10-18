export type AccountRole = 'PARTICIPANT' | 'OFFICIAL' | 'PLATFORM_ADMIN';

export type AccountStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED';

export type ElectionStatus = 
  | 'DRAFT'
  | 'NOMINATION_OPEN'
  | 'NOMINATION_CLOSED'
  | 'VOTING_OPEN'
  | 'VOTING_CLOSED'
  | 'RESULTS_PUBLISHED'
  | 'CANCELLED';

export type ApplicationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface Association {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_id: string; // e.g. "EMP-10023"
  full_name: string;
  email: string;
  association_id: string;
  department: string;
  designation: string;
  active: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  contact_number?: string;
  account_role: AccountRole;
  association_id: string;
  employee_id?: string;
  account_status: AccountStatus;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  identity_verified: boolean;
  verification_status: VerificationStatus;
  verification_method?: 'SIMULATED_FACIAL' | 'MANUAL_OFFICIAL_REVIEW';
  created_at: string;
  authorized_association_ids?: string[]; // for officials
}

export interface ElectionPosition {
  id: string;
  election_id: string;
  title: string;
  number_of_seats: number;
  instructions?: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  association_ids: string[];
  positions: ElectionPosition[];
  status: ElectionStatus;
  nomination_start: string;
  nomination_end: string;
  voting_start: string;
  voting_end: string;
  eligibility_requirements: string;
  instructions: string;
  created_by: string;
  created_by_name: string;
  published_at?: string;
  created_at: string;
  eligible_employee_ids: string[];
  // Aggregate stats (calculated on backend)
  total_eligible_voters?: number;
  total_voters_participated?: number;
  approved_candidates_count?: number;
}

export interface CandidateApplication {
  id: string;
  election_id: string;
  position_id: string;
  employee_id: string;
  candidate_name: string;
  statement_of_purpose: string;
  qualifications: string;
  required_declarations: boolean;
  status: ApplicationStatus;
  rejection_reason?: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface Candidate {
  id: string;
  election_id: string;
  position_id: string;
  employee_id: string;
  candidate_name: string;
  statement_of_purpose: string;
  qualifications: string;
  application_id: string;
  approval_status: 'APPROVED';
}

export interface VoterParticipation {
  id: string;
  election_id: string;
  position_id: string;
  employee_id: string;
  submitted_at: string;
  confirmation_reference: string;
}

export interface CandidateResult {
  candidate_id: string;
  candidate_name: string;
  position_id: string;
  votes: number;
  vote_percentage: number;
  is_winner?: boolean;
}

export interface ElectionResult {
  id: string;
  election_id: string;
  position_id: string;
  candidate_results: CandidateResult[];
  total_valid_ballots: number;
  total_eligible: number;
  turnout_percentage: number;
  published_at: string;
  published_by: string;
  published_by_name: string;
  status: 'PUBLISHED';
}

export interface NotificationItem {
  id: string;
  recipient_user_id?: string;
  recipient_role?: AccountRole;
  title: string;
  message: string;
  notification_type: 
    | 'REGISTRATION'
    | 'VERIFICATION'
    | 'ELECTION_PUBLISHED'
    | 'NOMINATION_SUBMITTED'
    | 'APPLICATION_DECISION'
    | 'VOTING_OPENED'
    | 'VOTE_CONFIRMED'
    | 'VOTING_CLOSED'
    | 'RESULTS_PUBLISHED'
    | 'OFFICIAL_REQUEST';
  related_election_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ManualVerificationRequest {
  id: string;
  user_id: string;
  employee_id: string;
  full_name: string;
  association_id: string;
  reason: string;
  document_type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  details: string;
}
