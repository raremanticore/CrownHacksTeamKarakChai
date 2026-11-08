-- ============================================================
-- VOLO — Supabase Database Schema
-- Run this in your Supabase SQL editor after creating a project.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──────────────────────────────────────────────────────────────────────

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('volunteer', 'organization')),
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Organizations can read volunteer users" ON public.users
  FOR SELECT USING (
    role = 'volunteer' AND EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own row" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ── Organizations ─────────────────────────────────────────────────────────────

CREATE TABLE public.organizations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  location       TEXT,
  contact_email  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read organizations" ON public.organizations
  FOR SELECT USING (TRUE);

CREATE POLICY "Org owners manage their org" ON public.organizations
  FOR ALL USING (auth.uid() = user_id);

-- ── Volunteer Profiles ────────────────────────────────────────────────────────

CREATE TABLE public.volunteer_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skills           TEXT[] DEFAULT '{}',
  interests        TEXT[] DEFAULT '{}',
  availability     TEXT,
  confirmed_hours  INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers read own profile" ON public.volunteer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Orgs can read volunteer profiles" ON public.volunteer_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'organization'
    )
  );

CREATE POLICY "Volunteers update own profile" ON public.volunteer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Volunteers create own profile" ON public.volunteer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Events ────────────────────────────────────────────────────────────────────

CREATE TABLE public.events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL,
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  location         TEXT NOT NULL,
  required_skills  TEXT[] DEFAULT '{}',
  capacity         INTEGER NOT NULL DEFAULT 10,
  spots_taken      INTEGER NOT NULL DEFAULT 0,
  is_emergency     BOOLEAN NOT NULL DEFAULT FALSE,
  status           TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'pending_approval', 'cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published events" ON public.events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Org owners manage their events" ON public.events
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE user_id = auth.uid()
    )
  );

-- ── Event Registrations ───────────────────────────────────────────────────────

CREATE TABLE public.event_registrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  volunteer_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'waitlisted')),
  attendance_status   TEXT NOT NULL DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'confirmed', 'no_show')),
  confirmed_hours     INTEGER,
  registered_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, volunteer_user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers see own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = volunteer_user_id);

CREATE POLICY "Orgs see registrations for their events" ON public.event_registrations
  FOR SELECT USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.organizations o ON e.organization_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers insert own registration" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = volunteer_user_id);

CREATE POLICY "Volunteers update own registration" ON public.event_registrations
  FOR UPDATE USING (auth.uid() = volunteer_user_id);

CREATE POLICY "Orgs update registrations for their events" ON public.event_registrations
  FOR UPDATE USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.organizations o ON e.organization_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- ── Event Invitations ─────────────────────────────────────────────────────────

CREATE TABLE public.event_invitations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  volunteer_user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  sent_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, volunteer_user_id)
);

ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers see own invitations" ON public.event_invitations
  FOR SELECT USING (auth.uid() = volunteer_user_id);

CREATE POLICY "Orgs see invitations they sent" ON public.event_invitations
  FOR SELECT USING (auth.uid() = org_user_id);

CREATE POLICY "Orgs insert invitations" ON public.event_invitations
  FOR INSERT WITH CHECK (auth.uid() = org_user_id);

CREATE POLICY "Volunteers update own invitation response" ON public.event_invitations
  FOR UPDATE USING (auth.uid() = volunteer_user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_events_date ON public.events (date);
CREATE INDEX idx_events_category ON public.events (category);
CREATE INDEX idx_events_status ON public.events (status);
CREATE INDEX idx_events_emergency ON public.events (is_emergency);
CREATE INDEX idx_registrations_volunteer ON public.event_registrations (volunteer_user_id);
CREATE INDEX idx_registrations_event ON public.event_registrations (event_id);
CREATE INDEX idx_invitations_volunteer ON public.event_invitations (volunteer_user_id);
