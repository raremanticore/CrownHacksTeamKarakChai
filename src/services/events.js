import { isSupabaseConfigured, getSupabase } from './supabase.js';
import {
  demoGetEvents, demoGetEvent, demoCreateEvent, demoUpdateEvent, demoDeleteEvent,
  demoGetOrgEvents, demoRegister, demoCancelRegistration, demoGetVolunteerRegistrations,
  demoGetEventRegistrations, demoConfirmAttendance,
  demoSendInvitation, demoRespondInvitation, demoGetVolunteerInvitations,
  demoGetMatchingVolunteers, demoSearchVolunteers,
} from './demo.js';

// ── Events ────────────────────────────────────────────────────────────────────

export async function getEvents(filters = {}) {
  if (!isSupabaseConfigured()) return demoGetEvents(filters);

  const sb = getSupabase();
  let q = sb.from('events').select('*, organizations(name)').eq('status', 'published');

  if (filters.isEmergency) q = q.eq('is_emergency', true);
  if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category);
  if (filters.search) q = q.ilike('title', `%${filters.search}%`);
  if (filters.location) q = q.ilike('location', `%${filters.location}%`);

  const { data, error } = await q.order('date', { ascending: true });
  if (error) {
    console.error('VOLO: Unable to load events from Supabase.', error);
    throw new Error(error.message);
  }
  return applyAvailability(sb, (data || []).map(e => ({ ...e, organization_name: e.organizations?.name })));
}

export async function getEvent(id) {
  if (!isSupabaseConfigured()) return demoGetEvent(id);

  const sb = getSupabase();
  const { data, error } = await sb.from('events')
    .select('*, organizations(name, description, contact_email)')
    .eq('id', id)
    .single();
  if (error) return null;
  const [event] = await applyAvailability(sb, [{ ...data, organization_name: data.organizations?.name }]);
  return event;
}

async function applyAvailability(sb, events) {
  if (!events.length) return events;
  const { data, error } = await sb.rpc('get_event_spots', {
    event_ids: events.map(event => event.id),
  });
  if (error) {
    console.warn('VOLO: Event availability RPC is unavailable; using stored counts.', error);
    return events;
  }

  const counts = new Map((data || []).map(row => [row.event_id, Number(row.spots_taken)]));
  return events.map(event => ({
    ...event,
    spots_taken: counts.has(event.id) ? counts.get(event.id) : event.spots_taken,
  }));
}

export async function createEvent(orgUserId, data) {
  if (!isSupabaseConfigured()) return demoCreateEvent(orgUserId, data);

  const sb = getSupabase();
  const { data: org } = await sb.from('organizations').select('id').eq('user_id', orgUserId).single();
  if (!org) return { error: 'Organization not found.' };

  const { data: event, error } = await sb.from('events').insert({
    ...data,
    organization_id: org.id,
    spots_taken: 0,
    status: data.is_emergency ? 'pending_approval' : 'published',
  }).select().single();

  if (error) return { error: error.message };
  return { event };
}

