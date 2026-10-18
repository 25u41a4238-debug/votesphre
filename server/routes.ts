import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword } from './db.ts';
import { sseManager } from './sse.ts';
import { ElectionStatus } from '../src/types/index.ts';

export const apiRouter = express.Router();

// Simple in-memory session tokens
const SESSIONS = new Map<string, string>(); // token -> userId

function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const userId = SESSIONS.get(token);
  if (!userId) return null;
  return db.getUsers().find(u => u.id === userId) || null;
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  (req as any).user = user;
  next();
}

function requireOfficialOrAdmin(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user || (user.account_role !== 'OFFICIAL' && user.account_role !== 'PLATFORM_ADMIN')) {
    return res.status(403).json({ error: 'Access denied: Election official or administrator privilege required' });
  }
  if (user.account_role === 'OFFICIAL' && user.approval_status !== 'APPROVED') {
    return res.status(403).json({ error: 'Access denied: Official account is pending administrator approval' });
  }
  (req as any).user = user;
  next();
}

function requirePlatformAdmin(req: Request, res: Response, next: () => void) {
  const user = getAuthUser(req);
  if (!user || user.account_role !== 'PLATFORM_ADMIN') {
    return res.status(403).json({ error: 'Access denied: Platform administrator privilege required' });
  }
  (req as any).user = user;
  next();
}

// ---------------- Real-Time SSE ----------------
apiRouter.get('/realtime/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  });

  const clientId = crypto.randomUUID();
  const user = getAuthUser(req);

  sseManager.addClient({
    id: clientId,
    res,
    userId: user?.id,
    role: user?.account_role
  });

  req.on('close', () => {
    sseManager.removeClient(clientId);
  });
});

// ---------------- Auth Routes ----------------
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { full_name, email, password, account_role, association_id, employee_id, contact_number } = req.body;

  if (!full_name || !email || !password || !account_role || !association_id) {
    return res.status(400).json({ error: 'Missing mandatory registration fields' });
  }

  // Check email uniqueness
  const existing = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  // Association validation
  const assoc = db.getAssociations().find(a => a.id === association_id && a.active);
  if (!assoc) {
    return res.status(400).json({ error: 'Selected association is invalid or inactive' });
  }

  const { hash, salt } = hashPassword(password);
  const userId = 'usr-' + crypto.randomUUID();

  // If participant, link employee ID if provided, check eligibility
  let autoVerified = false;
  let linkedEmpId = employee_id?.trim();
  if (account_role === 'PARTICIPANT' && !linkedEmpId) {
    // Attempt match by email from employee registry
    const matchEmp = db.getEmployees().find(e => e.email.toLowerCase() === email.toLowerCase() && e.association_id === association_id);
    if (matchEmp) {
      linkedEmpId = matchEmp.employee_id;
    }
  }

  const isOfficial = account_role === 'OFFICIAL';
  const approvalStatus = isOfficial ? 'PENDING' : 'APPROVED';
  const accountStatus = isOfficial ? 'PENDING' : 'ACTIVE';

  const newUser = {
    id: userId,
    email: email.toLowerCase(),
    password_hash: hash,
    password_salt: salt,
    full_name,
    contact_number,
    account_role,
    association_id,
    employee_id: linkedEmpId,
    account_status: accountStatus as any,
    approval_status: approvalStatus as any,
    identity_verified: false,
    verification_status: 'UNVERIFIED' as any,
    authorized_association_ids: isOfficial ? [] : undefined,
    created_at: new Date().toISOString()
  };

  db.addUser(newUser);

  // If official, send notification to admin
  if (isOfficial) {
    db.addNotification({
      recipient_role: 'PLATFORM_ADMIN',
      title: 'New Official Account Request',
      message: `${full_name} has requested Election Official authorization for ${assoc.name}.`,
      notification_type: 'OFFICIAL_REQUEST',
      is_read: false
    });
    sseManager.broadcast({ type: 'OFFICIAL_REQUEST_SUBMITTED', payload: { userId, full_name } });
  }

  const token = crypto.randomUUID();
  SESSIONS.set(token, userId);

  // Strip password hash from response
  const { password_hash, password_salt, ...profile } = newUser;
  return res.json({ token, user: profile });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, intended_role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  const valid = verifyPassword(password, user.password_hash, user.password_salt);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  // Role check if intended_role specified
  if (intended_role) {
    if (intended_role === 'OFFICIAL' && user.account_role === 'PARTICIPANT') {
      return res.status(403).json({ error: 'This account does not have Election Official credentials' });
    }
    if (intended_role === 'PARTICIPANT' && user.account_role === 'OFFICIAL') {
      // Officials can view or sign in, but let's inform them
    }
  }

  const token = crypto.randomUUID();
  SESSIONS.set(token, user.id);

  const { password_hash, password_salt, ...profile } = user;
  return res.json({ token, user: profile });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { password_hash, password_salt, ...profile } = user;
  return res.json({ user: profile });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    SESSIONS.delete(token);
  }
  return res.json({ success: true });
});

