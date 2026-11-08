/**
 * Demo data store for VOLO prototype.
 * When Supabase is not configured, the app runs fully on this in-memory store.
 */

const STORAGE_KEY = 'volo_demo_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function initState() {
  const orgId1 = 'org-1';
  const orgId2 = 'org-2';
  const userId1 = 'user-org-1';
  const userId2 = 'user-org-2';
  const volId1 = 'vol-1';
  const volId2 = 'vol-2';
  const userId3 = 'user-vol-1';
  const userId4 = 'user-vol-2';

  return {
    users: [
      { id: userId1, full_name: 'Green Earth Foundation', email: 'contact@greenearth.org', role: 'organization', location: 'San Francisco, CA' },
      { id: userId2, full_name: 'City Food Bank', email: 'info@cityfoodbank.org', role: 'organization', location: 'Oakland, CA' },
      { id: userId3, full_name: 'Alex Johnson', email: 'alex@example.com', role: 'volunteer', location: 'San Francisco, CA' },
      { id: userId4, full_name: 'Jordan Lee', email: 'jordan@example.com', role: 'volunteer', location: 'Berkeley, CA' },
    ],
    passwords: {
      'contact@greenearth.org': 'demo1234',
      'info@cityfoodbank.org': 'demo1234',
      'alex@example.com': 'demo1234',
      'jordan@example.com': 'demo1234',
    },
    organizations: [
      {
        id: orgId1, user_id: userId1,
        name: 'Green Earth Foundation',
        description: 'Dedicated to environmental conservation and sustainability through community action.',
        location: 'San Francisco, CA',
        contact_email: 'contact@greenearth.org',
      },
      {
        id: orgId2, user_id: userId2,
        name: 'City Food Bank',
        description: 'Fighting hunger in the Bay Area by distributing nutritious food to families in need.',
        location: 'Oakland, CA',
        contact_email: 'info@cityfoodbank.org',
      },
    ],
    volunteer_profiles: [
      {
        id: volId1, user_id: userId3,
        skills: ['physical_labor', 'organization', 'communication'],
        interests: ['environment', 'community'],
        availability: 'weekends',
        confirmed_hours: 12,
      },
      {
        id: volId2, user_id: userId4,
        skills: ['technology', 'tutoring', 'communication'],
        interests: ['education', 'technology'],
        availability: 'weekdays',
        confirmed_hours: 8,
      },
    ],
    events: [
      {
        id: 'event-1',
        organization_id: orgId1,
        organization_name: 'Green Earth Foundation',
        title: 'Golden Gate Park Cleanup',
        description: 'Join us for a morning of cleaning up Golden Gate Park. We will collect litter, remove invasive plants, and help restore native habitat. Gloves and tools provided. Great opportunity to make a visible difference in our community park!',
        category: 'environment',
        date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        time: '09:00',
        location: 'Golden Gate Park, San Francisco, CA',
        required_skills: ['physical_labor', 'organization'],
        capacity: 20,
        spots_taken: 7,
        is_emergency: false,
        status: 'published',
      },
      {
        id: 'event-2',
        organization_id: orgId2,
        organization_name: 'City Food Bank',
        title: 'Community Food Distribution Day',
        description: 'Help us pack and distribute food boxes to 500+ families across Oakland. Volunteers will sort donations, pack boxes, and assist with distribution. No experience necessary — just a willing heart and comfortable shoes!',
        category: 'hunger_relief',
        date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        time: '08:00',
        location: '123 Main Street, Oakland, CA',
        required_skills: ['physical_labor', 'organization', 'communication'],
        capacity: 15,
        spots_taken: 12,
        is_emergency: false,
        status: 'published',
      },
      {
        id: 'event-3',
        organization_id: orgId1,
        organization_name: 'Green Earth Foundation',
        title: 'Digital Literacy Workshop for Seniors',
        description: 'Teach basic smartphone and computer skills to senior residents at Sunset Community Center. Volunteers will work one-on-one with seniors to help them video call family members, navigate the internet safely, and use helpful apps.',
        category: 'education',
        date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        time: '14:00',
        location: 'Sunset Community Center, SF',
        required_skills: ['technology', 'tutoring', 'communication'],
        capacity: 10,
        spots_taken: 3,
        is_emergency: false,
        status: 'published',
      },
      {
        id: 'event-4',
        organization_id: orgId2,
        organization_name: 'City Food Bank',
        title: '🚨 Emergency Supply Distribution — Storm Response',
        description: 'URGENT: Following severe storm damage in East Oakland, we need volunteers to help sort and distribute emergency supplies (food, water, blankets) at our safe distribution center. No outdoor exposure required — all activities are indoors at our warehouse.',
        category: 'emergency',
        date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
        time: '07:00',
        location: '456 Harbor Blvd, Oakland, CA (Indoor Warehouse)',
        required_skills: ['physical_labor', 'organization'],
        capacity: 25,
        spots_taken: 18,
        is_emergency: true,
        status: 'published',
      },
      {
        id: 'event-5',
        organization_id: orgId1,
        organization_name: 'Green Earth Foundation',
        title: 'Ocean Beach Cleanup',
        description: 'Help keep our coastline clean! Volunteers will collect marine debris along Ocean Beach. All supplies provided. This event runs rain or shine.',
        category: 'environment',
        date: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        time: '10:00',
        location: 'Ocean Beach, San Francisco, CA',
        required_skills: ['physical_labor'],
        capacity: 30,
        spots_taken: 5,
        is_emergency: false,
        status: 'published',
      },
      {
        id: 'event-6',
        organization_id: orgId2,
        organization_name: 'City Food Bank',
        title: 'ESL Conversation Partners',
        description: 'Volunteer as an English conversation partner for adult immigrants and refugees. No teaching experience necessary — just patience and enthusiasm! Sessions are casual conversations to help build confidence.',
        category: 'education',
        date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        time: '18:00',
        location: 'Oakland Public Library, Oakland, CA',
        required_skills: ['communication', 'tutoring'],
        capacity: 12,
        spots_taken: 4,
        is_emergency: false,
        status: 'published',
      },
    ],
    registrations: [],
    invitations: [],
    currentUser: null,
  };
}

