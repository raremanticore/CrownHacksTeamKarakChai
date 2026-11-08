import { getCurrentUser, signOut } from '../services/auth.js';
import { navigate } from '../main.js';

let currentUser = null;

export async function initNavbar() {
  currentUser = await getCurrentUser();
  renderNavbar();
}

export function setNavbarUser(user) {
  currentUser = user;
  renderNavbar();
}

function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const isLoggedIn = Boolean(currentUser);
  const isOrg = currentUser?.role === 'organization';
  const isVol = currentUser?.role === 'volunteer';

  navbar.innerHTML = `
    <div class="container">
      <div class="navbar-inner">
        <div class="navbar-brand" data-nav="/">
          <div class="navbar-logo">V</div>
          <span class="navbar-brand-name">V<span>O</span>LO</span>
        </div>

        <nav class="navbar-nav">
          ${isLoggedIn ? `
            <span class="nav-link" data-nav="/discovery">Discover Events</span>
            ${isVol ? `<span class="nav-link" data-nav="/profile">My Profile</span>` : ''}
            ${isOrg ? `<span class="nav-link" data-nav="/dashboard">Dashboard</span>` : ''}
          ` : ''}
        </nav>

        <div class="navbar-actions">
          ${isLoggedIn ? `
            <div class="navbar-user">
              <div class="navbar-avatar">${getInitials(currentUser.full_name)}</div>
              <div class="navbar-user-info">
                <span class="navbar-user-name">${escapeHtml(currentUser.full_name)}</span>
                <span class="navbar-user-role">${currentUser.role}</span>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" id="logout-btn">Sign Out</button>
          ` : `
            <button class="btn btn-outline btn-sm" data-nav="/">Sign In</button>
            <button class="btn btn-primary btn-sm" data-nav="/?signup=1">Get Started</button>
          `}
        </div>
      </div>
    </div>
  `;

  // Active nav link
  const hash = window.location.hash.slice(1) || '/';
  navbar.querySelectorAll('.nav-link[data-nav]').forEach(link => {
    if (link.dataset.nav === hash || (hash.startsWith(link.dataset.nav) && link.dataset.nav !== '/')) {
      link.classList.add('active');
    }
  });

  // Navigation clicks
  navbar.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut();
      currentUser = null;
      renderNavbar();
      navigate('/');
    });
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
