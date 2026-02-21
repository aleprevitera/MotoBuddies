-- ============================================================
-- Notifiche in-app
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('new_ride', 'ride_reminder', 'new_member', 'ride_rsvp')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  link        TEXT,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Indice per query frequenti (notifiche recenti per utente)
CREATE INDEX idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- RLS: utente vede solo le proprie notifiche
CREATE POLICY "Utente vede le proprie notifiche"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: utente aggiorna solo le proprie notifiche (per mark as read)
CREATE POLICY "Utente aggiorna le proprie notifiche"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS: utente cancella le proprie notifiche
CREATE POLICY "Utente cancella le proprie notifiche"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT è consentito solo via service_role (API route), non serve policy per anon/authenticated
-- Abilitiamo Realtime per la tabella
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
