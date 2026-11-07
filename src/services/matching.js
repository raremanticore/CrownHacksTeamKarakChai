/**
 * Client-side matching utilities.
 */

export const SKILLS = [
  { id: 'physical_labor', label: 'Physical Labor', icon: '💪' },
  { id: 'technology', label: 'Technology & Computers', icon: '💻' },
  { id: 'tutoring', label: 'Tutoring & Education', icon: '📚' },
  { id: 'communication', label: 'Communication & Speaking', icon: '🗣️' },
  { id: 'organization', label: 'Event Organization', icon: '📋' },
  { id: 'translation', label: 'Translation & Languages', icon: '🌍' },
  { id: 'first_aid', label: 'First Aid & Medical', icon: '🩺' },
];

export const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: '🌟' },
  { id: 'environment', label: 'Environment', icon: '🌿' },
  { id: 'hunger_relief', label: 'Hunger Relief', icon: '🍽️' },
  { id: 'education', label: 'Education', icon: '📖' },
  { id: 'health', label: 'Health & Wellness', icon: '❤️' },
  { id: 'community', label: 'Community', icon: '🏘️' },
  { id: 'animals', label: 'Animals', icon: '🐾' },
  { id: 'emergency', label: 'Emergency', icon: '🚨' },
  { id: 'arts', label: 'Arts & Culture', icon: '🎨' },
  { id: 'other', label: 'Other', icon: '✦' },
];

export const AVAILABILITY_OPTIONS = [
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'mornings', label: 'Mornings' },
  { id: 'evenings', label: 'Evenings' },
  { id: 'flexible', label: 'Flexible' },
];

export const INTERESTS = [
  { id: 'environment', label: 'Environment' },
  { id: 'education', label: 'Education' },
  { id: 'hunger_relief', label: 'Hunger Relief' },
  { id: 'health', label: 'Health' },
  { id: 'community', label: 'Community' },
  { id: 'animals', label: 'Animals' },
  { id: 'technology', label: 'Technology' },
  { id: 'arts', label: 'Arts & Culture' },
  { id: 'emergency', label: 'Emergency Response' },
];

export function getSkillLabel(id) {
  return SKILLS.find(s => s.id === id)?.label || id;
}

export function getSkillIcon(id) {
  return SKILLS.find(s => s.id === id)?.icon || '✦';
}

export function getCategoryLabel(id) {
  return CATEGORIES.find(c => c.id === id)?.label || id;
}

export function getCategoryIcon(id) {
  return CATEGORIES.find(c => c.id === id)?.icon || '✦';
}

export function getCategoryColor(id) {
  const colors = {
    environment: '#10b981',
    hunger_relief: '#f59e0b',
    education: '#6366f1',
    health: '#ec4899',
    community: '#3b82f6',
    animals: '#8b5cf6',
    emergency: '#dc2626',
    arts: '#f97316',
    other: '#6b7280',
  };
  return colors[id] || '#6b7280';
}

export function computeMatchScore(volunteerSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!volunteerSkills || volunteerSkills.length === 0) return 0;
  const matched = requiredSkills.filter(s => volunteerSkills.includes(s));
  return Math.round((matched.length / requiredSkills.length) * 100);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function isEventPast(dateStr) {
  if (!dateStr) return false;
  const eventDate = new Date(dateStr + 'T23:59:59');
  return eventDate < new Date();
}

export function isEventUpcoming(dateStr) {
  return !isEventPast(dateStr);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const event = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((event - now) / 86400000);
  return diff;
}

export function formatRelativeDate(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return formatDate(dateStr);
}
