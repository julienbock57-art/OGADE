-- Update existing roles to new codes
UPDATE roles SET code = 'GESTIONNAIRE_MAGASIN', label = 'Gestionnaire magasin', description = 'Gestion du magasin et des stocks' WHERE code = 'MAGASINIER';
UPDATE roles SET code = 'REFERENT_LOGISTIQUE', label = 'Référent logistique', description = 'Référent logistique des envois et réceptions' WHERE code = 'REFERENT_LOGISTIQUE_DQI';
UPDATE roles SET code = 'ADMIN', label = 'Administrateur', description = 'Accès complet à l''application' WHERE code = 'ADMIN_MATERIELS';

-- Insert new roles if they don't exist
INSERT INTO roles (code, label, description) VALUES ('ADMIN', 'Administrateur', 'Accès complet à l''application') ON CONFLICT (code) DO NOTHING;
INSERT INTO roles (code, label, description) VALUES ('GESTIONNAIRE_MAGASIN', 'Gestionnaire magasin', 'Gestion du magasin et des stocks') ON CONFLICT (code) DO NOTHING;
INSERT INTO roles (code, label, description) VALUES ('REFERENT_LOGISTIQUE', 'Référent logistique', 'Référent logistique des envois et réceptions') ON CONFLICT (code) DO NOTHING;
INSERT INTO roles (code, label, description) VALUES ('REFERENT_MAQUETTE', 'Référent maquette', 'Référent des maquettes END') ON CONFLICT (code) DO NOTHING;
INSERT INTO roles (code, label, description) VALUES ('REFERENT_MATERIEL', 'Référent matériel', 'Référent des matériels END') ON CONFLICT (code) DO NOTHING;

-- Add admin agent (julien.bock57@gmail.com) if not exists
INSERT INTO agents (email, nom, prenom, actif, created_at, updated_at)
VALUES ('julien.bock57@gmail.com', 'Bock', 'Julien', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Assign ADMIN role to julien.bock57@gmail.com
INSERT INTO agent_roles (agent_id, role_id, granted_at)
SELECT a.id, r.id, NOW()
FROM agents a, roles r
WHERE a.email = 'julien.bock57@gmail.com' AND r.code = 'ADMIN'
ON CONFLICT (agent_id, role_id) DO NOTHING;
