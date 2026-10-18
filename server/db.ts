import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  Association, 
  Employee, 
  UserProfile, 
  Election, 
  CandidateApplication, 
  Candidate, 
  VoterParticipation, 
  ElectionResult, 
  NotificationItem, 
  ManualVerificationRequest,
  AuditLogItem 
} from '../src/types/index.ts';

// Separate ballot table strictly anonymized
export interface StoredBallot {
  id: string;
  election_id: string;
  position_id: string;
  candidate_id: string;
  ballot_reference: string;
  submitted_at: string;
}

export interface StoredUser extends UserProfile {
  password_hash: string;
  password_salt: string;
}

export interface DatabaseSchema {
  associations: Association[];
  employees: Employee[];
  users: StoredUser[];
  elections: Election[];
  candidate_applications: CandidateApplication[];
  candidates: Candidate[];
  voter_participation: VoterParticipation[];
  ballots: StoredBallot[];
  election_results: ElectionResult[];
  notifications: NotificationItem[];
  verification_requests: ManualVerificationRequest[];
  audit_logs: AuditLogItem[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Password helper using PBKDF2
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return check === hash;
}

function getInitialSeedData(): DatabaseSchema {
  const associations: Association[] = [
    {
      id: 'assoc-1',
      name: 'Government Employees Association',
      code: 'GEA',
      description: 'Representing central and regional administrative government civil servants.',
      active: true,
      created_at: new Date(Date.now() - 365 * 86400000).toISOString()
    },
    {
      id: 'assoc-2',
      name: 'Teachers Association',
      code: 'TA',
      description: 'Professional body representing certified public educators and school administrators.',
      active: true,
      created_at: new Date(Date.now() - 300 * 86400000).toISOString()
    },
    {
      id: 'assoc-3',
      name: 'Municipal Employees Association',
      code: 'MEA',
      description: 'Organizing urban municipal workers, local authorities, and service personnel.',
      active: true,
      created_at: new Date(Date.now() - 250 * 86400000).toISOString()
    },
    {
      id: 'assoc-4',
      name: 'Public Health Employees Association',
      code: 'PHEA',
      description: 'Dedicated to medical officers, nurses, healthcare inspectors, and clinical staff.',
      active: true,
      created_at: new Date(Date.now() - 200 * 86400000).toISOString()
    },
    {
      id: 'assoc-5',
      name: 'Engineering Employees Association',
      code: 'EEA',
      description: 'Advancing professional standards for public infrastructure, civil, and electrical engineers.',
      active: true,
      created_at: new Date(Date.now() - 180 * 86400000).toISOString()
    }
  ];

  const employees: Employee[] = [
    // GEA employees
    { id: 'emp-1', employee_id: 'EMP-10023', full_name: 'Jane Doe', email: 'jane.doe@gov-portal.demo', association_id: 'assoc-1', department: 'Public Administration', designation: 'Senior Policy Analyst', active: true },
    { id: 'emp-2', employee_id: 'EMP-10045', full_name: 'Marcus Chen', email: 'marcus.chen@gov-portal.demo', association_id: 'assoc-1', department: 'Revenue & Audit', designation: 'Principal Officer', active: true },
    { id: 'emp-3', employee_id: 'EMP-10078', full_name: 'Elena Rostova', email: 'elena.rostova@gov-portal.demo', association_id: 'assoc-1', department: 'Judicial Services', designation: 'Senior Legal Officer', active: true },
    { id: 'emp-4', employee_id: 'EMP-10099', full_name: 'Samuel Osei', email: 'samuel.osei@gov-portal.demo', association_id: 'assoc-1', department: 'Transportation Oversight', designation: 'Operations Lead', active: true },
    
    // Teachers Association
    { id: 'emp-5', employee_id: 'EMP-20011', full_name: 'Sarah Jenkins', email: 'sarah.jenkins@gov-portal.demo', association_id: 'assoc-2', department: 'Secondary Education', designation: 'Department Head', active: true },
    { id: 'emp-6', employee_id: 'EMP-20034', full_name: 'Carlos Mendez', email: 'carlos.mendez@gov-portal.demo', association_id: 'assoc-2', department: 'STEM Curriculum', designation: 'Lead Science Educator', active: true },
    { id: 'emp-7', employee_id: 'EMP-20082', full_name: 'Priya Sharma', email: 'priya.sharma@gov-portal.demo', association_id: 'assoc-2', department: 'Special Education', designation: 'Instructional Specialist', active: true },

    // Municipal Employees
    { id: 'emp-8', employee_id: 'EMP-30088', full_name: 'David Miller', email: 'david.miller@gov-portal.demo', association_id: 'assoc-3', department: 'Urban Planning', designation: 'Zoning Supervisor', active: true },
    { id: 'emp-9', employee_id: 'EMP-30104', full_name: 'Fatima Al-Mansoor', email: 'fatima.m@gov-portal.demo', association_id: 'assoc-3', department: 'Public Works', designation: 'Maintenance Director', active: true },

    // Public Health
    { id: 'emp-10', employee_id: 'EMP-40015', full_name: 'Dr. Gregory House', email: 'greg.h@gov-portal.demo', association_id: 'assoc-4', department: 'Epidemiology', designation: 'Chief Medical Specialist', active: true },
    { id: 'emp-11', employee_id: 'EMP-40042', full_name: 'Amina Diallo', email: 'amina.d@gov-portal.demo', association_id: 'assoc-4', department: 'Community Health', designation: 'Supervising Nurse Practitioner', active: true },

    // Engineering
    { id: 'emp-12', employee_id: 'EMP-50009', full_name: 'Hiroshi Tanaka', email: 'tanaka.h@gov-portal.demo', association_id: 'assoc-5', department: 'Civil Infrastructure', designation: 'Principal Structural Engineer', active: true },
    { id: 'emp-13', employee_id: 'EMP-50033', full_name: 'Rachel Adams', email: 'rachel.a@gov-portal.demo', association_id: 'assoc-5', department: 'Water & Environmental', designation: 'Project Manager', active: true }
  ];

  // Default Passwords for demo: "Demo123!"
  const demoPass = hashPassword('Demo123!');
  const adminPass = hashPassword('Admin123!');
  const officialPass = hashPassword('Official123!');

  const users: StoredUser[] = [
    {
      id: 'usr-admin',
      email: 'admin@gov-portal.demo',
      password_hash: adminPass.hash,
      password_salt: adminPass.salt,
      full_name: 'Chief Commissioner Sterling',
      account_role: 'PLATFORM_ADMIN',
      association_id: 'assoc-1',
      account_status: 'ACTIVE',
      approval_status: 'APPROVED',
      identity_verified: true,
      verification_status: 'VERIFIED',
      verification_method: 'MANUAL_OFFICIAL_REVIEW',
      created_at: new Date(Date.now() - 100 * 86400000).toISOString()
    },
    {
      id: 'usr-official-1',
      email: 'official@gov-portal.demo',
      password_hash: officialPass.hash,
      password_salt: officialPass.salt,
      full_name: 'Electoral Officer Davis',
      account_role: 'OFFICIAL',
      association_id: 'assoc-1',
      account_status: 'ACTIVE',
      approval_status: 'APPROVED',
      authorized_association_ids: ['assoc-1', 'assoc-2', 'assoc-3', 'assoc-4', 'assoc-5'], // Authorized for all demo associations
      identity_verified: true,
      verification_status: 'VERIFIED',
      verification_method: 'MANUAL_OFFICIAL_REVIEW',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      id: 'usr-official-pending',
      email: 'pending.official@gov-portal.demo',
      password_hash: demoPass.hash,
      password_salt: demoPass.salt,
      full_name: 'Candidate Official Morales',
      account_role: 'OFFICIAL',
      association_id: 'assoc-3',
      account_status: 'PENDING',
      approval_status: 'PENDING',
      authorized_association_ids: [],
      identity_verified: false,
      verification_status: 'PENDING_REVIEW',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'usr-part-1',
      email: 'jane.doe@gov-portal.demo',
      password_hash: demoPass.hash,
      password_salt: demoPass.salt,
      full_name: 'Jane Doe',
      account_role: 'PARTICIPANT',
      association_id: 'assoc-1',
      employee_id: 'EMP-10023',
      account_status: 'ACTIVE',
      approval_status: 'APPROVED',
      identity_verified: true,
      verification_status: 'VERIFIED',
      verification_method: 'SIMULATED_FACIAL',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'usr-part-2',
      email: 'marcus.chen@gov-portal.demo',
      password_hash: demoPass.hash,
      password_salt: demoPass.salt,
      full_name: 'Marcus Chen',
      account_role: 'PARTICIPANT',
      association_id: 'assoc-1',
      employee_id: 'EMP-10045',
      account_status: 'ACTIVE',
      approval_status: 'APPROVED',
      identity_verified: true,
      verification_status: 'VERIFIED',
      verification_method: 'SIMULATED_FACIAL',
      created_at: new Date(Date.now() - 50 * 86400000).toISOString()
    },
    {
      id: 'usr-part-3',
      email: 'sarah.jenkins@gov-portal.demo',
      password_hash: demoPass.hash,
      password_salt: demoPass.salt,
      full_name: 'Sarah Jenkins',
      account_role: 'PARTICIPANT',
      association_id: 'assoc-2',
      employee_id: 'EMP-20011',
      account_status: 'ACTIVE',
      approval_status: 'APPROVED',
      identity_verified: false,
      verification_status: 'UNVERIFIED',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'usr-part-4',
      email: 'david.miller@gov-portal.demo',
      password_hash: demoPass.hash,
      password_salt: demoPass.salt,
      full_name: 'David Miller',
      account_role: 'PARTICIPANT',
      association_id: 'assoc-3',
      employee_id: 'EMP-30088',
      account_status: 'ACTIVE',
      approval_status: 'APPROVED',
      identity_verified: true,
      verification_status: 'VERIFIED',
      verification_method: 'SIMULATED_FACIAL',
      created_at: new Date(Date.now() - 40 * 86400000).toISOString()
    }
  ];

  const now = Date.now();
  const dayMs = 86400000;

  // 4 Elections across states:
  // 1. VOTING_OPEN
  // 2. NOMINATION_OPEN
  // 3. RESULTS_PUBLISHED
  // 4. DRAFT
  const elections: Election[] = [
    {
      id: 'elec-gea-2026',
      title: '2026 GEA Executive Council Election',
      description: 'Official general election for President and General Secretary of the Government Employees Association.',
      association_ids: ['assoc-1'],
      positions: [
        {
          id: 'pos-gea-pres',
          election_id: 'elec-gea-2026',
          title: 'Association President',
          number_of_seats: 1,
          instructions: 'Select one candidate to lead the executive council and represent civil servant interests.'
        }
      ],
      status: 'VOTING_OPEN',
      nomination_start: new Date(now - 14 * dayMs).toISOString(),
      nomination_end: new Date(now - 5 * dayMs).toISOString(),
      voting_start: new Date(now - 2 * dayMs).toISOString(),
      voting_end: new Date(now + 3 * dayMs).toISOString(),
      eligibility_requirements: 'Must be an active permanent civil servant registered under GEA with minimum 1 year of service.',
      instructions: 'Electronic voting is confidential. Each eligible employee may cast exactly one vote.',
      created_by: 'usr-official-1',
      created_by_name: 'Electoral Officer Davis',
      published_at: new Date(now - 15 * dayMs).toISOString(),
      created_at: new Date(now - 20 * dayMs).toISOString(),
      eligible_employee_ids: ['EMP-10023', 'EMP-10045', 'EMP-10078', 'EMP-10099'],
      total_eligible_voters: 4,
      total_voters_participated: 1,
      approved_candidates_count: 2
    },
    {
      id: 'elec-ta-welfare',
      title: 'Teachers Association Welfare Committee Representative',
      description: 'Nominate and elect teachers representative for provincial education welfare board.',
      association_ids: ['assoc-2'],
      positions: [
        {
          id: 'pos-ta-rep',
          election_id: 'elec-ta-welfare',
          title: 'Welfare Committee Delegate',
          number_of_seats: 1,
          instructions: 'Cast vote for the delegate representing certified educators.'
        }
      ],
      status: 'NOMINATION_OPEN',
      nomination_start: new Date(now - 3 * dayMs).toISOString(),
      nomination_end: new Date(now + 4 * dayMs).toISOString(),
      voting_start: new Date(now + 6 * dayMs).toISOString(),
      voting_end: new Date(now + 10 * dayMs).toISOString(),
      eligibility_requirements: 'Certified teachers belonging to the Teachers Association with active school posting.',
      instructions: 'Nominations are actively being received. Verified members may submit their candidacy proposals.',
      created_by: 'usr-official-1',
      created_by_name: 'Electoral Officer Davis',
      published_at: new Date(now - 4 * dayMs).toISOString(),
      created_at: new Date(now - 5 * dayMs).toISOString(),
      eligible_employee_ids: ['EMP-20011', 'EMP-20034', 'EMP-20082'],
      total_eligible_voters: 3,
      total_voters_participated: 0,
      approved_candidates_count: 1
    },
    {
      id: 'elec-mea-2025',
      title: 'Municipal Employees Association Annual Representative Election',
      description: 'Concluded official election for Urban Municipal Workers Oversight Council.',
      association_ids: ['assoc-3'],
      positions: [
        {
          id: 'pos-mea-lead',
          election_id: 'elec-mea-2025',
          title: 'Municipal Council Chair',
          number_of_seats: 1,
          instructions: 'Single representative seat.'
        }
      ],
      status: 'RESULTS_PUBLISHED',
      nomination_start: new Date(now - 30 * dayMs).toISOString(),
      nomination_end: new Date(now - 20 * dayMs).toISOString(),
      voting_start: new Date(now - 15 * dayMs).toISOString(),
      voting_end: new Date(now - 5 * dayMs).toISOString(),
      eligibility_requirements: 'All confirmed municipal staff members.',
      instructions: 'Final certified results published by the Board of Scrutineers.',
      created_by: 'usr-admin',
      created_by_name: 'Chief Commissioner Sterling',
      published_at: new Date(now - 35 * dayMs).toISOString(),
      created_at: new Date(now - 40 * dayMs).toISOString(),
      eligible_employee_ids: ['EMP-30088', 'EMP-30104'],
      total_eligible_voters: 2,
      total_voters_participated: 2,
      approved_candidates_count: 2
    },
    {
      id: 'elec-phea-draft',
      title: 'Public Health Clinical Officers Board (Draft)',
      description: 'Upcoming election for clinical standards representative. Currently in configuration.',
      association_ids: ['assoc-4'],
      positions: [
        {
          id: 'pos-phea-officer',
          election_id: 'elec-phea-draft',
          title: 'Clinical Standards Representative',
          number_of_seats: 1,
          instructions: 'Draft stage.'
        }
      ],
      status: 'DRAFT',
      nomination_start: new Date(now + 5 * dayMs).toISOString(),
      nomination_end: new Date(now + 12 * dayMs).toISOString(),
      voting_start: new Date(now + 14 * dayMs).toISOString(),
      voting_end: new Date(now + 20 * dayMs).toISOString(),
      eligibility_requirements: 'Clinical and nursing personnel of PHEA.',
      instructions: 'Draft instructions under administrative review.',
      created_by: 'usr-admin',
      created_by_name: 'Chief Commissioner Sterling',
      created_at: new Date(now - 1 * dayMs).toISOString(),
      eligible_employee_ids: ['EMP-40015', 'EMP-40042'],
      total_eligible_voters: 2,
      total_voters_participated: 0,
      approved_candidates_count: 0
    }
  ];

  // Candidates & Applications
  const candidate_applications: CandidateApplication[] = [
    // GEA Candidates
    {
      id: 'app-1',
      election_id: 'elec-gea-2026',
      position_id: 'pos-gea-pres',
      employee_id: 'EMP-10045',
      candidate_name: 'Marcus Chen',
      statement_of_purpose: 'Advocate for modern workplace flexibility, career progression ladders, and modernized benefits for civil servants.',
      qualifications: '14 years service in Revenue & Audit. Master of Public Administration.',
      required_declarations: true,
      status: 'APPROVED',
      submitted_at: new Date(now - 10 * dayMs).toISOString(),
      reviewed_by: 'usr-official-1',
      reviewed_at: new Date(now - 8 * dayMs).toISOString()
    },
    {
      id: 'app-2',
      election_id: 'elec-gea-2026',
      position_id: 'pos-gea-pres',
      employee_id: 'EMP-10078',
      candidate_name: 'Elena Rostova',
      statement_of_purpose: 'Dedication to transparent arbitration, judicial fairness, and legal advocacy for all government employees.',
      qualifications: 'Senior Legal Officer, 11 years in Judicial Services. LLM in Labor Law.',
      required_declarations: true,
      status: 'APPROVED',
      submitted_at: new Date(now - 9 * dayMs).toISOString(),
      reviewed_by: 'usr-official-1',
      reviewed_at: new Date(now - 8 * dayMs).toISOString()
    },
    {
      id: 'app-3',
      election_id: 'elec-gea-2026',
      position_id: 'pos-gea-pres',
      employee_id: 'EMP-10099',
      candidate_name: 'Samuel Osei',
      statement_of_purpose: 'Modern infrastructure and mental health support for logistics teams.',
      qualifications: 'Operations Lead, Transportation Oversight.',
      required_declarations: true,
      status: 'REJECTED',
      rejection_reason: 'Incomplete documentation of departmental seniority requirements for presidential nominations.',
      submitted_at: new Date(now - 7 * dayMs).toISOString(),
      reviewed_by: 'usr-official-1',
      reviewed_at: new Date(now - 6 * dayMs).toISOString()
    },
    // Teachers Association Application
    {
      id: 'app-4',
      election_id: 'elec-ta-welfare',
      position_id: 'pos-ta-rep',
      employee_id: 'EMP-20034',
      candidate_name: 'Carlos Mendez',
      statement_of_purpose: 'Enhance classroom resources, grant funding for STEM projects, and teacher wellness retreats.',
      qualifications: 'Lead Science Educator with 9 years classroom excellence.',
      required_declarations: true,
      status: 'APPROVED',
      submitted_at: new Date(now - 2 * dayMs).toISOString(),
      reviewed_by: 'usr-official-1',
      reviewed_at: new Date(now - 1 * dayMs).toISOString()
    },
    {
      id: 'app-5',
      election_id: 'elec-ta-welfare',
      position_id: 'pos-ta-rep',
      employee_id: 'EMP-20082',
      candidate_name: 'Priya Sharma',
      statement_of_purpose: 'Champion inclusive curriculum, special education staffing, and fair duty allowances.',
      qualifications: 'Instructional Specialist, 8 years dedicated education advocacy.',
      required_declarations: true,
      status: 'PENDING',
      submitted_at: new Date(now - 1 * dayMs).toISOString()
    },
    // Municipal Election Completed Applications
    {
      id: 'app-6',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      employee_id: 'EMP-30088',
      candidate_name: 'David Miller',
      statement_of_purpose: 'Equitable zone planning, safety equipment upgrades, and municipal worker pensions.',
      qualifications: 'Zoning Supervisor, 16 years experience in municipal engineering.',
      required_declarations: true,
      status: 'APPROVED',
      submitted_at: new Date(now - 28 * dayMs).toISOString(),
      reviewed_by: 'usr-admin',
      reviewed_at: new Date(now - 26 * dayMs).toISOString()
    },
    {
      id: 'app-7',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      employee_id: 'EMP-30104',
      candidate_name: 'Fatima Al-Mansoor',
      statement_of_purpose: 'Focus on public works safety protocols, apprentice programs, and green municipal services.',
      qualifications: 'Maintenance Director, Certified City Planner.',
      required_declarations: true,
      status: 'APPROVED',
      submitted_at: new Date(now - 27 * dayMs).toISOString(),
      reviewed_by: 'usr-admin',
      reviewed_at: new Date(now - 26 * dayMs).toISOString()
    }
  ];

  const candidates: Candidate[] = [
    {
      id: 'cand-1',
      election_id: 'elec-gea-2026',
      position_id: 'pos-gea-pres',
      employee_id: 'EMP-10045',
      candidate_name: 'Marcus Chen',
      statement_of_purpose: 'Advocate for modern workplace flexibility, career progression ladders, and modernized benefits for civil servants.',
      qualifications: '14 years service in Revenue & Audit. Master of Public Administration.',
      application_id: 'app-1',
      approval_status: 'APPROVED'
    },
    {
      id: 'cand-2',
      election_id: 'elec-gea-2026',
      position_id: 'pos-gea-pres',
      employee_id: 'EMP-10078',
      candidate_name: 'Elena Rostova',
      statement_of_purpose: 'Dedication to transparent arbitration, judicial fairness, and legal advocacy for all government employees.',
      qualifications: 'Senior Legal Officer, 11 years in Judicial Services. LLM in Labor Law.',
      application_id: 'app-2',
      approval_status: 'APPROVED'
    },
    {
      id: 'cand-3',
      election_id: 'elec-ta-welfare',
      position_id: 'pos-ta-rep',
      employee_id: 'EMP-20034',
      candidate_name: 'Carlos Mendez',
      statement_of_purpose: 'Enhance classroom resources, grant funding for STEM projects, and teacher wellness retreats.',
      qualifications: 'Lead Science Educator with 9 years classroom excellence.',
      application_id: 'app-4',
      approval_status: 'APPROVED'
    },
    {
      id: 'cand-4',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      employee_id: 'EMP-30088',
      candidate_name: 'David Miller',
      statement_of_purpose: 'Equitable zone planning, safety equipment upgrades, and municipal worker pensions.',
      qualifications: 'Zoning Supervisor, 16 years experience in municipal engineering.',
      application_id: 'app-6',
      approval_status: 'APPROVED'
    },
    {
      id: 'cand-5',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      employee_id: 'EMP-30104',
      candidate_name: 'Fatima Al-Mansoor',
      statement_of_purpose: 'Focus on public works safety protocols, apprentice programs, and green municipal services.',
      qualifications: 'Maintenance Director, Certified City Planner.',
      application_id: 'app-7',
      approval_status: 'APPROVED'
    }
  ];

  // Participation records for demo
  // Note: NO candidate selection in participation table!
  const voter_participation: VoterParticipation[] = [
    // GEA election: EMP-10045 (Marcus) has cast his vote
    {
      id: 'part-1',
      election_id: 'elec-gea-2026',
      position_id: 'pos-gea-pres',
      employee_id: 'EMP-10045',
      submitted_at: new Date(now - 1 * dayMs).toISOString(),
      confirmation_reference: 'GOV-VOTE-2026-X89F2A'
    },
    // MEA election: EMP-30088 & EMP-30104 both voted
    {
      id: 'part-2',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      employee_id: 'EMP-30088',
      submitted_at: new Date(now - 10 * dayMs).toISOString(),
      confirmation_reference: 'GOV-VOTE-2025-M33B91'
    },
    {
      id: 'part-3',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      employee_id: 'EMP-30104',
      submitted_at: new Date(now - 9 * dayMs).toISOString(),
      confirmation_reference: 'GOV-VOTE-2025-N44C82'
    }
  ];

  // Anonymized Ballots table (NO employee_id or voter reference)
  const ballots: StoredBallot[] = [
    {
      id: 'bal-1',
      election_id: 'elec-gea-2026',
      position_id: 'pos-gea-pres',
      candidate_id: 'cand-1',
      ballot_reference: crypto.randomBytes(16).toString('hex'),
      submitted_at: new Date(now - 1 * dayMs + 120000).toISOString()
    },
    {
      id: 'bal-2',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      candidate_id: 'cand-4',
      ballot_reference: crypto.randomBytes(16).toString('hex'),
      submitted_at: new Date(now - 10 * dayMs + 45000).toISOString()
    },
    {
      id: 'bal-3',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      candidate_id: 'cand-4',
      ballot_reference: crypto.randomBytes(16).toString('hex'),
      submitted_at: new Date(now - 9 * dayMs + 90000).toISOString()
    }
  ];

  // Published Results for MEA election
  const election_results: ElectionResult[] = [
    {
      id: 'res-mea-2025',
      election_id: 'elec-mea-2025',
      position_id: 'pos-mea-lead',
      candidate_results: [
        {
          candidate_id: 'cand-4',
          candidate_name: 'David Miller',
          position_id: 'pos-mea-lead',
          votes: 2,
          vote_percentage: 100,
          is_winner: true
        },
        {
          candidate_id: 'cand-5',
          candidate_name: 'Fatima Al-Mansoor',
          position_id: 'pos-mea-lead',
          votes: 0,
          vote_percentage: 0,
          is_winner: false
        }
      ],
      total_valid_ballots: 2,
      total_eligible: 2,
      turnout_percentage: 100,
      published_at: new Date(now - 4 * dayMs).toISOString(),
      published_by: 'usr-admin',
      published_by_name: 'Chief Commissioner Sterling',
      status: 'PUBLISHED'
    }
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      recipient_user_id: 'usr-part-1',
      title: 'Voting Open: 2026 GEA Executive Council Election',
      message: 'The official voting window is now open. Please complete identity verification and submit your vote before the deadline.',
      notification_type: 'VOTING_OPENED',
      related_election_id: 'elec-gea-2026',
      is_read: false,
      created_at: new Date(now - 2 * dayMs).toISOString()
    },
    {
      id: 'notif-2',
      recipient_role: 'OFFICIAL',
      title: 'New Candidate Application Submitted',
      message: 'Priya Sharma has submitted a nomination application for Teachers Association Welfare Committee Representative.',
      notification_type: 'NOMINATION_SUBMITTED',
      related_election_id: 'elec-ta-welfare',
      is_read: false,
      created_at: new Date(now - 1 * dayMs).toISOString()
    },
    {
      id: 'notif-3',
      recipient_user_id: 'usr-part-2',
      title: 'Ballot Submission Recorded',
      message: 'Your anonymous ballot for 2026 GEA Executive Council Election has been confirmed. Confirmation Reference: GOV-VOTE-2026-X89F2A.',
      notification_type: 'VOTE_CONFIRMED',
      related_election_id: 'elec-gea-2026',
      is_read: true,
      created_at: new Date(now - 1 * dayMs).toISOString()
    },
    {
      id: 'notif-4',
      recipient_role: 'PLATFORM_ADMIN',
      title: 'Pending Election Official Approval Request',
      message: 'Candidate Official Morales has requested Election Official authorization for Municipal Employees Association.',
      notification_type: 'OFFICIAL_REQUEST',
      is_read: false,
      created_at: new Date(now - 1 * dayMs).toISOString()
    }
  ];