// Demo account instant switch helper
apiRouter.post('/auth/switch-demo', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.getUsers().find(u => u.id === userId || u.email === userId);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }
  const token = crypto.randomUUID();
  SESSIONS.set(token, user.id);
  const { password_hash, password_salt, ...profile } = user;
  return res.json({ token, user: profile });
});

// ---------------- Associations & Employees ----------------
apiRouter.get('/associations', (req: Request, res: Response) => {
  return res.json({ associations: db.getAssociations() });
});

apiRouter.post('/associations', requirePlatformAdmin, (req: Request, res: Response) => {
  const { name, code, description } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });
  const newAssoc = {
    id: 'assoc-' + crypto.randomUUID(),
    name,
    code: code.toUpperCase(),
    description: description || '',
    active: true,
    created_at: new Date().toISOString()
  };
  db.addAssociation(newAssoc);
  sseManager.broadcast({ type: 'ASSOCIATIONS_UPDATED' });
  return res.json({ association: newAssoc });
});

apiRouter.patch('/associations/:id/toggle', requirePlatformAdmin, (req: Request, res: Response) => {
  const updated = db.toggleAssociation(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Association not found' });
  sseManager.broadcast({ type: 'ASSOCIATIONS_UPDATED' });
  return res.json({ association: updated });
});

apiRouter.get('/employees', (req: Request, res: Response) => {
  const { association_id } = req.query;
  let emps = db.getEmployees();
  if (association_id) {
    emps = emps.filter(e => e.association_id === association_id);
  }
  return res.json({ employees: emps });
});

apiRouter.post('/employees/verify-id', (req: Request, res: Response) => {
  const { employee_id, association_id } = req.body;
  if (!employee_id) return res.status(400).json({ error: 'Employee ID is required' });

  const emp = db.getEmployees().find(e => e.employee_id.toUpperCase() === employee_id.trim().toUpperCase());
  if (!emp) {
    return res.status(404).json({ eligible: false, reason: 'Employee ID not found in government civil service records' });
  }

  if (association_id && emp.association_id !== association_id) {
    const assoc = db.getAssociations().find(a => a.id === emp.association_id);
    return res.status(400).json({ 
      eligible: false, 
      reason: `Employee is registered with ${assoc ? assoc.name : 'another association'}, not the selected association` 
    });
  }

  return res.json({ eligible: true, employee: emp });
});

// ---------------- Identity Verification ----------------
apiRouter.post('/verification/simulate', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { simulate_success, employee_id } = req.body;

  if (simulate_success) {
    // Verify employee ID exists
    const emp = db.getEmployees().find(e => e.employee_id.toUpperCase() === employee_id?.trim()?.toUpperCase());
    if (!emp) {
      return res.status(400).json({ success: false, error: 'Employee ID not found in registry' });
    }

    db.updateUser(user.id, {
      identity_verified: true,
      verification_status: 'VERIFIED',
      verification_method: 'SIMULATED_FACIAL',
      employee_id: emp.employee_id
    });

    db.addNotification({
      recipient_user_id: user.id,
      title: 'Identity Verification Completed',
      message: 'Your simulated biometric identity verification has succeeded. You are now eligible to access association ballots.',
      notification_type: 'VERIFICATION',
      is_read: false
    });

    sseManager.sendToUser(user.id, { type: 'VERIFICATION_UPDATED', payload: { status: 'VERIFIED' } });
    return res.json({ success: true, status: 'VERIFIED' });
  } else {
    // Simulated failure
    return res.json({ 
      success: false, 
      status: 'FAILED',
      error: 'Facial contour match fell below confidence threshold (simulated test). You may retry or submit a request for manual official verification.' 
    });
  }
});

apiRouter.post('/verification/request-manual', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { employee_id, reason, document_type } = req.body;

  if (!employee_id || !reason) {
    return res.status(400).json({ error: 'Employee ID and reason are mandatory' });
  }

  const vreq = db.addVerificationRequest({
    user_id: user.id,
    employee_id,
    full_name: user.full_name,
    association_id: user.association_id,
    reason,
    document_type: document_type || 'Official Employee Identity Card'
  });

  db.updateUser(user.id, {
    verification_status: 'PENDING_REVIEW',
    employee_id
  });

  // Notify officials
  db.addNotification({
    recipient_role: 'OFFICIAL',
    title: 'Manual Verification Request',
    message: `${user.full_name} (${employee_id}) has requested manual identification review.`,
    notification_type: 'VERIFICATION',
    is_read: false
  });

  sseManager.broadcast({ type: 'MANUAL_VERIFICATION_REQUESTED', payload: vreq });
  return res.json({ success: true, request: vreq });
});

apiRouter.get('/verification/requests', requireOfficialOrAdmin, (req: Request, res: Response) => {
  return res.json({ requests: db.getVerificationRequests() });
});

