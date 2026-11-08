import { getEvents } from '../services/events.js';
import { CATEGORIES, formatDate, formatTime } from '../services/matching.js';
import { renderEventCard } from '../components/eventCard.js';
import { getCurrentUser } from '../services/auth.js';
import { navigate } from '../main.js';

let allEvents = [];
let filters = { category: 'all', search: '', location: '', isEmergency: false };

export async function renderDiscovery() {
  const content = document.getElementById('page-content');

  const user = await getCurrentUser();
  if (!user) { navigate('/'); return; }

  content.innerHTML = `
    <div class="page-header">
      <div class="container">
        <h1>🔍 Discover Events</h1>
        <p>Find volunteering opportunities that match your skills and schedule.</p>
      </div>
    </div>

    <div class="container">
      <div class="discovery-layout">
        <!-- Sidebar Filters -->
        <aside class="filters-sidebar">
          <div class="filter-panel">
            <div class="search-bar" style="margin-bottom:16px;">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" id="search-input" placeholder="Search events..." value="${filters.search}" />
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" class="form-control" id="location-filter" placeholder="City or area..." value="${filters.location}" />
            </div>
          </div>

          <div class="filter-panel">
            <h4>Category</h4>
            <div class="filter-chips" id="category-chips">
              ${CATEGORIES.map(cat => `
                <button class="filter-chip ${cat.id === 'emergency' ? 'emergency-chip' : ''} ${filters.category === cat.id ? 'active' : ''}"
                  data-category="${cat.id}">
                  ${cat.icon} ${cat.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="filter-panel">
            <h4>Special</h4>
            <div class="filter-chips">
              <button class="filter-chip emergency-chip ${filters.isEmergency ? 'active' : ''}" id="emergency-filter">
                🚨 Emergency Only
              </button>
            </div>
          </div>

          <button class="btn btn-ghost btn-full" id="clear-filters-btn">
            ✕ Clear All Filters
          </button>
        </aside>

        <!-- Events Content -->
        <div>
          <!-- Emergency Banner -->
          <div id="emergency-banner" style="display:none;" class="card" style="border-color: var(--color-emergency); margin-bottom:20px;">
            <div class="card-body" style="background:var(--color-emergency-light);border-radius:var(--radius-lg);border:1px solid var(--color-emergency);">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:28px;">🚨</span>
                <div>
                  <strong style="color:var(--color-emergency);font-size:16px;">Emergency Volunteering Opportunities</strong>
                  <p style="font-size:13px;color:#991b1b;margin-top:2px;">
                    These events require urgent volunteers. All activities take place in safe, supervised settings.
                    Please review safety requirements before registering.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div id="results-count" class="text-secondary text-sm font-medium"></div>
          </div>

          <div id="events-grid" class="events-grid">
            <div class="loading-container">
              <div class="spinner"></div>
              <span>Loading events...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  await loadEvents();
  bindFilters();
}

async function loadEvents() {
  const grid = document.getElementById('events-grid');
  const countEl = document.getElementById('results-count');
  const emergencyBanner = document.getElementById('emergency-banner');

  if (grid) {
    grid.innerHTML = `<div class="loading-container"><div class="spinner"></div><span>Loading events...</span></div>`;
  }

  try {
    allEvents = await getEvents(filters);
  } catch (error) {
    allEvents = [];
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">⚠️</div>
          <h3>Unable to load events</h3>
          <p>${escapeHtml(error.message || 'Please try again.')}</p>
          <button class="btn btn-primary" id="retry-events">Try Again</button>
        </div>
      `;
      document.getElementById('retry-events')?.addEventListener('click', loadEvents);
    }
  }

  if (grid) {
    grid.innerHTML = '';

    if (allEvents.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No events found</h3>
          <p>Try adjusting your filters or search terms to find more opportunities.</p>
          <button class="btn btn-primary" id="reset-search">Clear Filters</button>
        </div>
      `;
      document.getElementById('reset-search')?.addEventListener('click', clearFilters);
    } else {
      const hasEmergency = allEvents.some(e => e.is_emergency);
      if (emergencyBanner) emergencyBanner.style.display = hasEmergency ? '' : 'none';

      // Sort: emergency first
      const sorted = [...allEvents].sort((a, b) => {
        if (a.is_emergency && !b.is_emergency) return -1;
        if (!a.is_emergency && b.is_emergency) return 1;
        return new Date(a.date) - new Date(b.date);
      });

      sorted.forEach(event => grid.appendChild(renderEventCard(event)));
    }
  }

  if (countEl) {
    countEl.textContent = `${allEvents.length} event${allEvents.length !== 1 ? 's' : ''} found`;
  }
}

function bindFilters() {
  // Search
  let searchTimer;
  document.getElementById('search-input')?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.search = e.target.value;
      loadEvents();
    }, 350);
  });

  // Location
  let locationTimer;
  document.getElementById('location-filter')?.addEventListener('input', e => {
    clearTimeout(locationTimer);
    locationTimer = setTimeout(() => {
      filters.location = e.target.value;
      loadEvents();
    }, 350);
  });

  // Category chips
  document.getElementById('category-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-category]');
    if (!chip) return;
    document.querySelectorAll('[data-category]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filters.category = chip.dataset.category;
    if (filters.category === 'emergency') filters.isEmergency = true;
    else filters.isEmergency = false;
    loadEvents();
  });

  // Emergency filter
  document.getElementById('emergency-filter')?.addEventListener('click', e => {
    filters.isEmergency = !filters.isEmergency;
    e.target.classList.toggle('active', filters.isEmergency);
    loadEvents();
  });

  // Clear filters
  document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);
}

function clearFilters() {
  filters = { category: 'all', search: '', location: '', isEmergency: false };
  const searchInput = document.getElementById('search-input');
  const locationInput = document.getElementById('location-filter');
  if (searchInput) searchInput.value = '';
  if (locationInput) locationInput.value = '';
  document.querySelectorAll('[data-category]').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-category="all"]')?.classList.add('active');
  document.getElementById('emergency-filter')?.classList.remove('active');
  loadEvents();
}

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