  const verification_requests: ManualVerificationRequest[] = [
    {
      id: 'vr-1',
      user_id: 'usr-part-3',
      employee_id: 'EMP-20011',
      full_name: 'Sarah Jenkins',
      association_id: 'assoc-2',
      reason: 'Low camera light during simulated facial check. Official photo ID and employee service letter submitted.',
      document_type: 'Government Employee Service Card & National ID',
      status: 'PENDING',
      created_at: new Date(now - 1 * dayMs).toISOString()
    }
  ];

  const audit_logs: AuditLogItem[] = [
    {
      id: 'aud-1',
      actor_user_id: 'usr-official-1',
      actor_name: 'Electoral Officer Davis',
      actor_role: 'OFFICIAL',
      action: 'PUBLISH_ELECTION',
      entity_type: 'ELECTION',
      entity_id: 'elec-gea-2026',
      timestamp: new Date(now - 15 * dayMs).toISOString(),
      details: 'Published 2026 GEA Executive Council Election with 4 eligible employees.'
    },
    {
      id: 'aud-2',
      actor_user_id: 'usr-official-1',
      actor_name: 'Electoral Officer Davis',
      actor_role: 'OFFICIAL',
      action: 'APPROVE_CANDIDATE',
      entity_type: 'CANDIDATE_APPLICATION',
      entity_id: 'app-1',
      timestamp: new Date(now - 8 * dayMs).toISOString(),
      details: 'Approved candidate application for Marcus Chen (EMP-10045).'
    },
    {
      id: 'aud-3',
      actor_user_id: 'usr-admin',
      actor_name: 'Chief Commissioner Sterling',
      actor_role: 'PLATFORM_ADMIN',
      action: 'PUBLISH_RESULTS',
      entity_type: 'ELECTION_RESULTS',
      entity_id: 'elec-mea-2025',
      timestamp: new Date(now - 4 * dayMs).toISOString(),
      details: 'Certified and published official results for MEA Annual Representative Election.'
    }
  ];