apiRouter.post('/verification/requests/:id/review', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
  }

  const reviewed = db.reviewVerificationRequest(req.params.id, status, user.id);
  if (!reviewed) return res.status(404).json({ error: 'Request not found' });

  // Notify participant
  db.addNotification({
    recipient_user_id: reviewed.user_id,
    title: `Manual Verification ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    message: status === 'APPROVED' 
      ? 'An election official has confirmed your employee identity. You may now participate in eligible elections.' 
      : 'Your manual verification request was rejected. Please contact your association secretariat.',
    notification_type: 'VERIFICATION',
    is_read: false
  });

  sseManager.sendToUser(reviewed.user_id, { type: 'VERIFICATION_UPDATED', payload: { status } });
  sseManager.broadcast({ type: 'VERIFICATION_REQUEST_REVIEWED', payload: reviewed });

  return res.json({ request: reviewed });
});

// ---------------- Elections ----------------
apiRouter.get('/elections', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  let elections = db.getElections();

  // If user is participant or anonymous, filter to published elections
  if (!user || user.account_role === 'PARTICIPANT') {
    elections = elections.filter(e => e.status !== 'DRAFT');
    if (req.query.my_association_only === 'true' && user?.association_id) {
      elections = elections.filter(e => e.association_ids.includes(user.association_id));
    }
  } else if (user.account_role === 'OFFICIAL') {
    // Official can see draft and published for their authorized associations or ones they created
    const authAssocs = user.authorized_association_ids || (user.association_id ? [user.association_id] : []);
    elections = elections.filter(e => 
      e.created_by === user.id || 
      authAssocs.length === 0 || 
      authAssocs.includes('ALL') ||
      e.association_ids.some(a => authAssocs.includes(a))
    );
  }

  return res.json({ elections });
});

apiRouter.get('/elections/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const election = db.getElections().find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  // Participants cannot see DRAFT
  if ((!user || user.account_role === 'PARTICIPANT') && election.status === 'DRAFT') {
    return res.status(403).json({ error: 'Draft elections are only viewable by authorized election officials' });
  }

  // Get approved candidates
  const candidates = db.getCandidates().filter(c => c.election_id === election.id);

  // Check user participation status
  let userParticipation: any = null;
  let isEligible = false;

  if (user) {
    if (user.employee_id && election.eligible_employee_ids.includes(user.employee_id)) {
      isEligible = true;
    }
    if (user.employee_id) {
      userParticipation = db.getVoterParticipation().filter(
        p => p.election_id === election.id && p.employee_id === user.employee_id
      );
    }
  }

  return res.json({
    election,
    candidates,
    isEligible,
    hasVoted: Boolean(userParticipation && userParticipation.length > 0),
    participationRecords: userParticipation || []
  });
});

apiRouter.post('/elections', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  let {
    title,
    description,
    association_ids,
    positions,
    nomination_start,
    nomination_end,
    voting_start,
    voting_end,
    eligibility_requirements,
    instructions,
    eligible_employee_ids,
    publish_now,
    initial_phase
  } = req.body;

  // Auto-fallback for associations
  if (!Array.isArray(association_ids) || association_ids.length === 0) {
    association_ids = user.association_id ? [user.association_id] : ['assoc-1'];
  }

  // Auto-fallback for title
  if (!title || !title.trim()) {
    const firstAssoc = db.getAssociations().find(a => association_ids.includes(a.id));
    title = `${firstAssoc ? firstAssoc.name : 'Association'} General Executive Council Election ${new Date().getFullYear()}`;
  }

  const electionId = 'elec-' + crypto.randomUUID();

  // Auto-fallback for positions
  if (!Array.isArray(positions) || positions.length === 0) {
    positions = [
      { id: `pos-${electionId}-1`, title: 'Association President', number_of_seats: 1, instructions: 'Vote for one candidate' }
    ];
  } else {
    positions = positions.map((p: any, idx: number) => ({
      id: p.id || `pos-${electionId}-${idx + 1}`,
      election_id: electionId,
      title: p.title?.trim() || `Contested Seat #${idx + 1}`,
      number_of_seats: Number(p.number_of_seats) || 1,
      instructions: p.instructions?.trim() || 'Cast one vote'
    }));
  }

  const now = Date.now();
  const dayMs = 86400000;

  // Handle phase shortcuts
  if (initial_phase === 'VOTING_OPEN') {
    nomination_start = new Date(now - 7 * dayMs).toISOString();
    nomination_end = new Date(now - 1000).toISOString();
    voting_start = new Date(now - 1000).toISOString();
    voting_end = new Date(now + 7 * dayMs).toISOString();
    publish_now = true;
  } else if (initial_phase === 'NOMINATION_OPEN') {
    nomination_start = new Date(now).toISOString();
    nomination_end = new Date(now + 5 * dayMs).toISOString();
    voting_start = new Date(now + 5 * dayMs).toISOString();
    voting_end = new Date(now + 10 * dayMs).toISOString();
    publish_now = true;
  } else {
    // Normal date resolution with auto-correction
    let nomStart = nomination_start ? new Date(nomination_start).getTime() : now;
    let nomEnd = nomination_end ? new Date(nomination_end).getTime() : now + 5 * dayMs;
    let voteStart = voting_start ? new Date(voting_start).getTime() : nomEnd;
    let voteEnd = voting_end ? new Date(voting_end).getTime() : voteStart + 5 * dayMs;

    if (isNaN(nomStart)) nomStart = now;
    if (isNaN(nomEnd) || nomEnd <= nomStart) nomEnd = nomStart + 5 * dayMs;
    if (isNaN(voteStart) || voteStart < nomEnd) voteStart = nomEnd;
    if (isNaN(voteEnd) || voteEnd <= voteStart) voteEnd = voteStart + 5 * dayMs;

    nomination_start = new Date(nomStart).toISOString();
    nomination_end = new Date(nomEnd).toISOString();
    voting_start = new Date(voteStart).toISOString();
    voting_end = new Date(voteEnd).toISOString();
  }

  // Deduplicate and trim employee IDs
  let cleanedEmpIds = Array.isArray(eligible_employee_ids)
    ? Array.from(new Set(eligible_employee_ids.map((id: string) => String(id).trim().toUpperCase()))).filter(Boolean)
    : [];

  // If no employees were explicitly specified, auto-populate all employees for the selected associations
  if (cleanedEmpIds.length === 0) {
    const matchingEmps = db.getEmployees().filter(e => association_ids.includes(e.association_id));
    cleanedEmpIds = matchingEmps.map(e => e.employee_id);
  }

  // Determine initial status
  let initialStatus: ElectionStatus = 'DRAFT';
  if (publish_now) {
    const nStart = new Date(nomination_start).getTime();
    const nEnd = new Date(nomination_end).getTime();
    const vStart = new Date(voting_start).getTime();
    const vEnd = new Date(voting_end).getTime();

    if (initial_phase === 'VOTING_OPEN') {
      initialStatus = 'VOTING_OPEN';
    } else if (now >= vStart && now < vEnd) {
      initialStatus = 'VOTING_OPEN';
    } else if (now >= nStart && now < nEnd) {
      initialStatus = 'NOMINATION_OPEN';
    } else if (now < nStart) {
      initialStatus = 'NOMINATION_OPEN';
    } else if (now >= nEnd && now < vStart) {
      initialStatus = 'NOMINATION_CLOSED';
    } else {
      initialStatus = 'VOTING_CLOSED';
    }
  }

  const newElection = {
    id: electionId,
    title: title.trim(),
    description: (description || '').trim(),
    association_ids,
    positions,
    status: initialStatus,
    nomination_start,
    nomination_end,
    voting_start,
    voting_end,
    eligibility_requirements: eligibility_requirements || 'Active permanent association members in good standing.',
    instructions: instructions || 'Select one authorized candidate per contested position.',
    created_by: user.id,
    created_by_name: user.full_name,
    published_at: publish_now ? new Date().toISOString() : undefined,
    created_at: new Date().toISOString(),
    eligible_employee_ids: cleanedEmpIds,
    total_eligible_voters: cleanedEmpIds.length,
    total_voters_participated: 0,
    approved_candidates_count: 0
  };

  db.addElection(newElection);

  // If published with VOTING_OPEN, seed 2-3 sample candidates so voters immediately have candidates to vote for on the ballot
  if (publish_now && initialStatus === 'VOTING_OPEN') {
    const assocEmps = db.getEmployees().filter(e => association_ids.includes(e.association_id));
    const firstPos = positions[0];
    if (firstPos && assocEmps.length >= 2) {
      const cand1: any = {
        id: 'cand-' + crypto.randomUUID(),
        election_id: electionId,
        position_id: firstPos.id,
        employee_id: assocEmps[0].employee_id,
        candidate_name: assocEmps[0].full_name,
        statement_of_purpose: 'Accountability, enhanced workplace benefits, and structured collective bargaining.',
        qualifications: `Senior Officer with 12 years in ${assocEmps[0].department}.`,
        application_id: 'app-' + crypto.randomUUID(),
        approval_status: 'APPROVED'
      };
      const cand2: any = {
        id: 'cand-' + crypto.randomUUID(),
        election_id: electionId,
        position_id: firstPos.id,
        employee_id: assocEmps[1].employee_id,
        candidate_name: assocEmps[1].full_name,
        statement_of_purpose: 'Modern infrastructure, staff welfare, and professional development grants.',
        qualifications: `Operations Director in ${assocEmps[1].department}.`,
        application_id: 'app-' + crypto.randomUUID(),
        approval_status: 'APPROVED'
      };
      db.addCandidate(cand1);
      db.addCandidate(cand2);
      newElection.approved_candidates_count = 2;
    }
  }

  db.logAudit({
    actor_user_id: user.id,
    actor_name: user.full_name,
    actor_role: user.account_role,
    action: publish_now ? 'CREATE_AND_PUBLISH_ELECTION' : 'CREATE_ELECTION_DRAFT',
    entity_type: 'ELECTION',
    entity_id: electionId,
    details: `Created election "${title}" with ${cleanedEmpIds.length} eligible voters. Initial status: ${initialStatus}.`
  });

  if (publish_now) {
    db.addNotification({
      recipient_role: 'PARTICIPANT',
      title: `New Election Published: ${title}`,
      message: `Nominations or voting are now being scheduled for ${title}. Check your eligibility to participate.`,
      notification_type: 'ELECTION_PUBLISHED',
      related_election_id: electionId,
      is_read: false
    });
  }

  sseManager.broadcast({ type: 'ELECTION_CREATED', payload: newElection });
  if (publish_now) {
    sseManager.broadcast({ type: 'ELECTION_PUBLISHED', payload: newElection });
  }
  return res.json({ election: newElection });
});

