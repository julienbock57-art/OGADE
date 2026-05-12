-- Système de notifications in-app v1
-- Deux tables : notifications (par utilisateur) + notification_preferences
-- (par utilisateur + type pour permettre le mute fin).

CREATE TABLE "notifications" (
  "id"           SERIAL       PRIMARY KEY,
  "recipient_id" INTEGER      NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
  "type"         VARCHAR(64)  NOT NULL,
  "title"        VARCHAR(255) NOT NULL,
  "message"      TEXT,
  "link"         VARCHAR(255),
  "entity_type"  VARCHAR(64),
  "entity_id"    INTEGER,
  "payload"      JSONB,
  "read_at"      TIMESTAMP,
  "created_at"   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX "notifications_recipient_id_read_at_idx"
  ON "notifications" ("recipient_id", "read_at");
CREATE INDEX "notifications_recipient_id_created_at_idx"
  ON "notifications" ("recipient_id", "created_at");

CREATE TABLE "notification_preferences" (
  "agent_id"   INTEGER     NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
  "notif_type" VARCHAR(64) NOT NULL,
  "in_app"     BOOLEAN     NOT NULL DEFAULT TRUE,
  "email"      BOOLEAN     NOT NULL DEFAULT FALSE,
  "updated_at" TIMESTAMP   NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("agent_id", "notif_type")
);