export function getState() {
  const saved = loadState();
  if (saved) return saved;
  const fresh = initState();
  saveState(fresh);
  return fresh;
}

export function setState(updater) {
  const state = getState();
  const next = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  saveState(next);
  return next;
}

export function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  return getState();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function demoLogin(email, password) {
  const state = getState();
  if (state.passwords[email] !== password) return { error: 'Invalid email or password.' };
  const user = state.users.find(u => u.email === email);
  if (!user) return { error: 'User not found.' };
  setState(s => ({ ...s, currentUser: user }));
  return { user };
}

export function demoSignup({ email, password, full_name, role, location, description, skills, interests, availability }) {
  const state = getState();
  if (state.users.find(u => u.email === email)) return { error: 'An account with this email already exists.' };

  const userId = 'user-' + uid();
  const newUser = { id: userId, full_name, email, role, location };

  const updates = {
    users: [...state.users, newUser],
    passwords: { ...state.passwords, [email]: password },
    currentUser: newUser,
  };

  if (role === 'organization') {
    const orgId = 'org-' + uid();
    updates.organizations = [...state.organizations, {
      id: orgId, user_id: userId,
      name: full_name, description: description || '', location, contact_email: email,
    }];
  } else {
    const volId = 'vol-' + uid();
    updates.volunteer_profiles = [...state.volunteer_profiles, {
      id: volId, user_id: userId,
      skills: skills || [],
      interests: interests || [],
      availability: availability || '',
      confirmed_hours: 0,
    }];
  }

  setState(s => ({ ...s, ...updates }));
  return { user: newUser };
}

export function demoLogout() {
  setState(s => ({ ...s, currentUser: null }));
}

export function demoCurrentUser() {
  return getState().currentUser;
}

// ── Events ────────────────────────────────────────────────────────────────────

export function demoGetEvents({ category, search, location, isEmergency } = {}) {
  let events = getState().events.filter(e => e.status === 'published');
  if (isEmergency) events = events.filter(e => e.is_emergency);
  if (category && category !== 'all') events = events.filter(e => e.category === category);
  if (location) events = events.filter(e => e.location.toLowerCase().includes(location.toLowerCase()));
  if (search) {
    const q = search.toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.organization_name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  }
  return events;
}

export function demoGetEvent(id) {
  return getState().events.find(e => e.id === id) || null;
}