apiRouter.patch('/elections/:id', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const existing = db.getElections().find(e => e.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Election not found' });

  // A published election cannot alter submitted ballots or structural fields
  if (existing.status !== 'DRAFT') {
    // Only permit safe description, instructions, or closing actions
    const { description, instructions } = req.body;
    const updated = db.updateElection(req.params.id, { description, instructions });
    sseManager.broadcast({ type: 'ELECTION_UPDATED', payload: updated });
    return res.json({ election: updated });
  }

  // If draft, can update any fields
  const updated = db.updateElection(req.params.id, req.body);
  sseManager.broadcast({ type: 'ELECTION_UPDATED', payload: updated });
  return res.json({ election: updated });
});

apiRouter.post('/elections/:id/publish', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const election = db.getElections().find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  if (election.status !== 'DRAFT') {
    return res.status(400).json({ error: 'Election is already published' });
  }

  // Determine status based on current time
  const now = Date.now();
  const nomStart = new Date(election.nomination_start).getTime();
  const nomEnd = new Date(election.nomination_end).getTime();
  const voteStart = new Date(election.voting_start).getTime();
  const voteEnd = new Date(election.voting_end).getTime();

  let activeStatus: ElectionStatus = 'NOMINATION_OPEN';
  if (now < nomStart) activeStatus = 'NOMINATION_OPEN'; // open or scheduled
  else if (now >= nomStart && now < nomEnd) activeStatus = 'NOMINATION_OPEN';
  else if (now >= nomEnd && now < voteStart) activeStatus = 'NOMINATION_CLOSED';
  else if (now >= voteStart && now < voteEnd) activeStatus = 'VOTING_OPEN';
  else activeStatus = 'VOTING_CLOSED';

  const updated = db.updateElection(election.id, {
    status: activeStatus,
    published_at: new Date().toISOString()
  });

  db.logAudit({
    actor_user_id: user.id,
    actor_name: user.full_name,
    actor_role: user.account_role,
    action: 'PUBLISH_ELECTION',
    entity_type: 'ELECTION',
    entity_id: election.id,
    details: `Published election "${election.title}". Active status: ${activeStatus}.`
  });

  db.addNotification({
    recipient_role: 'PARTICIPANT',
    title: `Official Election Published: ${election.title}`,
    message: `The election "${election.title}" has been published by election officials and is now open for association members.`,
    notification_type: 'ELECTION_PUBLISHED',
    related_election_id: election.id,
    is_read: false
  });

  sseManager.broadcast({ type: 'ELECTION_PUBLISHED', payload: updated });
  return res.json({ election: updated });
});

