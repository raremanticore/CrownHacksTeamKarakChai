import './styles.css';
import { getEvents } from './lib/events.js';

const state = { events: [], category: 'All events', query: '', sort: 'date' };
const grid = document.querySelector('#events-grid');

function card(event) {
  return `<article class="event-card"><div class="event-image" style="background-image:url('${event.image}')"><span class="event-category">${event.category}</span></div><div class="event-content"><div class="event-date"><span>${event.day}</span><strong>${event.date}</strong></div><div class="event-details"><h3>${event.title}</h3><p class="event-org">${event.organization}</p><div class="event-meta"><span>${event.distance} mi away</span><span>${event.duration}</span></div></div><button class="join-button" data-join="${event.id}">Join <span aria-hidden="true">&rarr;</span></button></div></article>`;
}

function render() {
  const filtered = state.events.filter((event) => {
    const categoryMatch = state.category === 'All events' || event.category === state.category;
    const haystack = `${event.title} ${event.organization} ${event.category}`.toLowerCase();
    return categoryMatch && haystack.includes(state.query.toLowerCase());
  }).sort((a, b) => state.sort === 'distance' ? Number(a.distance) - Number(b.distance) : a.id.localeCompare(b.id));
  document.querySelector('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'event' : 'events'}`;
  grid.innerHTML = filtered.length ? filtered.map(card).join('') : '<div class="empty-state"><h3>No events found</h3><p>Try another cause or search term.</p></div>';
}

document.querySelector('#event-search').addEventListener('input', (event) => { state.query = event.target.value; render(); });
document.querySelector('#sort-events').addEventListener('change', (event) => { state.sort = event.target.value; render(); });
document.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; document.querySelectorAll('[data-category]').forEach((item) => item.classList.toggle('active', item === button)); render(); }));
grid.addEventListener('click', (event) => { const button = event.target.closest('[data-join]'); if (button) window.alert('Thanks for volunteering! The organizer will follow up with event details.'); });

getEvents().then((events) => { state.events = events; render(); }).catch(() => { grid.innerHTML = '<div class="empty-state"><h3>Events are taking a breather</h3><p>Check your Supabase connection and try again.</p></div>'; });