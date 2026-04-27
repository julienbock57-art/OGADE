-- Add missing PowerApps fields to materiels
ALTER TABLE materiels ADD COLUMN responsable_id INTEGER REFERENCES agents(id);
ALTER TABLE materiels ADD COLUMN commentaire_etat TEXT;
ALTER TABLE materiels ADD COLUMN commentaires_completude TEXT;
ALTER TABLE materiels ADD COLUMN numero_fiec VARCHAR(255);
ALTER TABLE materiels ADD COLUMN en_transit VARCHAR(50) DEFAULT 'NON';
ALTER TABLE materiels ADD COLUMN lot_chaine VARCHAR(255);
ALTER TABLE materiels ADD COLUMN complements_localisation TEXT;
ALTER TABLE materiels ADD COLUMN proprietaire VARCHAR(255);

-- Update etat values: old workflow states → material condition states
UPDATE materiels SET etat = 'CORRECT' WHERE etat IN ('DISPONIBLE', 'EN_SERVICE');
UPDATE materiels SET etat = 'HS' WHERE etat IN ('EN_REPARATION', 'REBUT');
UPDATE materiels SET etat = 'CORRECT' WHERE etat = 'PRETE';
UPDATE materiels SET etat = 'CORRECT' WHERE etat = 'ENVOYEE';

-- Seed ETAT_MATERIEL referentiel values
DELETE FROM referentiels WHERE type = 'ETAT_MATERIEL';
INSERT INTO referentiels (type, code, label, position, actif) VALUES
  ('ETAT_MATERIEL', 'CORRECT', 'Correct', 1, true),
  ('ETAT_MATERIEL', 'LEGER_DEFAUT', 'Léger défaut', 2, true),
  ('ETAT_MATERIEL', 'HS', 'HS', 3, true),
  ('ETAT_MATERIEL', 'PERDU', 'Perdu', 4, true);

-- Seed COMPLETUDE referentiel values
DELETE FROM referentiels WHERE type = 'COMPLETUDE';
INSERT INTO referentiels (type, code, label, position, actif) VALUES
  ('COMPLETUDE', 'COMPLET', 'Complet', 1, true),
  ('COMPLETUDE', 'INCOMPLET', 'Incomplet', 2, true);

-- Seed MOTIF_PRET referentiel values
DELETE FROM referentiels WHERE type = 'MOTIF_PRET';
INSERT INTO referentiels (type, code, label, position, actif) VALUES
  ('MOTIF_PRET', 'PRET_MISE_EN_OEUVRE', 'Prêt mise en œuvre', 1, true),
  ('MOTIF_PRET', 'EN_ETALONNAGE', 'En étalonnage', 2, true),
  ('MOTIF_PRET', 'SANS_OBJET', 'Sans objet', 3, true),
  ('MOTIF_PRET', 'RESERVATION_EDF', 'Réservation EDF', 4, true),
  ('MOTIF_PRET', 'MISSION', 'Mission', 5, true);

-- Create LOT_CHAINE referentiel type
INSERT INTO referentiels (type, code, label, position, actif) VALUES
  ('LOT_CHAINE', 'PLACEHOLDER', '(à définir)', 0, true);