apiRouter.post('/elections/:id/close-voting', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const election = db.getElections().find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  if (election.status !== 'VOTING_OPEN') {
    return res.status(400).json({ error: 'Can only close an election currently in VOTING_OPEN state' });
  }

  const updated = db.updateElection(election.id, {
    status: 'VOTING_CLOSED',
    voting_end: new Date().toISOString()
  });

  db.logAudit({
    actor_user_id: user.id,
    actor_name: user.full_name,
    actor_role: user.account_role,
    action: 'CLOSE_VOTING',
    entity_type: 'ELECTION',
    entity_id: election.id,
    details: `Closed voting period for "${election.title}". Ready for Scrutineer result tallying.`
  });

  db.addNotification({
    recipient_role: 'OFFICIAL',
    title: `Voting Closed: ${election.title}`,
    message: `Voting has closed for "${election.title}". Ballots are sealed and awaiting certified result calculation.`,
    notification_type: 'VOTING_CLOSED',
    related_election_id: election.id,
    is_read: false
  });

  sseManager.broadcast({ type: 'ELECTION_UPDATED', payload: updated });
  return res.json({ election: updated });
});

// ---------------- Candidate Applications & Nominations ----------------
apiRouter.get('/elections/:id/applications', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const apps = db.getCandidateApplications().filter(a => a.election_id === req.params.id);
  return res.json({ applications: apps });
});

