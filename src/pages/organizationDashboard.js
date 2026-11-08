import { getCurrentUser } from '../services/auth.js';
import { getOrgEvents, createEvent, updateEvent, deleteEvent, getEventRegistrations, confirmAttendance, sendInvitation, searchVolunteers, getMatchingVolunteers } from '../services/events.js';
import { getState } from '../services/demo.js';
import { SKILLS, CATEGORIES, getSkillLabel, getSkillIcon, getCategoryLabel, getCategoryIcon, formatDate, formatTime, isEventPast } from '../services/matching.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../main.js';

let currentSection = 'events';
let orgUser = null;
let orgEvents = [];

export async function renderOrgDashboard() {
  const content = document.getElementById('page-content');
  orgUser = await getCurrentUser();
  if (!orgUser || orgUser.role !== 'organization') { navigate('/'); return; }

  const state = getState();
  const org = state.organizations.find(o => o.user_id === orgUser.id);

  content.innerHTML = `
    <div class="page-header">
      <div class="container">
        <h1>Organization Dashboard</h1>
        <p>Manage your events, recruit volunteers, and track participation.</p>
      </div>
    </div>

    <div class="container">
      <div class="org-layout">
        <!-- Sidebar Nav -->
        <aside class="org-sidebar">
          <div class="card card-body" style="margin-bottom:16px;text-align:center;">
            <div style="width:60px;height:60px;border-radius:var(--radius-lg);background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));display:flex;align-items:center;justify-content:center;font-size:24px;color:white;font-weight:800;margin:0 auto 12px;">
              ${escapeHtml((org?.name || orgUser.full_name)[0])}
            </div>
            <div style="font-weight:700;font-size:16px;">${escapeHtml(org?.name || orgUser.full_name)}</div>
            <div class="badge badge-primary" style="margin-top:6px;">Organization</div>
            ${org?.location ? `<div style="font-size:12px;color:var(--color-text-secondary);margin-top:8px;">${escapeHtml(org.location)}</div>` : ''}
          </div>

          <nav class="org-nav">
            <div class="org-nav-item ${currentSection === 'events' ? 'active' : ''}" data-section="events">
              <span class="org-nav-icon">My Events</span>
            </div>
            <div class="org-nav-item ${currentSection === 'create' ? 'active' : ''}" data-section="create">
              <span class="org-nav-icon">Create Event</span>
            </div>
            <div class="org-nav-item ${currentSection === 'volunteers' ? 'active' : ''}" data-section="volunteers">
              <span class="org-nav-icon">Find Volunteers</span>
            </div>
            <div class="org-nav-item ${currentSection === 'registrations' ? 'active' : ''}" data-section="registrations">
              <span class="org-nav-icon">👥</span> Registrations
            </div>
          </nav>
        </aside>

        <!-- Main Content -->
        <div id="org-main-content">
          <div class="loading-container"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;

  // Nav clicks
  content.querySelectorAll('.org-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      currentSection = item.dataset.section;
      content.querySelectorAll('.org-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      renderSection();
    });
  });

  orgEvents = await getOrgEvents(orgUser.id);
  renderSection();
}

async function renderSection() {
  const main = document.getElementById('org-main-content');
  if (!main) return;

  switch (currentSection) {
    case 'events': renderEventsSection(main); break;
    case 'create': renderCreateEventSection(main); break;
    case 'volunteers': await renderVolunteersSection(main); break;
    case 'registrations': await renderRegistrationsSection(main); break;
  }
}

// ── EVENTS SECTION ────────────────────────────────────────────────────────────

function renderEventsSection(container) {
  const totalRegs = orgEvents.reduce((sum, e) => sum + (e.spots_taken || 0), 0);
  const upcoming = orgEvents.filter(e => !isEventPast(e.date));
  const past = orgEvents.filter(e => isEventPast(e.date));

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      <h2 class="section-title" style="margin-bottom:0;">My Events</h2>
      <button class="btn btn-primary" id="create-event-quick-btn">Create Event</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;">
      <div class="stat-card">
        <div class="stat-icon">Events</div>
        <div class="stat-value">${orgEvents.length}</div>
        <div class="stat-label">Total Events</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${totalRegs}</div>
        <div class="stat-label">Total Registrations</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🟢</div>
        <div class="stat-value">${upcoming.length}</div>
        <div class="stat-label">Upcoming Events</div>
      </div>
    </div>

    ${orgEvents.length === 0 ? `
      <div class="empty-state">
        <h3>No events yet</h3>
        <p>Create your first event to start recruiting volunteers.</p>
        <button class="btn btn-primary" id="create-first-event-btn">Create First Event</button>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:14px;" id="events-list">
        ${orgEvents.map(e => renderOrgEventRow(e)).join('')}
      </div>
    `}
  `;

  document.getElementById('create-event-quick-btn')?.addEventListener('click', () => {
    currentSection = 'create';
    document.querySelector('[data-section="create"]')?.classList.add('active');
    document.querySelector('[data-section="events"]')?.classList.remove('active');
    renderSection();
  });
  document.getElementById('create-first-event-btn')?.addEventListener('click', () => {
    currentSection = 'create';
    renderSection();
  });

  container.querySelectorAll('[data-delete-event]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Delete this event? This cannot be undone.')) return;
      btn.disabled = true;
      const result = await deleteEvent(btn.dataset.deleteEvent, orgUser.id);
      if (result.error) showToast(result.error, 'error');
      else {
        showToast('Event deleted.', 'info');
        orgEvents = await getOrgEvents(orgUser.id);
        renderSection();
      }
    });
  });

  container.querySelectorAll('[data-view-regs]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      currentSection = 'registrations';
      document.querySelectorAll('.org-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelector('[data-section="registrations"]')?.classList.add('active');
      renderSection();
    });
  });
}

