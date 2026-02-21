-- ============================================================
-- MotoBuddy – Schema iniziale
-- ============================================================

-- Estensioni
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  avatar_url  TEXT,
  bike_model  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profilo visibile a tutti gli autenticati"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Utente aggiorna solo il proprio profilo"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Utente inserisce solo il proprio profilo"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GROUP_MEMBERS
-- ============================================================
CREATE TABLE group_members (
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RIDES
-- ============================================================
CREATE TABLE rides (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  title               TEXT NOT NULL,
  description         TEXT,
  date_time           TIMESTAMPTZ NOT NULL,
  start_lat           DOUBLE PRECISION NOT NULL,
  start_lon           DOUBLE PRECISION NOT NULL,
  meeting_point_name  TEXT,
  gpx_url             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTICIPANTS
-- ============================================================
CREATE TABLE participants (
  ride_id    UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'declined')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ride_id, user_id)
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: funzione per verificare appartenenza al gruppo
-- ============================================================
CREATE OR REPLACE FUNCTION is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES – GROUPS
-- ============================================================
CREATE POLICY "Utente autenticato può vedere i gruppi"
  ON groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Utente autenticato può creare un gruppo"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin può aggiornare il gruppo"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- RLS POLICIES – GROUP_MEMBERS
-- ============================================================
CREATE POLICY "Membro vede i membri del proprio gruppo"
  ON group_members FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY "Utente può unirsi a un gruppo"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Membro può uscire dal gruppo"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES – RIDES
-- ============================================================
CREATE POLICY "Membro vede i giri del proprio gruppo"
  ON rides FOR SELECT
  USING (is_group_member(group_id));

CREATE POLICY "Membro può creare un giro nel proprio gruppo"
  ON rides FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND is_group_member(group_id)
  );

CREATE POLICY "Creatore può aggiornare il giro"
  ON rides FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creatore può eliminare il giro"
  ON rides FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- RLS POLICIES – PARTICIPANTS
-- ============================================================
CREATE POLICY "Membro vede partecipanti dei giri del proprio gruppo"
  ON participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_id AND is_group_member(r.group_id)
    )
  );

CREATE POLICY "Utente gestisce la propria partecipazione"
  ON participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = ride_id AND is_group_member(r.group_id)
    )
  );

CREATE POLICY "Utente aggiorna la propria partecipazione"
  ON participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Utente elimina la propria partecipazione"
  ON participants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: crea profilo automaticamente dopo registrazione
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET per file GPX
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('gpx-files', 'gpx-files', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Membro può caricare file GPX"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gpx-files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Membro può leggere file GPX"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gpx-files' AND auth.role() = 'authenticated');
