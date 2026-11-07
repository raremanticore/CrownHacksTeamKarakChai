import { isSupabaseConfigured, getSupabase } from './supabase.js';
import {
  demoLogin, demoSignup, demoLogout, demoCurrentUser,
  getState, setState,
} from './demo.js';

export async function signUp({ email, password, full_name, role, location, description, skills, interests, availability }) {
  if (!isSupabaseConfigured()) {
    return demoSignup({ email, password, full_name, role, location, description, skills, interests, availability });
  }

  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { error: error.message };

  const userId = data.user.id;
  await sb.from('users').insert({ id: userId, full_name, email, role, location });

  if (role === 'organization') {
    await sb.from('organizations').insert({
      user_id: userId, name: full_name, description: description || '', location, contact_email: email,
    });
  } else {
    await sb.from('volunteer_profiles').insert({
      user_id: userId,
      skills: skills || [],
      interests: interests || [],
      availability: availability || '',
      confirmed_hours: 0,
    });
  }

  return { user: { id: userId, full_name, email, role, location } };
}

export async function signIn(email, password) {
  if (!isSupabaseConfigured()) {
    return demoLogin(email, password);
  }

  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const { data: userData } = await sb.from('users').select('*').eq('id', data.user.id).single();
  return { user: userData };
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    demoLogout();
    return;
  }
  const sb = getSupabase();
  await sb.auth.signOut();
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return demoCurrentUser();
  }

  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb.from('users').select('*').eq('id', user.id).single();
  return data || null;
}

export function onAuthChange(callback) {
  if (!isSupabaseConfigured()) {
    // For demo mode, check localStorage on page focus
    callback(demoCurrentUser());
    return () => {};
  }
  const sb = getSupabase();
  const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const { data } = await sb.from('users').select('*').eq('id', session.user.id).single();
      callback(data || null);
    } else {
      callback(null);
    }
  });
  return () => subscription.unsubscribe();
}