export async function updateEvent(eventId, orgUserId, data) {
  if (!isSupabaseConfigured()) return demoUpdateEvent(eventId, orgUserId, data);

  const sb = getSupabase();
  const { data: org } = await sb.from('organizations').select('id').eq('user_id', orgUserId).single();
  if (!org) return { error: 'Not authorized.' };

  const { error } = await sb.from('events')
    .update(data)
    .eq('id', eventId)
    .eq('organization_id', org.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteEvent(eventId, orgUserId) {
  if (!isSupabaseConfigured()) return demoDeleteEvent(eventId, orgUserId);

  const sb = getSupabase();
  const { data: org } = await sb.from('organizations').select('id').eq('user_id', orgUserId).single();
  if (!org) return { error: 'Not authorized.' };

  const { error } = await sb.from('events').delete().eq('id', eventId).eq('organization_id', org.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getOrgEvents(orgUserId) {
  if (!isSupabaseConfigured()) return demoGetOrgEvents(orgUserId);

  const sb = getSupabase();
  const { data: org } = await sb.from('organizations').select('id').eq('user_id', orgUserId).single();
  if (!org) return [];

  const { data, error } = await sb.from('events')
    .select('*, event_registrations(id, status)')
    .eq('organization_id', org.id)
    .order('date');
  if (error) {
    console.error('VOLO: Unable to load organization events.', error);
    return [];
  }

  return (data || []).map(event => ({
    ...event,
    spots_taken: (event.event_registrations || [])
      .filter(registration => registration.status !== 'cancelled').length,
  }));
}

// ── Registrations ─────────────────────────────────────────────────────────────

export async function registerForEvent(eventId, volunteerId) {
  if (!isSupabaseConfigured()) return demoRegister(eventId, volunteerId);

  const sb = getSupabase();
  const { data: event } = await sb.from('events').select('capacity, spots_taken').eq('id', eventId).single();
  if (!event) return { error: 'Event not found.' };
  const { data: availability } = await sb.rpc('get_event_spots', { event_ids: [eventId] });
  const spotsTaken = availability?.[0]?.spots_taken ?? event.spots_taken;
  if (spotsTaken >= event.capacity) return { error: 'This event is full.' };

  const { data: existing } = await sb.from('event_registrations')
    .select('id').eq('event_id', eventId).eq('volunteer_user_id', volunteerId).single();
  if (existing) return { error: 'You are already registered for this event.' };

  const { data: reg, error } = await sb.from('event_registrations').insert({
    event_id: eventId, volunteer_user_id: volunteerId,
    status: 'registered', attendance_status: 'pending',
  }).select().single();

  if (error) return { error: error.message };

  await sb.from('events').update({ spots_taken: event.spots_taken + 1 }).eq('id', eventId);
  return { registration: reg };
}

export async function cancelRegistration(eventId, volunteerId) {
  if (!isSupabaseConfigured()) return demoCancelRegistration(eventId, volunteerId);

  const sb = getSupabase();
  const { error } = await sb.from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('volunteer_user_id', volunteerId);

  if (error) return { error: error.message };

  const { data: event } = await sb.from('events').select('spots_taken').eq('id', eventId).single();
  if (event) {
    await sb.from('events').update({ spots_taken: Math.max(0, event.spots_taken - 1) }).eq('id', eventId);
  }

  return { success: true };
}

export async function getVolunteerRegistrations(volunteerId) {
  if (!isSupabaseConfigured()) return demoGetVolunteerRegistrations(volunteerId);

  const sb = getSupabase();
  const { data } = await sb.from('event_registrations')
    .select('*, events(*)')
    .eq('volunteer_user_id', volunteerId)
    .neq('status', 'cancelled')
    .order('registered_at', { ascending: false });

  return (data || []).map(r => ({ ...r, event: r.events }));
}

export async function getEventRegistrations(eventId, orgUserId) {
  if (!isSupabaseConfigured()) return demoGetEventRegistrations(eventId, orgUserId);

  const sb = getSupabase();
  const { data, error } = await sb.from('event_registrations')
    .select('*, users(full_name, email, location)')
    .eq('event_id', eventId)
    .neq('status', 'cancelled');

  if (error) {
    console.error('VOLO: Unable to load event registrations.', error);
    throw new Error(error.message);
  }

  const registrations = data || [];
  const userIds = registrations.map(registration => registration.volunteer_user_id);
  const { data: profiles, error: profileError } = userIds.length
    ? await sb.from('volunteer_profiles').select('user_id, skills, confirmed_hours').in('user_id', userIds)
    : { data: [], error: null };

  if (profileError) {
    console.error('VOLO: Unable to load volunteer profiles.', profileError);
    throw new Error(profileError.message);
  }

  const profilesByUserId = new Map((profiles || []).map(profile => [profile.user_id, profile]));
  return registrations.map(registration => ({
    ...registration,
    volunteer: registration.users,
    profile: profilesByUserId.get(registration.volunteer_user_id),
  }));
}

export async function confirmAttendance(registrationId, hours, orgUserId) {
  if (!isSupabaseConfigured()) return demoConfirmAttendance(registrationId, hours, orgUserId);

  const sb = getSupabase();
  const { error } = await sb.from('event_registrations')
    .update({ attendance_status: 'confirmed', confirmed_hours: hours })
    .eq('id', registrationId);

  if (error) return { error: error.message };
  return { success: true };
}

// ── Invitations ───────────────────────────────────────────────────────────────

export async function sendInvitation(eventId, volunteerUserId, orgUserId) {
  if (!isSupabaseConfigured()) return demoSendInvitation(eventId, volunteerUserId, orgUserId);

  const sb = getSupabase();
  const { data: existing } = await sb.from('event_invitations')
    .select('id').eq('event_id', eventId).eq('volunteer_user_id', volunteerUserId).neq('status', 'declined').single();
  if (existing) return { error: 'An invitation has already been sent.' };

  const { data: inv, error } = await sb.from('event_invitations').insert({
    event_id: eventId, volunteer_user_id: volunteerUserId, org_user_id: orgUserId, status: 'pending',
  }).select().single();

  if (error) return { error: error.message };
  return { invitation: inv };
}

export async function respondInvitation(invitationId, accept, volunteerId) {
  if (!isSupabaseConfigured()) return demoRespondInvitation(invitationId, accept, volunteerId);

  const sb = getSupabase();
  await sb.from('event_invitations').update({ status: accept ? 'accepted' : 'declined' }).eq('id', invitationId);
  if (accept) {
    const { data: inv } = await sb.from('event_invitations').select('event_id').eq('id', invitationId).single();
    if (inv) return registerForEvent(inv.event_id, volunteerId);
  }
  return { success: true };
}

export async function getVolunteerInvitations(volunteerId) {
  if (!isSupabaseConfigured()) return demoGetVolunteerInvitations(volunteerId);

  const sb = getSupabase();
  const { data } = await sb.from('event_invitations')
    .select('*, events(*)')
    .eq('volunteer_user_id', volunteerId)
    .eq('status', 'pending');

  return (data || []).map(i => ({ ...i, event: i.events }));
}

// ── Volunteer Search & Matching ───────────────────────────────────────────────

export async function searchVolunteers(filters = {}) {
  if (!isSupabaseConfigured()) return demoSearchVolunteers(filters);

  const sb = getSupabase();
  let q = sb.from('volunteer_profiles').select('*, users(full_name, email, location)').eq('users.role', 'volunteer');

  const { data: profiles } = await q;
  if (!profiles) return [];

  return profiles
    .map(p => ({
      ...p,
      user: p.users,
      matchedSkills: filters.skills?.length ? filters.skills.filter(s => p.skills?.includes(s)) : p.skills || [],
      matchScore: filters.skills?.length
        ? Math.round(((filters.skills.filter(s => p.skills?.includes(s)).length) / filters.skills.length) * 100)
        : 100,
    }))
    .filter(p => p.user)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function getMatchingVolunteers(eventId, orgUserId) {
  if (!isSupabaseConfigured()) return demoGetMatchingVolunteers(eventId, orgUserId);

  const event = await getEvent(eventId);
  if (!event) return [];
  return searchVolunteers({ skills: event.required_skills });
}