function renderOrgEventRow(event) {
  const isPast = isEventPast(event.date);
  const spotsLeft = event.capacity - event.spots_taken;
  const isFull = spotsLeft <= 0;

  return `
    <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:18px 20px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow-sm);">
      <div style="width:44px;height:44px;border-radius:var(--radius-md);background:${event.is_emergency ? 'var(--color-emergency-light)' : 'var(--color-primary-light)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">
        ${event.is_emergency ? '🚨' : getCategoryIcon(event.category)}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:15px;margin-bottom:2px;display:flex;align-items:center;gap:8px;">
          ${escapeHtml(event.title)}
          ${event.is_emergency ? `<span class="badge badge-emergency" style="font-size:10px;">URGENT</span>` : ''}
          ${isPast ? `<span class="badge badge-ghost" style="font-size:10px;">PAST</span>` : ''}
        </div>
        <div style="font-size:12px;color:var(--color-text-secondary);">
          ${formatDate(event.date)} · ${formatTime(event.time)} · ${escapeHtml(event.location)}
        </div>
        <div style="font-size:12px;margin-top:4px;">
          <span style="color:${isFull ? 'var(--color-danger)' : 'var(--color-primary)'};font-weight:600;">
            ${event.spots_taken}/${event.capacity} volunteers
          </span>
          <span style="color:var(--color-text-muted);margin-left:8px;">
            ${event.status === 'pending_approval' ? 'Pending approval' : 'Published'}
          </span>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="btn btn-ghost btn-sm" data-view-regs="${event.id}">👥 Volunteers</button>
        <button class="btn btn-danger btn-sm" data-delete-event="${event.id}">Delete</button>
      </div>
    </div>
  `;
}

// ── CREATE EVENT SECTION ──────────────────────────────────────────────────────