apiRouter.get('/participant/applications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const apps = db.getCandidateApplications().filter(a => 
    (user.employee_id && a.employee_id === user.employee_id) || a.candidate_name === user.full_name
  );
  return res.json({ applications: apps });
});

apiRouter.post('/elections/:id/applications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const election = db.getElections().find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  // Verification check
  if (!user.identity_verified) {
    return res.status(403).json({ error: 'You must complete identity verification before applying as a candidate' });
  }

  // Nomination window check
  if (election.status !== 'NOMINATION_OPEN') {
    return res.status(400).json({ error: 'Nominations are not currently open for this election' });
  }

  const { position_id, statement_of_purpose, qualifications, required_declarations } = req.body;
  if (!position_id || !statement_of_purpose || !qualifications || !required_declarations) {
    return res.status(400).json({ error: 'Statement of purpose, qualifications, and statutory declarations are mandatory' });
  }

  const empId = user.employee_id;
  if (!empId) {
    return res.status(400).json({ error: 'Employee ID is required on profile' });
  }

  // Duplicate active application check
  const existing = db.getCandidateApplications().find(
    a => a.election_id === election.id && a.position_id === position_id && a.employee_id === empId && a.status !== 'WITHDRAWN' && a.status !== 'REJECTED'
  );
  if (existing) {
    return res.status(400).json({ error: 'You already have an active nomination application for this position' });
  }

  const appId = 'app-' + crypto.randomUUID();
  const application = {
    id: appId,
    election_id: election.id,
    position_id,
    employee_id: empId,
    candidate_name: user.full_name,
    statement_of_purpose,
    qualifications,
    required_declarations: Boolean(required_declarations),
    status: 'PENDING' as any,
    submitted_at: new Date().toISOString()
  };

  db.addCandidateApplication(application);

  db.addNotification({
    recipient_role: 'OFFICIAL',
    title: 'New Candidate Proposal Submitted',
    message: `${user.full_name} (${empId}) submitted candidacy for ${election.title}.`,
    notification_type: 'NOMINATION_SUBMITTED',
    related_election_id: election.id,
    is_read: false
  });

  sseManager.broadcast({ type: 'CANDIDATE_APPLICATION_SUBMITTED', payload: application });
  return res.json({ application });
});

apiRouter.post('/applications/:id/review', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { decision, rejection_reason } = req.body; // 'APPROVE' or 'REJECT'

  const app = db.getCandidateApplications().find(a => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: 'Candidate application not found' });

  if (decision === 'APPROVE') {
    const updated = db.updateCandidateApplication(app.id, {
      status: 'APPROVED',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    });

    // Automatically create approved Candidate record
    const candidateRecord = {
      id: 'cand-' + crypto.randomUUID(),
      election_id: app.election_id,
      position_id: app.position_id,
      employee_id: app.employee_id,
      candidate_name: app.candidate_name,
      statement_of_purpose: app.statement_of_purpose,
      qualifications: app.qualifications,
      application_id: app.id,
      approval_status: 'APPROVED' as const
    };
    db.addCandidate(candidateRecord);

    // Notify applicant
    const applicantUser = db.getUsers().find(u => u.employee_id === app.employee_id);
    if (applicantUser) {
      db.addNotification({
        recipient_user_id: applicantUser.id,
        title: 'Candidacy Approved!',
        message: `Your nomination application for position has been approved by the election official. You will appear on the official ballot.`,
        notification_type: 'APPLICATION_DECISION',
        related_election_id: app.election_id,
        is_read: false
      });
    }

    db.logAudit({
      actor_user_id: user.id,
      actor_name: user.full_name,
      actor_role: user.account_role,
      action: 'APPROVE_CANDIDATE',
      entity_type: 'CANDIDATE_APPLICATION',
      entity_id: app.id,
      details: `Approved candidate ${app.candidate_name} (${app.employee_id}).`
    });

    sseManager.broadcast({ type: 'CANDIDATE_APPROVED', payload: { application: updated, candidate: candidateRecord } });
    return res.json({ application: updated, candidate: candidateRecord });
  } else if (decision === 'REJECT') {
    const updated = db.updateCandidateApplication(app.id, {
      status: 'REJECTED',
      rejection_reason: rejection_reason || 'Does not fulfill statutory association eligibility criteria',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    });

    const applicantUser = db.getUsers().find(u => u.employee_id === app.employee_id);
    if (applicantUser) {
      db.addNotification({
        recipient_user_id: applicantUser.id,
        title: 'Nomination Application Rejected',
        message: `Your nomination was rejected. Reason: ${rejection_reason || 'Incomplete credentials.'}`,
        notification_type: 'APPLICATION_DECISION',
        related_election_id: app.election_id,
        is_read: false
      });
    }

    sseManager.broadcast({ type: 'CANDIDATE_REJECTED', payload: updated });
    return res.json({ application: updated });
  } else {
    return res.status(400).json({ error: 'Decision must be APPROVE or REJECT' });
  }
});