  return {
    associations,
    employees,
    users,
    elections,
    candidate_applications,
    candidates,
    voter_participation,
    ballots,
    election_results,
    notifications,
    verification_requests,
    audit_logs
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read db.json, falling back to seed:', e);
    }
    const initial = getInitialSeedData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db.json:', e);
    }
  }

  public resetDemoData() {
    this.data = getInitialSeedData();
    this.save();
    return this.data;
  }

  // --- Getters ---
  public getAssociations(): Association[] {
    return this.data.associations;
  }

  public getEmployees(): Employee[] {
    return this.data.employees;
  }

  public getUsers(): StoredUser[] {
    return this.data.users;
  }

  public getElections(): Election[] {
    // Recalculate dynamic aggregates before returning
    return this.data.elections.map(elec => {
      const participationCount = this.data.voter_participation.filter(p => p.election_id === elec.id).length;
      const candidatesCount = this.data.candidates.filter(c => c.election_id === elec.id).length;
      return {
        ...elec,
        total_eligible_voters: elec.eligible_employee_ids?.length || 0,
        total_voters_participated: participationCount,
        approved_candidates_count: candidatesCount
      };
    });
  }

  public getCandidateApplications(): CandidateApplication[] {
    return this.data.candidate_applications;
  }

  public getCandidates(): Candidate[] {
    return this.data.candidates;
  }

  public getVoterParticipation(): VoterParticipation[] {
    return this.data.voter_participation;
  }

  public getBallots(): StoredBallot[] {
    return this.data.ballots;
  }

  public getElectionResults(): ElectionResult[] {
    return this.data.election_results;
  }

  public getNotifications(): NotificationItem[] {
    return this.data.notifications;
  }

  public getVerificationRequests(): ManualVerificationRequest[] {
    return this.data.verification_requests;
  }

  public getAuditLogs(): AuditLogItem[] {
    return this.data.audit_logs;
  }

  // --- Mutators with atomic commit and audit ---
  public addUser(user: StoredUser) {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(userId: string, partial: Partial<StoredUser>) {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...partial };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  public addAssociation(assoc: Association) {
    this.data.associations.push(assoc);
    this.save();
  }

  public toggleAssociation(id: string) {
    const a = this.data.associations.find(x => x.id === id);
    if (a) {
      a.active = !a.active;
      this.save();
    }
    return a;
  }

  public addElection(election: Election) {
    this.data.elections.push(election);
    this.save();
    return election;
  }

  public updateElection(electionId: string, partial: Partial<Election>) {
    const idx = this.data.elections.findIndex(e => e.id === electionId);
    if (idx !== -1) {
      this.data.elections[idx] = { ...this.data.elections[idx], ...partial };
      this.save();
      return this.data.elections[idx];
    }
    return null;
  }

  public addCandidateApplication(app: CandidateApplication) {
    this.data.candidate_applications.push(app);
    this.save();
    return app;
  }

  public updateCandidateApplication(appId: string, partial: Partial<CandidateApplication>) {
    const idx = this.data.candidate_applications.findIndex(a => a.id === appId);
    if (idx !== -1) {
      this.data.candidate_applications[idx] = { ...this.data.candidate_applications[idx], ...partial };
      this.save();
      return this.data.candidate_applications[idx];
    }
    return null;
  }

  public addCandidate(candidate: Candidate) {
    this.data.candidates.push(candidate);
    this.save();
    return candidate;
  }

  // Atomic Ballot Submission
  public castVote(params: {
    electionId: string;
    positionId: string;
    employeeId: string;
    candidateId: string;
  }): { success: boolean; confirmationReference?: string; error?: string } {
    const { electionId, positionId, employeeId, candidateId } = params;

    // 1. Verify election exists and voting is open
    const election = this.data.elections.find(e => e.id === electionId);
    if (!election) {
      return { success: false, error: 'Election not found' };
    }
    if (election.status !== 'VOTING_OPEN') {
      return { success: false, error: 'Voting is not open for this election' };
    }

    // Check dates as well
    const now = new Date();
    if (new Date(election.voting_start) > now || new Date(election.voting_end) < now) {
      return { success: false, error: 'Current time is outside the designated voting period' };
    }

    // 2. Verify voter eligibility
    if (!election.eligible_employee_ids.includes(employeeId)) {
      return { success: false, error: 'Employee is not registered on the eligible voter roll for this election' };
    }

    // 3. Double-vote check
    const existingVote = this.data.voter_participation.find(
      p => p.election_id === electionId && p.position_id === positionId && p.employee_id === employeeId
    );
    if (existingVote) {
      return { success: false, error: 'You have already cast your ballot for this election and position' };
    }

    // 4. Verify candidate is approved
    const candidate = this.data.candidates.find(
      c => c.id === candidateId && c.election_id === electionId && c.position_id === positionId
    );
    if (!candidate) {
      return { success: false, error: 'Invalid candidate selected' };
    }

    // 5. Generate secure non-reversible confirmation reference
    const randPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const confirmationReference = `GOV-VOTE-${new Date().getFullYear()}-${randPart}`;

    // 6. Record participation (contains employee_id, NO candidate choice)
    const participationRecord: VoterParticipation = {
      id: 'part-' + crypto.randomUUID(),
      election_id: electionId,
      position_id: positionId,
      employee_id: employeeId,
      submitted_at: new Date().toISOString(),
      confirmation_reference: confirmationReference
    };

    // 7. Record ballot (contains candidate_id, strictly NO employee_id or voter identifier)
    const ballotRecord: StoredBallot = {
      id: 'bal-' + crypto.randomUUID(),
      election_id: electionId,
      position_id: positionId,
      candidate_id: candidateId,
      ballot_reference: crypto.randomBytes(16).toString('hex'),
      submitted_at: new Date().toISOString()
    };

    this.data.voter_participation.push(participationRecord);
    this.data.ballots.push(ballotRecord);
    this.save();

    return { success: true, confirmationReference };
  }

  // Publish Election Results
  public publishResults(electionId: string, publisherId: string, publisherName: string): ElectionResult[] {
    const election = this.data.elections.find(e => e.id === electionId);
    if (!election) throw new Error('Election not found');

    const createdResults: ElectionResult[] = [];

    // Calculate for each position
    for (const pos of election.positions) {
      const positionBallots = this.data.ballots.filter(
        b => b.election_id === electionId && b.position_id === pos.id
      );
      const approvedCandidates = this.data.candidates.filter(
        c => c.election_id === electionId && c.position_id === pos.id
      );

      const totalValid = positionBallots.length;
      const totalEligible = election.eligible_employee_ids.length;

      // Count votes per candidate
      const candidateResults = approvedCandidates.map(c => {
        const votes = positionBallots.filter(b => b.candidate_id === c.id).length;
        const vote_percentage = totalValid > 0 ? Math.round((votes / totalValid) * 100 * 10) / 10 : 0;
        return {
          candidate_id: c.id,
          candidate_name: c.candidate_name,
          position_id: pos.id,
          votes,
          vote_percentage,
          is_winner: false
        };
      });

      // Determine winner(s)
      if (candidateResults.length > 0 && totalValid > 0) {
        const maxVotes = Math.max(...candidateResults.map(r => r.votes));
        if (maxVotes > 0) {
          candidateResults.forEach(r => {
            if (r.votes === maxVotes) r.is_winner = true;
          });
        }
      }

      const result: ElectionResult = {
        id: 'res-' + crypto.randomUUID(),
        election_id: electionId,
        position_id: pos.id,
        candidate_results: candidateResults,
        total_valid_ballots: totalValid,
        total_eligible: totalEligible,
        turnout_percentage: totalEligible > 0 ? Math.round((totalValid / totalEligible) * 100 * 10) / 10 : 0,
        published_at: new Date().toISOString(),
        published_by: publisherId,
        published_by_name: publisherName,
        status: 'PUBLISHED'
      };

      // Remove existing result if any and add new
      this.data.election_results = this.data.election_results.filter(
        r => !(r.election_id === electionId && r.position_id === pos.id)
      );
      this.data.election_results.push(result);
      createdResults.push(result);
    }

    // Update election status to RESULTS_PUBLISHED
    election.status = 'RESULTS_PUBLISHED';
    this.save();

    return createdResults;
  }

  public addNotification(notification: Omit<NotificationItem, 'id' | 'created_at'>) {
    const item: NotificationItem = {
      ...notification,
      id: 'notif-' + crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.data.notifications.unshift(item);
    this.save();
    return item;
  }

  public markNotificationAsRead(id: string) {
    const n = this.data.notifications.find(x => x.id === id);
    if (n) {
      n.is_read = true;
      this.save();
    }
    return n;
  }

  public markAllNotificationsAsRead(userId?: string) {
    this.data.notifications.forEach(n => {
      if (!userId || n.recipient_user_id === userId) {
        n.is_read = true;
      }
    });
    this.save();
  }

  public addVerificationRequest(req: Omit<ManualVerificationRequest, 'id' | 'created_at' | 'status'>) {
    const item: ManualVerificationRequest = {
      ...req,
      id: 'vr-' + crypto.randomUUID(),
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    this.data.verification_requests.unshift(item);
    this.save();
    return item;
  }

  public reviewVerificationRequest(id: string, status: 'APPROVED' | 'REJECTED', reviewerId: string) {
    const req = this.data.verification_requests.find(r => r.id === id);
    if (req) {
      req.status = status;
      req.reviewed_by = reviewerId;
      req.reviewed_at = new Date().toISOString();
      
      // If approved, update user's verification state
      const user = this.data.users.find(u => u.id === req.user_id);
      if (user) {
        user.identity_verified = status === 'APPROVED';
        user.verification_status = status === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
        user.verification_method = 'MANUAL_OFFICIAL_REVIEW';
      }

      this.save();
    }
    return req;
  }

  public logAudit(log: Omit<AuditLogItem, 'id' | 'timestamp'>) {
    const item: AuditLogItem = {
      ...log,
      id: 'aud-' + crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    this.data.audit_logs.unshift(item);
    this.save();
    return item;
  }
}

export const db = new Database();