export function demoCreateEvent(orgUserId, data) {
  const state = getState();
  const org = state.organizations.find(o => o.user_id === orgUserId);
  if (!org) return { error: 'Organization not found.' };

  const event = {
    id: 'event-' + uid(),
    organization_id: org.id,
    organization_name: org.name,
    spots_taken: 0,
    status: data.is_emergency ? 'pending_approval' : 'published',
    ...data,
  };
  setState(s => ({ ...s, events: [...s.events, event] }));
  return { event };
}

export function demoUpdateEvent(eventId, orgUserId, data) {
  const state = getState();
  const org = state.organizations.find(o => o.user_id === orgUserId);
  if (!org) return { error: 'Not authorized.' };

  const events = state.events.map(e => {
    if (e.id !== eventId || e.organization_id !== org.id) return e;
    return { ...e, ...data };
  });
  setState(s => ({ ...s, events }));
  return { success: true };
}

export function demoDeleteEvent(eventId, orgUserId) {
  const state = getState();
  const org = state.organizations.find(o => o.user_id === orgUserId);
  if (!org) return { error: 'Not authorized.' };

  setState(s => ({
    ...s,
    events: s.events.filter(e => !(e.id === eventId && e.organization_id === org.id)),
    registrations: s.registrations.filter(r => r.event_id !== eventId),
  }));
  return { success: true };
}

export function demoGetOrgEvents(orgUserId) {
  const state = getState();
  const org = state.organizations.find(o => o.user_id === orgUserId);
  if (!org) return [];
  return state.events.filter(e => e.organization_id === org.id);
}

// ── Registrations ─────────────────────────────────────────────────────────────

export function demoRegister(eventId, volunteerId) {
  const state = getState();
  const event = state.events.find(e => e.id === eventId);
  if (!event) return { error: 'Event not found.' };
  if (event.spots_taken >= event.capacity) return { error: 'This event is full.' };

  const existing = state.registrations.find(r => r.event_id === eventId && r.volunteer_user_id === volunteerId);
  if (existing) return { error: 'You are already registered for this event.' };

  // Check for time conflict
  const conflict = state.registrations.find(r => {
    if (r.volunteer_user_id !== volunteerId || r.status === 'cancelled') return false;
    const e = state.events.find(ev => ev.id === r.event_id);
    return e && e.date === event.date && e.time === event.time;
  });
  if (conflict) return { error: 'You already have another event at the same time.' };

  const reg = {
    id: 'reg-' + uid(),
    event_id: eventId,
    volunteer_user_id: volunteerId,
    status: 'registered',
    attendance_status: 'pending',
    confirmed_hours: null,
    registered_at: new Date().toISOString(),
  };

  const events = state.events.map(e =>
    e.id === eventId ? { ...e, spots_taken: e.spots_taken + 1 } : e
  );

  setState(s => ({ ...s, registrations: [...s.registrations, reg], events }));
  return { registration: reg };
}

export function demoCancelRegistration(eventId, volunteerId) {
  const state = getState();
  const reg = state.registrations.find(r => r.event_id === eventId && r.volunteer_user_id === volunteerId);
  if (!reg) return { error: 'Registration not found.' };

  const registrations = state.registrations.map(r =>
    r.id === reg.id ? { ...r, status: 'cancelled' } : r
  );
  const events = state.events.map(e =>
    e.id === eventId ? { ...e, spots_taken: Math.max(0, e.spots_taken - 1) } : e
  );

  setState(s => ({ ...s, registrations, events }));
  return { success: true };
}

export function demoGetVolunteerRegistrations(volunteerId) {
  const state = getState();
  return state.registrations
    .filter(r => r.volunteer_user_id === volunteerId && r.status !== 'cancelled')
    .map(r => ({ ...r, event: state.events.find(e => e.id === r.event_id) }))
    .filter(r => r.event);
}

export function demoGetEventRegistrations(eventId, orgUserId) {
  const state = getState();
  const org = state.organizations.find(o => o.user_id === orgUserId);
  const event = state.events.find(e => e.id === eventId);
  if (!org || !event || event.organization_id !== org.id) return [];

  return state.registrations
    .filter(r => r.event_id === eventId && r.status !== 'cancelled')
    .map(r => ({
      ...r,
      volunteer: state.users.find(u => u.id === r.volunteer_user_id),
      profile: state.volunteer_profiles.find(p => p.user_id === r.volunteer_user_id),
    }))
    .filter(r => r.volunteer);
}

