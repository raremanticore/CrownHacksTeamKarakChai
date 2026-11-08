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
  const profile = { full_name, role, location, description, skills, interests, availability };
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: profile },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Supabase did not create the account.' };

  if (data.session) {
    const profileResult = await createProfileRecords(sb, data.user, profile);
    if (profileResult.error) return profileResult;
  }

  return {
    user: { id: data.user.id, full_name, email, role, location },
    needsEmailConfirmation: !data.session,
  };
}

export async function signIn(email, password) {
  if (!isSupabaseConfigured()) {
    return demoLogin(email, password);
  }

  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  let { data: userData } = await sb.from('users').select('*').eq('id', data.user.id).single();
  if (!userData) {
    const profileResult = await createProfileRecords(sb, data.user, data.user.user_metadata || {});
    if (profileResult.error) return profileResult;
    userData = profileResult.user;
  }
  if (!userData) return { error: 'Your account profile is incomplete. Please contact support.' };
  return { user: userData };
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) return { error: 'Google sign-in requires Supabase configuration.' };

  const sb = getSupabase();
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return error ? { error: error.message } : { success: true };
}

async function createProfileRecords(sb, authUser, profile) {
  const fullName = profile.full_name || authUser.email?.split('@')[0] || 'VOLO User';
  const role = profile.role === 'organization' ? 'organization' : 'volunteer';
  const { data: user, error: userError } = await sb.from('users').upsert({
    id: authUser.id,
    full_name: fullName,
    email: authUser.email,
    role,
    location: profile.location || null,
  }).select().single();
  if (userError) return { error: userError.message };

  if (role === 'organization') {
    const { error } = await sb.from('organizations').insert({
      user_id: authUser.id,
      name: fullName,
      description: profile.description || '',
      location: profile.location || null,
      contact_email: authUser.email,
    });
    if (error && error.code !== '23505') return { error: error.message };
  } else {
    const { error } = await sb.from('volunteer_profiles').insert({
      user_id: authUser.id,
      skills: profile.skills || [],
      interests: profile.interests || [],
      availability: profile.availability || '',
      confirmed_hours: 0,
    });
    if (error && error.code !== '23505') return { error: error.message };
  }

  return { user };
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

  let { data } = await sb.from('users').select('*').eq('id', user.id).single();
  if (!data) {
    const profileResult = await createProfileRecords(sb, user, user.user_metadata || {});
    data = profileResult.user || null;
  }
  return data;
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
