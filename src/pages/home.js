import { signIn, signUp } from '../services/auth.js';
import { isSupabaseConfigured } from '../services/supabase.js';
import { SKILLS, INTERESTS, AVAILABILITY_OPTIONS } from '../services/matching.js';
import { showToast } from '../components/toast.js';
import { setNavbarUser } from '../components/navbar.js';
import { navigate } from '../main.js';

export async function renderHome(params) {
  const content = document.getElementById('page-content');
  const showSignup = params?.signup === '1';

  content.innerHTML = `
    <section class="home-hero">
      <div class="home-hero-grid"></div>
      <div class="container">
        <div class="hero-content">
          <!-- Left: Hero Text -->
          <div class="hero-text">
            <div class="hero-eyebrow">
              <span>🌱</span> Community Connection Platform
            </div>
            <h1 class="hero-title">
              Make a Difference<br>with <span>VOLO</span>
            </h1>
            <p class="hero-subtitle">
              Connect with meaningful volunteering opportunities. Discover events that match your skills, track your impact, and help organizations find the right people for their mission.
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-xl" id="hero-signup-btn">
                🌟 Get Started Free
              </button>
              <button class="btn btn-xl" style="background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.2);" id="hero-login-btn">
                Sign In
              </button>
            </div>
            <div class="hero-stats">
              <div>
                <div class="hero-stat-value">500+</div>
                <div class="hero-stat-label">Volunteers</div>
              </div>
              <div>
                <div class="hero-stat-value">120+</div>
                <div class="hero-stat-label">Events</div>
              </div>
              <div>
                <div class="hero-stat-value">3,200+</div>
                <div class="hero-stat-label">Hours Served</div>
              </div>
            </div>
          </div>

          <!-- Right: Auth Card -->
          <div>
            <div class="auth-card" id="auth-card">
              <div class="auth-tabs">
                <div class="auth-tab ${!showSignup ? 'active' : ''}" data-auth-tab="login">Sign In</div>
                <div class="auth-tab ${showSignup ? 'active' : ''}" data-auth-tab="signup">Create Account</div>
              </div>

              <!-- Login Form -->
              <div id="login-form-wrap" ${showSignup ? 'style="display:none"' : ''}>
                <form class="auth-form" id="login-form">
                  <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" name="email" placeholder="you@example.com" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" name="password" placeholder="Your password" required />
                  </div>
                  <button type="submit" class="btn btn-primary btn-full btn-lg">
                    Sign In to VOLO
                  </button>
                  ${isSupabaseConfigured() ? '' : `
                    <p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.4);">
                      Demo: alex@example.com / demo1234
                    </p>
                  `}
                </form>
              </div>

              <!-- Signup Form -->
              <div id="signup-form-wrap" ${!showSignup ? 'style="display:none"' : ''}>
                <form class="auth-form" id="signup-form">
                  <div class="form-group">
                    <label class="form-label">I am a...</label>
                    <div class="role-selector">
                      <label class="role-option">
                        <input type="radio" name="role" value="volunteer" checked />
                        <div class="role-card">
                          <div class="role-icon">🙋</div>
                          <div class="role-name">Volunteer</div>
                        </div>
                      </label>
                      <label class="role-option">
                        <input type="radio" name="role" value="organization" />
                        <div class="role-card">
                          <div class="role-icon">🏢</div>
                          <div class="role-name">Organization</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" id="name-label">Full Name</label>
                    <input type="text" class="form-control" name="full_name" placeholder="Your full name" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-control" name="email" placeholder="you@example.com" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" name="password" placeholder="Min. 6 characters" required minlength="6" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-control" name="location" placeholder="City, State" />
                  </div>

                  <!-- Volunteer fields -->
                  <div id="volunteer-fields">
                    <div class="form-group">
                      <label class="form-label">Your Skills (select all that apply)</label>
                      <div class="skill-grid" style="grid-template-columns: repeat(2, 1fr);">
                        ${SKILLS.map(s => `
                          <div>
                            <input type="checkbox" class="skill-checkbox" id="signup-skill-${s.id}" name="skills" value="${s.id}" />
                            <label class="skill-label" for="signup-skill-${s.id}">
                              <span class="skill-icon">${s.icon}</span> ${s.label}
                            </label>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Availability</label>
                      <select class="form-control" name="availability">
                        <option value="">Select availability...</option>
                        ${AVAILABILITY_OPTIONS.map(a => `<option value="${a.id}">${a.label}</option>`).join('')}
                      </select>
                    </div>
                  </div>

                  <!-- Org fields -->
                  <div id="org-fields" style="display:none">
                    <div class="form-group">
                      <label class="form-label">Organization Description</label>
                      <textarea class="form-control" name="description" placeholder="Brief description of your organization..." rows="3"></textarea>
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary btn-full btn-lg">
                    Create Account
                  </button>
                </form>
              </div>
            </div>

            <!-- Features below auth -->
            <div class="features-list" style="margin-top:0;padding-top:28px;">
              <div class="feature-item">
                <div class="feature-icon-wrap">🔍</div>
                <div class="feature-text">
                  <h4>Discover Opportunities</h4>
                  <p>Browse hundreds of local events filtered by your skills and location.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon-wrap">🎯</div>
                <div class="feature-text">
                  <h4>Skill-Based Matching</h4>
                  <p>Get matched with events that need exactly what you have to offer.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon-wrap">📊</div>
                <div class="feature-text">
                  <h4>Track Your Impact</h4>
                  <p>See your confirmed volunteer hours and the difference you've made.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Tab switching
  content.querySelectorAll('[data-auth-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.authTab;
      content.querySelectorAll('[data-auth-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('login-form-wrap').style.display = target === 'login' ? '' : 'none';
      document.getElementById('signup-form-wrap').style.display = target === 'signup' ? '' : 'none';
    });
  });

  // Role switching
  const roleInputs = content.querySelectorAll('input[name="role"]');
  const nameLabel = document.getElementById('name-label');
  roleInputs.forEach(input => {
    input.addEventListener('change', () => {
      const isOrg = input.value === 'organization';
      document.getElementById('volunteer-fields').style.display = isOrg ? 'none' : '';
      document.getElementById('org-fields').style.display = isOrg ? '' : 'none';
      if (nameLabel) nameLabel.textContent = isOrg ? 'Organization Name' : 'Full Name';
    });
  });

  // Hero CTA buttons
  document.getElementById('hero-signup-btn')?.addEventListener('click', () => {
    content.querySelector('[data-auth-tab="signup"]')?.click();
    document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('hero-login-btn')?.addEventListener('click', () => {
    content.querySelector('[data-auth-tab="login"]')?.click();
    document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const result = await signIn(data.get('email'), data.get('password'));
    if (result.error) {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In to VOLO';
    } else {
      setNavbarUser(result.user);
      showToast(`Welcome back, ${result.user.full_name}! 👋`, 'success');
      if (result.user.role === 'organization') navigate('/dashboard');
      else navigate('/discovery');
    }
  });

  // Signup form
  document.getElementById('signup-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const skills = Array.from(e.target.querySelectorAll('input[name="skills"]:checked')).map(el => el.value);
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    const result = await signUp({
      email: data.get('email'),
      password: data.get('password'),
      full_name: data.get('full_name'),
      role: data.get('role'),
      location: data.get('location'),
      description: data.get('description'),
      skills,
      interests: [],
      availability: data.get('availability'),
    });

    if (result.error) {
      showToast(result.error, 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    } else {
      if (result.needsEmailConfirmation) {
        showToast('Account created. Check your email to confirm your account, then sign in.', 'success');
        document.querySelector('[data-auth-tab="login"]')?.click();
      } else {
        setNavbarUser(result.user);
        showToast(`Welcome to VOLO, ${result.user.full_name}! 🌟`, 'success');
        if (result.user.role === 'organization') navigate('/dashboard');
        else navigate('/discovery');
      }
    }
  });
}
