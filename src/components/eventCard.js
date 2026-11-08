import { getCategoryIcon, getCategoryColor, getCategoryLabel, formatDate, formatTime, formatRelativeDate } from '../services/matching.js';
import { navigate } from '../main.js';

export function renderEventCard(event) {
  const isEmergency = event.is_emergency;
  const spotsLeft = event.capacity - event.spots_taken;
  const isFull = spotsLeft <= 0;
  const fillPct = Math.round((event.spots_taken / event.capacity) * 100);
  const catColor = isEmergency ? '#dc2626' : getCategoryColor(event.category);
  const catIcon = isEmergency ? '🚨' : getCategoryIcon(event.category);
  const relDate = formatRelativeDate(event.date);

  const card = document.createElement('div');
  card.className = `event-card${isEmergency ? ' emergency' : ''}`;
  card.innerHTML = `
    <div class="event-card-header" style="background: linear-gradient(135deg, ${catColor}22, ${catColor}44);">
      <div class="event-card-category-bg" style="background: ${catColor};"></div>
      <div class="event-card-badges">
        ${isEmergency ? `<span class="badge badge-emergency">🚨 URGENT</span>` : ''}
        <span class="badge" style="background:${catColor}22; color:${catColor}; border:1px solid ${catColor}44;">
          ${catIcon} ${getCategoryLabel(event.category)}
        </span>
      </div>
    </div>
    <div class="event-card-body">
      <div class="event-card-title">${escapeHtml(event.title)}</div>
      <div class="event-card-org">by ${escapeHtml(event.organization_name)}</div>
      <div class="event-card-meta">
        <div class="event-meta-item">
          <span>${formatDate(event.date)} · ${formatTime(event.time)}</span>
        </div>
        <div class="event-meta-item">
          <span>${escapeHtml(event.location)}</span>
        </div>
      </div>
      <div class="event-card-footer">
        <div>
          <span class="event-capacity${isFull ? ' full' : ''}">
            ${isFull ? '⛔ Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </span>
        </div>
        <span class="badge badge-ghost">${relDate}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => navigate(`/event/${event.id}`));
  return card;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
