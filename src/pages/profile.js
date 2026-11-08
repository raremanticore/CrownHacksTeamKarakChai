import { becomeOrganization, getCurrentUser } from '../services/auth.js';
import { getVolunteerRegistrations, cancelRegistration, getVolunteerInvitations, respondInvitation } from '../services/events.js';
import { demoGetProfile, demoUpdateProfile } from '../services/demo.js';
import { SKILLS, INTERESTS, AVAILABILITY_OPTIONS, getSkillLabel, getSkillIcon, formatDate, formatTime, isEventPast } from '../services/matching.js';
import { showToast } from '../components/toast.js';
import { setNavbarUser } from '../components/navbar.js';
import { navigate } from '../main.js';

export async function renderProfile() {
  const content = document.getElementById('page-content');
  const user = await getCurrentUser();
  if (!user || user.role !== 'volunteer') { navigate('/'); return; }

  const { profile } = demoGetProfile(user.id);
  const registrations = await getVolunteerRegistrations(user.id);
  const invitations = await getVolunteerInvitations(user.id);

  const upcoming = registrations.filter(r => r.event && !isEventPast(r.event.date));
  const completed = registrations.filter(r => r.event && isEventPast(r.event.date));
  const confirmedHours = profile?.confirmed_hours || 0;
  const orgsSupported = [...new Set(completed.map(r => r.event?.organization_name).filter(Boolean))].length;

  content.innerHTML = `
    <div class="page-header">
      <div class="container">
        <h1>My Volunteer Profile</h1>
        <p>Manage your profile, track your impact, and view your events.</p>
      </div>
    </div>

    <div class="container">
      <div class="profile-layout">

        <!-- Sidebar -->
        <aside class="profile-sidebar">
          <div class="profile-card">
            <div class="profile-avatar">${getInitials(user.full_name)}</div>
            <div class="profile-name">${escapeHtml(user.full_name)}</div>
            <div class="profile-role-badge">Volunteer</div>
            ${user.location ? `<div class="profile-location">${escapeHtml(user.location)}</div>` : ''}

            <div class="impact-mini-stats">
              <div class="impact-mini-stat">
                <div class="impact-mini-value">${confirmedHours}</div>
                <div class="impact-mini-label">Hours</div>
              </div>
              <div class="impact-mini-stat">
                <div class="impact-mini-value">${completed.length}</div>
                <div class="impact-mini-label">Events</div>
              </div>
              <div class="impact-mini-stat">
                <div class="impact-mini-value">${orgsSupported}</div>
                <div class="impact-mini-label">Orgs</div>
              </div>
              <div class="impact-mini-stat">
                <div class="impact-mini-value">${upcoming.length}</div>
                <div class="impact-mini-label">Upcoming</div>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="card card-body" style="margin-bottom:16px;">
            <h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-text-secondary);margin-bottom:12px;">My Skills</h4>
            ${profile?.skills?.length ? `
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${profile.skills.map(s => `<span class="tag tag-primary">${getSkillIcon(s)} ${getSkillLabel(s)}</span>`).join('')}
              </div>
            ` : `<p style="font-size:13px;color:var(--color-text-muted);">No skills added yet. Edit your profile to add skills.</p>`}
          </div>

          <button class="btn btn-primary btn-full" id="edit-profile-btn">Edit Profile</button>
          <button class="btn btn-outline btn-full" style="margin-top:10px;" id="become-org-btn">Become an Organization</button>
          <button class="btn btn-outline btn-full" style="margin-top:10px;" onclick="navigate('/discovery')">Discover More Events</button>
        </aside>

        <!-- Main Content -->
        <div>
          <!-- Invitations -->
          ${invitations.length > 0 ? `
            <div class="card card-body" style="margin-bottom:24px;border-color:var(--color-secondary);background:var(--color-secondary-light);">
              <h3 style="color:var(--color-secondary);margin-bottom:16px;">Event Invitations (${invitations.length})</h3>
              <div style="display:flex;flex-direction:column;gap:12px;" id="invitations-list">
                ${invitations.map(inv => `
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;background:white;padding:14px;border-radius:var(--radius-md);">
                    <div>
                      <div style="font-weight:600;">${escapeHtml(inv.event?.title || 'Event')}</div>
                      <div style="font-size:12px;color:var(--color-text-secondary);">${formatDate(inv.event?.date)} · ${inv.event?.location || ''}</div>
                    </div>
                    <div style="display:flex;gap:8px;flex-shrink:0;">
                      <button class="btn btn-primary btn-sm" data-inv-accept="${inv.id}">Accept</button>
                      <button class="btn btn-ghost btn-sm" data-inv-decline="${inv.id}">Decline</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Impact -->
          <div style="margin-bottom:24px;">
            <h2 class="section-title">My Impact</h2>
            <div class="impact-stats-grid">
              <div class="stat-card">
                <div class="stat-icon">Hours</div>
                <div class="stat-value" style="color:var(--color-primary);">${confirmedHours}</div>
                <div class="stat-label">Confirmed Hours</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">Done</div>
                <div class="stat-value" style="color:var(--color-secondary);">${completed.length}</div>
                <div class="stat-label">Events Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">Orgs</div>
                <div class="stat-value" style="color:var(--color-warning);">${orgsSupported}</div>
                <div class="stat-label">Organizations Supported</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">Next</div>
                <div class="stat-value" style="color:#8b5cf6;">${upcoming.length}</div>
                <div class="stat-label">Upcoming Events</div>
              </div>
            </div>
          </div>

          <!-- Tabs: Upcoming / Completed -->
          <div class="tabs" id="profile-tabs">
            <div class="tab active" data-tab="upcoming">Upcoming (${upcoming.length})</div>
            <div class="tab" data-tab="completed">Completed (${completed.length})</div>
            <div class="tab" data-tab="history">All Registrations (${registrations.length})</div>
          </div>

          <div class="tab-content active" id="tab-upcoming">
            ${renderEventsList(upcoming, true)}
          </div>
          <div class="tab-content" id="tab-completed">
            ${renderEventsList(completed, false, true)}
          </div>
          <div class="tab-content" id="tab-history">
            ${renderEventsList(registrations, false, false)}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div id="edit-profile-modal" style="display:none;" class="modal-overlay">
      <div class="modal" style="max-width:600px;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Profile</h3>
          <div class="modal-close" id="close-modal-btn">×</div>
        </div>
        <div class="modal-body">
          <form id="edit-profile-form" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-control" name="full_name" value="${escapeHtml(user.full_name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" class="form-control" name="location" value="${escapeHtml(user.location || '')}" placeholder="City, State" />
            </div>
            <div class="form-group">
              <label class="form-label">Availability</label>
              <select class="form-control" name="availability">
                ${AVAILABILITY_OPTIONS.map(a => `
                  <option value="${a.id}" ${profile?.availability === a.id ? 'selected' : ''}>${a.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Skills</label>
              <div class="skill-grid">
                ${SKILLS.map(s => `
                  <div>
                    <input type="checkbox" class="skill-checkbox" id="edit-skill-${s.id}" name="skills" value="${s.id}"
                      ${profile?.skills?.includes(s.id) ? 'checked' : ''} />
                    <label class="skill-label" for="edit-skill-${s.id}">
                      <span class="skill-icon">${s.icon}</span> ${s.label}
                    </label>
                  </div>
                `).join('')}
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-edit-btn">Cancel</button>
          <button class="btn btn-primary" id="save-profile-btn">Save Changes</button>
        </div>
      </div>
    </div>

    <div id="become-org-modal" style="display:none;" class="modal-overlay">
      <div class="modal" style="max-width:520px;">
        <div class="modal-header">
          <h3 class="modal-title">Create an Organization</h3>
          <div class="modal-close" id="close-org-modal-btn">×</div>
        </div>
        <div class="modal-body">
          <form id="become-org-form" style="display:flex;flex-direction:column;gap:16px;">
            <div class="form-group">
              <label class="form-label">Organization Name</label>
              <input class="form-control" name="name" placeholder="Your organization name" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" name="description" placeholder="What does your organization do?" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input class="form-control" name="location" value="${escapeHtml(user.location || '')}" placeholder="City, State" />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-org-modal-btn">Cancel</button>
          <button class="btn btn-primary" id="create-org-btn">Create Organization</button>
        </div>
      </div>
    </div>
  `;

  // Window navigate shim
  window.navigate = navigate;

  // Tabs
  content.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      content.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      content.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  // Cancel registration buttons
  content.querySelectorAll('[data-cancel-reg]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = btn.dataset.cancelReg;
      btn.disabled = true;
      btn.textContent = 'Cancelling...';
      const result = await cancelRegistration(eventId, user.id);
      if (result.error) showToast(result.error, 'error');
      else { showToast('Registration cancelled.', 'info'); renderProfile(); }
    });
  });

  // View event buttons
  content.querySelectorAll('[data-view-event]').forEach(btn => {
    btn.addEventListener('click', () => navigate(`/event/${btn.dataset.viewEvent}`));
  });

  // Invitation responses
  content.querySelectorAll('[data-inv-accept]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.invAccept;
      btn.disabled = true;
      const result = await respondInvitation(id, true, user.id);
      if (result.error) showToast(result.error, 'error');
      else { showToast('Invitation accepted! You\'re now registered. 🎉', 'success'); renderProfile(); }
    });
  });

  content.querySelectorAll('[data-inv-decline]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.invDecline;
      btn.disabled = true;
      const result = await respondInvitation(id, false, user.id);
      if (result.error) showToast(result.error, 'error');
      else { showToast('Invitation declined.', 'info'); renderProfile(); }
    });
  });

  // Edit profile modal
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    document.getElementById('edit-profile-modal').style.display = 'flex';
  });
  document.getElementById('close-modal-btn')?.addEventListener('click', () => {
    document.getElementById('edit-profile-modal').style.display = 'none';
  });
  document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
    document.getElementById('edit-profile-modal').style.display = 'none';
  });

  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const form = document.getElementById('edit-profile-form');
    const data = new FormData(form);
    const skills = Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(el => el.value);
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const result = demoUpdateProfile(user.id, {
      user: { full_name: data.get('full_name'), location: data.get('location') },
      profile: { skills, availability: data.get('availability') },
    });

    if (result.error) {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    } else {
      showToast('Profile updated successfully.', 'success');
      document.getElementById('edit-profile-modal').style.display = 'none';
      renderProfile();
    }
  });

  document.getElementById('become-org-btn')?.addEventListener('click', () => {
    document.getElementById('become-org-modal').style.display = 'flex';
  });
  document.getElementById('close-org-modal-btn')?.addEventListener('click', closeOrganizationModal);
  document.getElementById('cancel-org-modal-btn')?.addEventListener('click', closeOrganizationModal);
  document.getElementById('create-org-btn')?.addEventListener('click', async () => {
    const form = document.getElementById('become-org-form');
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const btn = document.getElementById('create-org-btn');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    const result = await becomeOrganization(user.id, {
      name: data.get('name'),
      description: data.get('description'),
      location: data.get('location'),
    });
    if (result.error) {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = 'Create Organization';
      return;
    }
    setNavbarUser(result.user);
    showToast('Organization created! Redirecting to your dashboard.', 'success');
    navigate('/dashboard');
  });

  // Click outside modal to close
  document.getElementById('edit-profile-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });
}

function closeOrganizationModal() {
  const modal = document.getElementById('become-org-modal');
  if (modal) modal.style.display = 'none';
}

function renderEventsList(registrations, showCancel = false, showHours = false) {
  if (!registrations.length) {
    return `
      <div class="empty-state">
        <h3>${showCancel ? 'No upcoming events' : 'No completed events yet'}</h3>
        <p>${showCancel ? 'Register for events to see them here.' : 'Complete events to build your impact history.'}</p>
        ${showCancel ? `<button class="btn btn-primary" onclick="navigate('/discovery')">Discover Events</button>` : ''}
      </div>
    `;
  }

  return `
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${registrations.map(r => {
        const event = r.event;
        const isPast = isEventPast(event?.date);
        const isConfirmed = r.attendance_status === 'confirmed';

        return `
          <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:18px 20px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow-sm);">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:${isPast ? 'var(--color-surface-3)' : 'var(--color-primary-light)'};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">
              ${isPast ? (isConfirmed ? 'Confirmed' : 'Completed') : 'Upcoming'}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:15px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${escapeHtml(event?.title || 'Event')}
              </div>
              <div style="font-size:12px;color:var(--color-text-secondary);">
                ${event?.organization_name ? escapeHtml(event.organization_name) + ' · ' : ''}
                ${formatDate(event?.date)} · ${formatTime(event?.time)}
              </div>
              ${isConfirmed && r.confirmed_hours ? `
                <div style="font-size:12px;color:var(--color-primary);font-weight:600;margin-top:2px;">
                  ${r.confirmed_hours} confirmed hours
                </div>
              ` : ''}
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0;">
              <button class="btn btn-ghost btn-sm" data-view-event="${event?.id}">View</button>
              ${showCancel && !isPast ? `<button class="btn btn-danger btn-sm" data-cancel-reg="${event?.id}">Cancel</button>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