apiRouter.post('/applications/:id/withdraw', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const app = db.getCandidateApplications().find(a => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  if (app.employee_id !== user.employee_id && user.account_role !== 'PLATFORM_ADMIN') {
    return res.status(403).json({ error: 'Cannot withdraw another member’s candidacy' });
  }

  const updated = db.updateCandidateApplication(app.id, { status: 'WITHDRAWN' });
  sseManager.broadcast({ type: 'CANDIDATE_WITHDRAWN', payload: updated });
  return res.json({ application: updated });
});

// ---------------- Voting Workflow ----------------
apiRouter.post('/elections/:id/vote', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { position_id, candidate_id } = req.body;

  if (!user.identity_verified) {
    return res.status(403).json({ error: 'Identity verification is mandatory prior to casting a ballot' });
  }

  if (!user.employee_id) {
    return res.status(400).json({ error: 'No validated employee record found for your user session' });
  }

  if (!position_id || !candidate_id) {
    return res.status(400).json({ error: 'Position ID and candidate ID are mandatory' });
  }

  const result = db.castVote({
    electionId: req.params.id,
    positionId: position_id,
    employeeId: user.employee_id,
    candidateId: candidate_id
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Send voter confirmation notification (WITHOUT selected candidate)
  db.addNotification({
    recipient_user_id: user.id,
    title: 'Ballot Confirmed & Sealed',
    message: `Your anonymous vote has been counted. Confirmation receipt: ${result.confirmationReference}. Keep this for your records.`,
    notification_type: 'VOTE_CONFIRMED',
    related_election_id: req.params.id,
    is_read: false
  });

  db.logAudit({
    actor_user_id: user.id,
    actor_name: user.full_name,
    actor_role: user.account_role,
    action: 'CAST_BALLOT',
    entity_type: 'VOTER_PARTICIPATION',
    entity_id: result.confirmationReference || '',
    details: `Voter cast anonymous ballot. Participation confirmed.`
  });

  // Real-time broadcast that vote participation updated (does NOT leak candidate or voter details!)
  sseManager.broadcast({
    type: 'VOTE_CAST',
    payload: {
      election_id: req.params.id,
      position_id
    }
  });

  return res.json({
    success: true,
    confirmationReference: result.confirmationReference,
    submitted_at: new Date().toISOString()
  });
});

// ---------------- Results Management ----------------
apiRouter.get('/elections/:id/results', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const election = db.getElections().find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  const existingResults = db.getElectionResults().filter(r => r.election_id === req.params.id);

  // If results published, anyone can view
  if (election.status === 'RESULTS_PUBLISHED' && existingResults.length > 0) {
    return res.json({
      published: true,
      results: existingResults,
      election
    });
  }

  // If not published:
  // Participants must see "Results are awaiting official publication."
  const isOfficial = user && (user.account_role === 'OFFICIAL' || user.account_role === 'PLATFORM_ADMIN');
  if (!isOfficial) {
    return res.json({
      published: false,
      message: 'Results are awaiting official publication.',
      election_status: election.status
    });
  }

  // If official, can preview aggregate tally ONLY IF voting has closed!
  if (election.status === 'VOTING_OPEN') {
    return res.json({
      published: false,
      voting_is_open: true,
      message: 'Candidate vote totals are sealed while voting is actively open to preserve ballot secrecy and avoid influencing results.'
    });
  }

  // Voting is closed, preview calculation for officials
  const previewResults = election.positions.map(pos => {
    const positionBallots = db.getBallots().filter(b => b.election_id === election.id && b.position_id === pos.id);
    const approvedCandidates = db.getCandidates().filter(c => c.election_id === election.id && c.position_id === pos.id);
    const totalValid = positionBallots.length;
    const totalEligible = election.eligible_employee_ids.length;

    const candidate_results = approvedCandidates.map(c => {
      const votes = positionBallots.filter(b => b.candidate_id === c.id).length;
      return {
        candidate_id: c.id,
        candidate_name: c.candidate_name,
        position_id: pos.id,
        votes,
        vote_percentage: totalValid > 0 ? Math.round((votes / totalValid) * 100 * 10) / 10 : 0,
        is_winner: false
      };
    });

    if (candidate_results.length > 0 && totalValid > 0) {
      const maxVotes = Math.max(...candidate_results.map(r => r.votes));
      if (maxVotes > 0) {
        candidate_results.forEach(r => {
          if (r.votes === maxVotes) r.is_winner = true;
        });
      }
    }

    return {
      position_id: pos.id,
      position_title: pos.title,
      total_valid_ballots: totalValid,
      total_eligible: totalEligible,
      turnout_percentage: totalEligible > 0 ? Math.round((totalValid / totalEligible) * 100 * 10) / 10 : 0,
      candidate_results
    };
  });

  return res.json({
    published: false,
    can_publish: true,
    preview: previewResults,
    election
  });
});