function renderCreateEventSection(container) {
  container.innerHTML = `
    <h2 class="section-title">Create New Event</h2>
    <div class="card card-body">
      <form id="create-event-form" style="display:flex;flex-direction:column;gap:18px;">

        <div class="form-group">
          <label class="form-label">Event Title *</label>
          <input type="text" class="form-control" name="title" placeholder="e.g., Community Park Cleanup" required />
        </div>

        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea class="form-control" name="description" rows="4" placeholder="Describe the event, what volunteers will do, and what to bring..." required></textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input type="date" class="form-control" name="date" required min="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label">Start Time *</label>
            <input type="time" class="form-control" name="time" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Location *</label>
          <input type="text" class="form-control" name="location" placeholder="Full address or venue name" required />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select class="form-control" name="category" required>
              ${CATEGORIES.filter(c => c.id !== 'all').map(c => `
                <option value="${c.id}">${c.icon} ${c.label}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Volunteer Capacity *</label>
            <input type="number" class="form-control" name="capacity" min="1" max="1000" value="10" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Required Skills</label>
          <div class="skill-grid">
            ${SKILLS.map(s => `
              <div>
                <input type="checkbox" class="skill-checkbox" id="create-skill-${s.id}" name="required_skills" value="${s.id}" />
                <label class="skill-label" for="create-skill-${s.id}">
                  <span class="skill-icon">${s.icon}</span> ${s.label}
                </label>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" name="is_emergency" style="width:18px;height:18px;accent-color:var(--color-emergency);" />
            <span>
              <strong style="color:var(--color-emergency);">🚨 Mark as Emergency Event</strong>
              <span style="display:block;font-size:12px;color:var(--color-text-secondary);">Emergency events require approval before publication.</span>
            </span>
          </label>
        </div>

        <div style="display:flex;gap:12px;justify-content:flex-end;padding-top:8px;">
          <button type="button" class="btn btn-ghost" id="cancel-create-btn">Cancel</button>
          <button type="submit" class="btn btn-primary btn-lg">🚀 Create Event</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('cancel-create-btn')?.addEventListener('click', () => {
    currentSection = 'events';
    document.querySelectorAll('.org-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-section="events"]')?.classList.add('active');
    renderSection();
  });

  document.getElementById('create-event-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const skills = Array.from(e.target.querySelectorAll('input[name="required_skills"]:checked')).map(el => el.value);
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating...';

    const result = await createEvent(orgUser.id, {
      title: data.get('title'),
      description: data.get('description'),
      date: data.get('date'),
      time: data.get('time'),
      location: data.get('location'),
      category: data.get('category'),
      capacity: parseInt(data.get('capacity')),
      required_skills: skills,
      is_emergency: data.get('is_emergency') === 'on',
    });

    if (result.error) {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = '🚀 Create Event';
    } else {
      orgEvents = await getOrgEvents(orgUser.id);
      showToast(
        result.event.status === 'pending_approval'
          ? 'Emergency event submitted for approval! 🚨'
          : 'Event created and published successfully! 🎉',
        'success'
      );
      currentSection = 'events';
      document.querySelectorAll('.org-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelector('[data-section="events"]')?.classList.add('active');
      renderSection();
    }
  });
}

// ── VOLUNTEERS SECTION ────────────────────────────────────────────────────────

async function renderVolunteersSection(container) {
  container.innerHTML = `
    <h2 class="section-title">Find Volunteers</h2>

    <div class="card card-body" style="margin-bottom:20px;">
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div class="search-bar" style="flex:1;min-width:200px;">
          <input type="text" class="search-input" id="vol-location-filter" placeholder="Filter by location..." />
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <label class="form-label" style="font-size:12px;">Filter by Event (for matching)</label>
          <select class="form-control" id="vol-event-filter" style="min-width:200px;">
            <option value="">All volunteers</option>
            ${orgEvents.filter(e => !isEventPast(e.date)).map(e => `
              <option value="${e.id}">${escapeHtml(e.title)}</option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <div id="volunteers-results">
      <div class="loading-container"><div class="spinner"></div></div>
    </div>
  `;

  await loadVolunteers();

  let locationTimer;
  document.getElementById('vol-location-filter')?.addEventListener('input', e => {
    clearTimeout(locationTimer);
    locationTimer = setTimeout(() => loadVolunteers(), 400);
  });

  document.getElementById('vol-event-filter')?.addEventListener('change', () => loadVolunteers());
}

async function loadVolunteers() {
  const resultsEl = document.getElementById('volunteers-results');
  if (!resultsEl) return;

  const locationVal = document.getElementById('vol-location-filter')?.value || '';
  const eventId = document.getElementById('vol-event-filter')?.value || '';

  resultsEl.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;

  let volunteers;
  if (eventId) {
    volunteers = await getMatchingVolunteers(eventId, orgUser.id);
  } else {
    volunteers = await searchVolunteers({ location: locationVal });
  }

  if (locationVal && !eventId) {
    volunteers = volunteers.filter(v => v.user?.location?.toLowerCase().includes(locationVal.toLowerCase()));
  }

  if (!volunteers.length) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <h3>No volunteers found</h3>
        <p>Try adjusting your filters.</p>
      </div>
    `;
    return;
  }

  resultsEl.innerHTML = `
    <div style="margin-bottom:12px;font-size:13px;color:var(--color-text-secondary);">
      ${volunteers.length} volunteer${volunteers.length !== 1 ? 's' : ''} found
      ${eventId ? ' — sorted by skill match' : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${volunteers.map(v => renderVolunteerCard(v, eventId)).join('')}
    </div>
  `;

  resultsEl.querySelectorAll('[data-invite-vol]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = document.getElementById('vol-event-filter')?.value;
      if (!eventId) {
        showToast('Select an event first to send an invitation.', 'warning');
        return;
      }
      const volId = btn.dataset.inviteVol;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      const result = await sendInvitation(eventId, volId, orgUser.id);
      if (result.error) {
        showToast(result.error, 'error');
        btn.disabled = false;
        btn.textContent = 'Invite';
      } else {
        showToast('Invitation sent.', 'success');
        btn.textContent = 'Invited';
      }
    });
  });
}

function renderVolunteerCard(vol, eventId) {
  const matchScore = eventId ? vol.matchScore : null;
  const matchedSkills = eventId ? (vol.matchedSkills || []) : (vol.skills || []);

  return `
    <div class="volunteer-card">
      <div class="volunteer-avatar">${getInitials(vol.user?.full_name)}</div>
      <div class="volunteer-info">
        <div class="volunteer-name">${escapeHtml(vol.user?.full_name || 'Volunteer')}</div>
        <div class="volunteer-location">${escapeHtml(vol.user?.location || 'Location not set')}</div>
        <div class="volunteer-skills-wrap">
          ${(vol.skills || []).slice(0, 5).map(s => `
            <span class="tag ${matchedSkills.includes(s) ? 'tag-primary' : ''}" style="font-size:11px;">
              ${getSkillIcon(s)} ${getSkillLabel(s)}
            </span>
          `).join('')}
        </div>
      </div>
      ${matchScore !== null ? `
        <div class="match-score">
          <div class="match-score-value" style="color:${matchScore >= 75 ? 'var(--color-primary)' : matchScore >= 50 ? 'var(--color-warning)' : 'var(--color-text-secondary)'};">
            ${matchScore}%
          </div>
          <div class="match-score-label">Match</div>
        </div>
      ` : ''}
      <button class="btn btn-outline btn-sm" data-invite-vol="${vol.user_id}">
        Invite
      </button>
    </div>
  `;
}

// ── REGISTRATIONS SECTION ─────────────────────────────────────────────────────

async function renderRegistrationsSection(container) {
  container.innerHTML = `
    <h2 class="section-title">👥 Event Registrations</h2>

    <div style="margin-bottom:16px;">
      <label class="form-label">Select Event</label>
      <select class="form-control" id="reg-event-select" style="max-width:400px;">
        <option value="">Choose an event...</option>
        ${orgEvents.map(e => `
          <option value="${e.id}">${escapeHtml(e.title)} (${formatDate(e.date)})</option>
        `).join('')}
      </select>
    </div>

    <div id="registrations-content">
      <div class="empty-state">
        <div class="empty-state-icon">👆</div>
        <h3>Select an event</h3>
        <p>Choose an event above to view its volunteers and confirm attendance.</p>
      </div>
    </div>
  `;

  document.getElementById('reg-event-select')?.addEventListener('change', e => {
    if (e.target.value) loadEventRegistrations(e.target.value);
  });
}

async function loadEventRegistrations(eventId) {
  const container = document.getElementById('registrations-content');
  if (!container) return;
  container.innerHTML = `<div class="loading-container"><div class="spinner"></div></div>`;

  let regs;
  try {
    regs = await getEventRegistrations(eventId, orgUser.id);
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load registrations</h3>
        <p>${escapeHtml(error.message || 'Check your Supabase policies and try again.')}</p>
      </div>
    `;
    return;
  }

  if (!regs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <h3>No registrations yet</h3>
        <p>No volunteers have registered for this event.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom:12px;font-size:13px;color:var(--color-text-secondary);">
      ${regs.length} volunteer${regs.length !== 1 ? 's' : ''} registered
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${regs.map(r => `
        <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:16px 20px;display:flex;align-items:center;gap:14px;box-shadow:var(--shadow-sm);">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));display:flex;align-items:center;justify-content:center;font-weight:700;color:white;flex-shrink:0;">
            ${getInitials(r.volunteer?.full_name)}
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;">${escapeHtml(r.volunteer?.full_name || 'Volunteer')}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);">
              ${escapeHtml(r.volunteer?.email || '')}
              ${r.volunteer?.location ? ' · ' + escapeHtml(r.volunteer.location) : ''}
            </div>
            ${r.profile?.skills?.length ? `
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
                ${r.profile.skills.slice(0, 4).map(s => `<span class="tag" style="font-size:10px;">${getSkillIcon(s)} ${getSkillLabel(s)}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div style="text-align:right;flex-shrink:0;">
            ${r.attendance_status === 'confirmed' ? `
              <div class="badge badge-primary" style="margin-bottom:4px;">Confirmed</div>
              <div style="font-size:12px;color:var(--color-text-secondary);">${r.confirmed_hours} hrs</div>
            ` : `
              <div style="display:flex;align-items:center;gap:8px;">
                <input type="number" class="form-control" style="width:60px;padding:6px 8px;font-size:13px;"
                  id="hours-${r.id}" value="4" min="1" max="24" placeholder="hrs" />
                <button class="btn btn-primary btn-sm" data-confirm-reg="${r.id}">
                  Confirm Hours
                </button>
              </div>
            `}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('[data-confirm-reg]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const regId = btn.dataset.confirmReg;
      const hours = parseInt(document.getElementById(`hours-${regId}`)?.value) || 4;
      btn.disabled = true;
      btn.textContent = 'Confirming...';

      const result = await confirmAttendance(regId, hours, orgUser.id);
      if (result.error) {
        showToast(result.error, 'error');
        btn.disabled = false;
        btn.textContent = 'Confirm Hours';
      } else {
        showToast(`Attendance confirmed. ${hours} hours recorded.`, 'success');
        const eventId = document.getElementById('reg-event-select')?.value;
        if (eventId) loadEventRegistrations(eventId);
      }
    });
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
