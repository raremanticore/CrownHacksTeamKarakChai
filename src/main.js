import './styles/style.css';
import { initNavbar, setNavbarUser } from './components/navbar.js';
import { renderHome } from './pages/home.js';
import { renderDiscovery } from './pages/discovery.js';
import { renderEventDetails } from './pages/eventDetails.js';
import { renderProfile } from './pages/profile.js';
import { renderOrgDashboard } from './pages/organizationDashboard.js';
import { getCurrentUser, onAuthChange } from './services/auth.js';

// ── Router ────────────────────────────────────────────────────────────────────

export function navigate(path) {
  window.location.hash = path;
}

function parsePath() {
  const hash = window.location.hash.slice(1) || '/';
  const [pathname, queryString] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString || ''));

  // Match /event/:id
  const eventMatch = pathname.match(/^\/event\/(.+)$/);
  if (eventMatch) return { route: 'event', id: eventMatch[1], params };

  return { route: pathname, params };
}

async function handleRoute() {
  const { route, id, params } = parsePath();
  const content = document.getElementById('page-content');

  // Update active nav
  document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
    link.classList.remove('active');
    const linkPath = link.dataset.nav;
    if (route === linkPath || (route.startsWith(linkPath) && linkPath !== '/')) {
      link.classList.add('active');
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  switch (route) {
    case '/':
    case '':
      await renderHome(params);
      break;
    case '/discovery':
      await renderDiscovery();
      break;
    case 'event':
      await renderEventDetails(id);
      break;
    case '/profile':
      await renderProfile();
      break;
    case '/dashboard':
      await renderOrgDashboard();
      break;
    default:
      content.innerHTML = `
        <div class="empty-state" style="min-height:70vh;">
          <div class="empty-state-icon">🧭</div>
          <h3>Page not found</h3>
          <p>The page you're looking for doesn't exist.</p>
          <button class="btn btn-primary" onclick="window.location.hash='/'">Go Home</button>
        </div>
      `;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  await initNavbar();

  onAuthChange(user => setNavbarUser(user));

  const user = await getCurrentUser();
  if (user) setNavbarUser(user);

  window.addEventListener('hashchange', handleRoute);
  await handleRoute();
}

init();