export function demoConfirmAttendance(registrationId, hours, orgUserId) {
  const state = getState();
  const reg = state.registrations.find(r => r.id === registrationId);
  if (!reg) return { error: 'Registration not found.' };

  const registrations = state.registrations.map(r =>
    r.id === registrationId
      ? { ...r, attendance_status: 'confirmed', confirmed_hours: hours }
      : r
  );

  const profiles = state.volunteer_profiles.map(p =>
    p.user_id === reg.volunteer_user_id
      ? { ...p, confirmed_hours: (p.confirmed_hours || 0) + hours }
      : p
  );

  setState(s => ({ ...s, registrations, volunteer_profiles: profiles }));
  return { success: true };
}

// ── Invitations ───────────────────────────────────────────────────────────────

export function demoSendInvitation(eventId, volunteerUserId, orgUserId) {
  const state = getState();
  const existing = state.invitations.find(
    i => i.event_id === eventId && i.volunteer_user_id === volunteerUserId && i.status !== 'declined'
  );
  if (existing) return { error: 'An invitation has already been sent.' };

  const reg = state.registrations.find(
    r => r.event_id === eventId && r.volunteer_user_id === volunteerUserId && r.status !== 'cancelled'
  );
  if (reg) return { error: 'This volunteer is already registered.' };

  const inv = {
    id: 'inv-' + uid(),
    event_id: eventId,
    volunteer_user_id: volunteerUserId,
    org_user_id: orgUserId,
    status: 'pending',
    sent_at: new Date().toISOString(),
  };
  setState(s => ({ ...s, invitations: [...s.invitations, inv] }));
  return { invitation: inv };
}

export function demoRespondInvitation(invitationId, accept, volunteerId) {
  const state = getState();
  const inv = state.invitations.find(i => i.id === invitationId && i.volunteer_user_id === volunteerId);
  if (!inv) return { error: 'Invitation not found.' };

  const invitations = state.invitations.map(i =>
    i.id === invitationId ? { ...i, status: accept ? 'accepted' : 'declined' } : i
  );
  setState(s => ({ ...s, invitations }));

  if (accept) {
    return demoRegister(inv.event_id, volunteerId);
  }
  return { success: true };
}

export function demoGetVolunteerInvitations(volunteerId) {
  const state = getState();
  return state.invitations
    .filter(i => i.volunteer_user_id === volunteerId && i.status === 'pending')
    .map(i => ({ ...i, event: state.events.find(e => e.id === i.event_id) }))
    .filter(i => i.event);
}

// ── Volunteer Profile ─────────────────────────────────────────────────────────

export function demoGetProfile(userId) {
  const state = getState();
  const user = state.users.find(u => u.id === userId);
  const profile = state.volunteer_profiles.find(p => p.user_id === userId);
  return { user, profile };
}

export function demoUpdateProfile(userId, data) {
  const state = getState();
  const users = state.users.map(u => u.id === userId ? { ...u, ...data.user } : u);
  const profiles = state.volunteer_profiles.map(p =>
    p.user_id === userId ? { ...p, ...data.profile } : p
  );
  const updated = { ...state, users, volunteer_profiles: profiles };
  if (state.currentUser?.id === userId) updated.currentUser = { ...state.currentUser, ...data.user };
  setState(updated);
  return { success: true };
}

// ── Volunteer Search ──────────────────────────────────────────────────────────

export function demoSearchVolunteers({ skills, availability, location } = {}) {
  const state = getState();
  return state.volunteer_profiles
    .map(p => {
      const user = state.users.find(u => u.id === p.user_id);
      if (!user || user.role !== 'volunteer') return null;
      const matchedSkills = skills?.length ? skills.filter(s => p.skills.includes(s)) : p.skills;
      const matchScore = skills?.length ? Math.round((matchedSkills.length / skills.length) * 100) : 100;
      return { ...p, user, matchedSkills, matchScore };
    })
    .filter(Boolean)
    .filter(v => {
      if (availability && v.availability !== availability) return false;
      if (location && !v.user.location.toLowerCase().includes(location.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ── Matching ──────────────────────────────────────────────────────────────────

export function demoGetMatchingVolunteers(eventId, orgUserId) {
  const state = getState();
  const event = state.events.find(e => e.id === eventId);
  if (!event) return [];
  return demoSearchVolunteers({ skills: event.required_skills });
}