apiRouter.post('/elections/:id/publish-results', requireOfficialOrAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const election = db.getElections().find(e => e.id === req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  if (election.status === 'VOTING_OPEN') {
    return res.status(400).json({ error: 'Cannot publish results while voting is still actively open' });
  }

  const results = db.publishResults(election.id, user.id, user.full_name);

  db.logAudit({
    actor_user_id: user.id,
    actor_name: user.full_name,
    actor_role: user.account_role,
    action: 'PUBLISH_RESULTS',
    entity_type: 'ELECTION_RESULTS',
    entity_id: election.id,
    details: `Published certified final election results for "${election.title}".`
  });

  db.addNotification({
    recipient_role: 'PARTICIPANT',
    title: `Official Results Published: ${election.title}`,
    message: `Final certified results for "${election.title}" have been officially published by the Election Board.`,
    notification_type: 'RESULTS_PUBLISHED',
    related_election_id: election.id,
    is_read: false
  });

  sseManager.broadcast({ type: 'RESULTS_PUBLISHED', payload: { election_id: election.id, results } });
  return res.json({ success: true, results });
});

// ---------------- Notifications ----------------
apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const all = db.getNotifications();
  const filtered = all.filter(n => {
    if (n.recipient_user_id === user.id) return true;
    if (n.recipient_role && n.recipient_role === user.account_role) return true;
    return false;
  });
  return res.json({ notifications: filtered });
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const updated = db.markNotificationAsRead(req.params.id);
  return res.json({ notification: updated });
});

apiRouter.post('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  db.markAllNotificationsAsRead(user.id);
  return res.json({ success: true });
});

// ---------------- Platform Admin & Demo Management ----------------
apiRouter.get('/admin/official-requests', requirePlatformAdmin, (req: Request, res: Response) => {
  const pendingOfficials = db.getUsers().filter(
    u => u.account_role === 'OFFICIAL' && u.approval_status === 'PENDING'
  ).map(u => {
    const { password_hash, password_salt, ...profile } = u;
    return profile;
  });
  return res.json({ requests: pendingOfficials });
});

apiRouter.post('/admin/official-requests/:id/review', requirePlatformAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { decision, authorized_association_ids } = req.body; // 'APPROVE' or 'REJECT'

  const user = db.getUsers().find(u => u.id === req.params.id && u.account_role === 'OFFICIAL');
  if (!user) return res.status(404).json({ error: 'Official account request not found' });

  if (decision === 'APPROVE') {
    const assocs = authorized_association_ids || [user.association_id];
    db.updateUser(user.id, {
      approval_status: 'APPROVED',
      account_status: 'ACTIVE',
      authorized_association_ids: assocs
    });

    db.addNotification({
      recipient_user_id: user.id,
      title: 'Official Account Authorization Approved',
      message: 'Your Election Official credentials have been approved by the Platform Administrator.',
      notification_type: 'REGISTRATION',
      is_read: false
    });

    db.logAudit({
      actor_user_id: admin.id,
      actor_name: admin.full_name,
      actor_role: admin.account_role,
      action: 'APPROVE_OFFICIAL_ACCOUNT',
      entity_type: 'USER',
      entity_id: user.id,
      details: `Approved official credentials for ${user.full_name}. Assigned associations: ${assocs.join(', ')}.`
    });

    sseManager.sendToUser(user.id, { type: 'OFFICIAL_APPROVED' });
    sseManager.broadcast({ type: 'OFFICIAL_REQUEST_RESOLVED', payload: { userId: user.id, status: 'APPROVED' } });
    return res.json({ success: true, status: 'APPROVED' });
  } else {
    db.updateUser(user.id, {
      approval_status: 'REJECTED',
      account_status: 'REJECTED'
    });

    db.logAudit({
      actor_user_id: admin.id,
      actor_name: admin.full_name,
      actor_role: admin.account_role,
      action: 'REJECT_OFFICIAL_ACCOUNT',
      entity_type: 'USER',
      entity_id: user.id,
      details: `Rejected official credentials for ${user.full_name}.`
    });

    sseManager.broadcast({ type: 'OFFICIAL_REQUEST_RESOLVED', payload: { userId: user.id, status: 'REJECTED' } });
    return res.json({ success: true, status: 'REJECTED' });
  }
});

apiRouter.get('/admin/audit-logs', requireOfficialOrAdmin, (req: Request, res: Response) => {
  return res.json({ logs: db.getAuditLogs() });
});

apiRouter.post('/admin/reset-demo', (req: Request, res: Response) => {
  db.resetDemoData();
  sseManager.broadcast({ type: 'DEMO_RESET' });
  return res.json({ success: true, message: 'Prototype demo data has been reset to default initial state.' });
});
