import { navigate } from '../main.js';

export async function initNavbar() {
  renderNavbar();
}

function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  navbar.innerHTML = `
    <div class="container">
      <div class="navbar-inner">
        <div class="navbar-brand" data-nav="/">
          <div class="navbar-logo">V</div>
          <span class="navbar-brand-name">V<span>O</span>LO</span>
        </div>

        <nav class="navbar-nav">
          <span class="nav-link" data-nav="/discovery">🔍 Discover Events</span>
        </nav>

        <div class="navbar-actions">
          <button class="btn btn-primary btn-sm" data-nav="/discovery">Browse Events</button>
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

}
