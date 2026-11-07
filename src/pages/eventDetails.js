import { getEvent } from '../services/events.js';
import { getCategoryLabel, getCategoryIcon, getCategoryColor, formatDate, formatTime, getSkillLabel, getSkillIcon } from '../services/matching.js';
import { navigate } from '../main.js';

export async function renderEventDetails(eventId) {
  const content = document.getElementById('page-content');

  content.innerHTML = `<div class="loading-container"><div class="spinner"></div><span>Loading event...</span></div>`;

  const event = await getEvent(eventId);
  if (!event) {
    content.innerHTML = `
      <div class="empty-state" style="min-height:60vh;">
        <div class="empty-state-icon">❓</div>
        <h3>Event not found</h3>
        <p>This event may have been removed or the link is incorrect.</p>
        <button class="btn btn-primary" onclick="navigate('/discovery')">Browse Events</button>
      </div>
    `;
    return;
  }

  const spotsLeft = event.capacity - event.spots_taken;
  const isFull = spotsLeft <= 0;
  const fillPct = Math.round((event.spots_taken / event.capacity) * 100);
  const catColor = event.is_emergency ? '#dc2626' : getCategoryColor(event.category);

  content.innerHTML = `
    ${event.is_emergency ? `
      <div style="background:var(--color-emergency);color:white;padding:12px 0;text-align:center;">
        <div class="container">
          🚨 <strong>URGENT EMERGENCY OPPORTUNITY</strong> — Immediate volunteers needed. All activities are conducted in a safe, supervised environment.
        </div>
      </div>
    ` : ''}

    <div class="page-header" style="background:linear-gradient(135deg, ${catColor}22, #0f172a 60%);">
      <div class="container">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="back-btn" style="background:rgba(255,255,255,0.1);color:white;">
            ← Back to Events
          </button>
          ${event.is_emergency ? `<span class="badge badge-emergency">🚨 EMERGENCY</span>` : ''}
          <span class="badge" style="background:${catColor}33;color:white;border:1px solid ${catColor}66;">
            ${getCategoryIcon(event.category)} ${getCategoryLabel(event.category)}
          </span>
        </div>
        <h1 style="font-size:28px;margin-bottom:6px;">${escapeHtml(event.title)}</h1>
        <p style="opacity:0.75;">by <strong>${escapeHtml(event.organization_name)}</strong></p>
      </div>
    </div>

    <div class="container">
      <div class="event-details-layout">
        <!-- Main Content -->
        <div class="event-details-main">

          ${event.is_emergency ? `
            <div class="event-info-block" style="border-color:var(--color-emergency);background:var(--color-emergency-light);">
              <h3 style="color:var(--color-emergency);">⚠️ Safety Information</h3>
              <p style="color:#991b1b;font-size:14px;line-height:1.6;">
                This is a verified emergency volunteering opportunity. All volunteer activities are conducted
                in safe, controlled indoor settings. No volunteers will be directed into hazardous areas.
                Please read all requirements before registering.
              </p>
            </div>
          ` : ''}

          <div class="event-info-block">
            <h3>About This Event</h3>
            <p style="color:var(--color-text-secondary);line-height:1.75;white-space:pre-line;">${escapeHtml(event.description)}</p>
          </div>

          <div class="event-info-block">
            <h3>Event Details</h3>
            <div class="event-meta-grid">
              <div class="event-meta-item-lg">
                <span class="label">📅 Date</span>
                <span class="value">${formatDate(event.date)}</span>
              </div>
              <div class="event-meta-item-lg">
                <span class="label">🕐 Time</span>
                <span class="value">${formatTime(event.time)}</span>
              </div>
              <div class="event-meta-item-lg">
                <span class="label">📍 Location</span>
                <span class="value">${escapeHtml(event.location)}</span>
              </div>
              <div class="event-meta-item-lg">
                <span class="label">📂 Category</span>
                <span class="value">${getCategoryIcon(event.category)} ${getCategoryLabel(event.category)}</span>
              </div>
              <div class="event-meta-item-lg">
                <span class="label">👥 Capacity</span>
                <span class="value">${event.spots_taken} / ${event.capacity} volunteers</span>
              </div>
              <div class="event-meta-item-lg">
                <span class="label">🎯 Spots Available</span>
                <span class="value" style="color:${isFull ? 'var(--color-danger)' : spotsLeft <= 3 ? 'var(--color-warning)' : 'var(--color-primary)'};">
                  ${isFull ? 'Event Full' : `${spotsLeft} spots left`}
                </span>
              </div>
            </div>
          </div>

          ${event.required_skills?.length ? `
            <div class="event-info-block">
              <h3>Required Skills</h3>
              <div class="skills-required">
                ${event.required_skills.map(skill => `
                  <span class="tag tag-primary">
                    ${getSkillIcon(skill)} ${getSkillLabel(skill)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="event-info-block">
            <h3>🏢 About the Organization</h3>
            <p style="font-size:14px;color:var(--color-text-secondary);">
              <strong>${escapeHtml(event.organization_name)}</strong>
            </p>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="event-details-sidebar">
          <div class="register-card${event.is_emergency ? ' emergency' : ''}">
            ${event.is_emergency ? `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 14px;background:var(--color-emergency-light);border-radius:var(--radius-md);">
                <span style="font-size:20px;">🚨</span>
                <span style="font-size:13px;font-weight:600;color:var(--color-emergency);">URGENT OPPORTUNITY</span>
              </div>
            ` : ''}

            <div style="margin-bottom:16px;">
              <div class="capacity-label">
                <span style="font-size:13px;font-weight:600;">Volunteer Spots</span>
                <span style="font-size:13px;color:var(--color-text-secondary);">${event.spots_taken} of ${event.capacity} filled</span>
              </div>
              <div class="capacity-bar">
                <div class="capacity-fill ${fillPct >= 100 ? 'full' : fillPct >= 75 ? 'almost-full' : ''}" style="width:${fillPct}%;"></div>
              </div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">
                ${isFull ? 'No spots remaining' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
              </div>
            </div>

            <p style="font-size:13px;color:var(--color-text-secondary);text-align:center;padding:12px;">
              Browse the details and contact the organization to volunteer.
            </p>

            <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border);">
              <div class="event-meta-item" style="margin-bottom:8px;">
                <span class="event-meta-icon">📅</span>
                <span style="font-size:13px;">${formatDate(event.date)}</span>
              </div>
              <div class="event-meta-item" style="margin-bottom:8px;">
                <span class="event-meta-icon">🕐</span>
                <span style="font-size:13px;">${formatTime(event.time)}</span>
              </div>
              <div class="event-meta-item">
                <span class="event-meta-icon">📍</span>
                <span style="font-size:13px;">${escapeHtml(event.location)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-btn')?.addEventListener('click', () => navigate('/discovery'));
}

function renderRegisterButton(isRegistered, isFull, isEmergency) {
  if (isRegistered) {
    return `
      <button class="btn btn-danger btn-full btn-lg" id="register-action-btn" data-action="cancel">
        Cancel Registration
      </button>
    `;
  }
  if (isFull) {
    return `<button class="btn btn-full btn-lg" disabled style="background:var(--color-surface-3);color:var(--color-text-muted);">Event is Full</button>`;
  }
  if (isEmergency) {
    return `<button class="btn btn-emergency btn-full btn-lg" id="register-action-btn" data-action="register">🚨 Register as Emergency Volunteer</button>`;
  }
  return `<button class="btn btn-primary btn-full btn-lg" id="register-action-btn" data-action="register">Register for This Event</button>`;
}

function bindRegisterButton(eventId, userId, isRegistered) {
  const wrap = document.getElementById('register-btn-wrap');
  if (!wrap) return;

  wrap.addEventListener('click', async e => {
    const btn = e.target.closest('[id="register-action-btn"]');
    if (!btn) return;

    const action = btn.dataset.action;
    btn.disabled = true;
    btn.textContent = action === 'register' ? 'Registering...' : 'Cancelling...';

    if (action === 'register') {
      const result = await registerForEvent(eventId, userId);
      if (result.error) {
        showToast(result.error, 'error');
        btn.disabled = false;
        btn.textContent = 'Register for This Event';
      } else {
        showToast('Successfully registered! This event is now in your profile. 🎉', 'success');
        await renderEventDetails(eventId);
      }
    } else {
      const result = await cancelRegistration(eventId, userId);
      if (result.error) {
        showToast(result.error, 'error');
        btn.disabled = false;
      } else {
        showToast('Registration cancelled.', 'info');
        await renderEventDetails(eventId);
      }
    }
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
