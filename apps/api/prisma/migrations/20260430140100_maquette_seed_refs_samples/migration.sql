-- Référentiels manquants pour la fiche maquette
-- TYPE_DEFAUT (catalogue des défauts artificiels)
INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('TYPE_DEFAUT', 'FISSURE',    'Fissure',           1, TRUE),
  ('TYPE_DEFAUT', 'POROSITE',   'Porosité',          2, TRUE),
  ('TYPE_DEFAUT', 'INCLUSION',  'Inclusion',         3, TRUE),
  ('TYPE_DEFAUT', 'MANQUE_FUSION', 'Manque de fusion', 4, TRUE),
  ('TYPE_DEFAUT', 'RETASSURE',  'Retassure',         5, TRUE),
  ('TYPE_DEFAUT', 'SOUFFLURE',  'Soufflure',         6, TRUE),
  ('TYPE_DEFAUT', 'CANIVEAU',   'Caniveau',          7, TRUE),
  ('TYPE_DEFAUT', 'EFFONDREMENT', 'Effondrement',    8, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

-- POLE_ENTITE
INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('POLE_ENTITE', 'DPI',  'Direction Parc & Ingénierie',     1, TRUE),
  ('POLE_ENTITE', 'DPN',  'Direction Production Nucléaire',  2, TRUE),
  ('POLE_ENTITE', 'DPNT', 'Direction Production Nuc. & Therm.', 3, TRUE),
  ('POLE_ENTITE', 'EDVANCE', 'EDVANCE',                      4, TRUE),
  ('POLE_ENTITE', 'OEPEP', 'Pôle Examens Périodiques',       5, TRUE),
  ('POLE_ENTITE', 'CIPN', 'CIPN',                            6, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

-- PAYS (cas FR + neighbors)
INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('PAYS', 'FR', 'France',    1, TRUE),
  ('PAYS', 'BE', 'Belgique',  2, TRUE),
  ('PAYS', 'DE', 'Allemagne', 3, TRUE),
  ('PAYS', 'CH', 'Suisse',    4, TRUE),
  ('PAYS', 'IT', 'Italie',    5, TRUE),
  ('PAYS', 'ES', 'Espagne',   6, TRUE),
  ('PAYS', 'GB', 'Royaume-Uni', 7, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

-- Compléter les référentiels existants si vides
INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('TYPE_MAQUETTE', 'QUALIFICATION', 'Maquette de qualification', 1, TRUE),
  ('TYPE_MAQUETTE', 'ENTRAINEMENT',  'Maquette d''entraînement',  2, TRUE),
  ('TYPE_MAQUETTE', 'ASN',           'Maquette ASN',              3, TRUE),
  ('TYPE_MAQUETTE', 'DEMO',          'Maquette de démonstration', 4, TRUE),
  ('TYPE_MAQUETTE', 'RECETTE',       'Maquette de recette',       5, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('FORME', 'TUBE',         'Tube',               1, TRUE),
  ('FORME', 'COUDE',        'Coude',              2, TRUE),
  ('FORME', 'TE',           'Té',                 3, TRUE),
  ('FORME', 'SOUDURE',      'Soudure',            4, TRUE),
  ('FORME', 'PIQUAGE',      'Piquage',            5, TRUE),
  ('FORME', 'RESERVOIR',    'Réservoir',          6, TRUE),
  ('FORME', 'PLAQUE',       'Plaque',             7, TRUE),
  ('FORME', 'BARRE',        'Barre',              8, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('MATIERE', 'INOX_316L',  'Inox 316L',          1, TRUE),
  ('MATIERE', 'INOX_304L',  'Inox 304L',          2, TRUE),
  ('MATIERE', 'A48',        'Acier A48',          3, TRUE),
  ('MATIERE', 'A106',       'Acier A106',         4, TRUE),
  ('MATIERE', 'P265GH',     'Acier P265GH',       5, TRUE),
  ('MATIERE', 'P355NH',     'Acier P355NH',       6, TRUE),
  ('MATIERE', 'INCONEL_600','Inconel 600',        7, TRUE),
  ('MATIERE', 'INCONEL_690','Inconel 690',        8, TRUE),
  ('MATIERE', 'CUIVRE',     'Cuivre',             9, TRUE),
  ('MATIERE', 'ALUMINIUM',  'Aluminium',         10, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('COMPOSANT', 'TUYAUTERIE',     'Tuyauterie',          1, TRUE),
  ('COMPOSANT', 'CUVE',           'Cuve',                2, TRUE),
  ('COMPOSANT', 'PRESSURISEUR',   'Pressuriseur',        3, TRUE),
  ('COMPOSANT', 'GENERATEUR_VAP', 'Générateur de vapeur',4, TRUE),
  ('COMPOSANT', 'POMPE',          'Pompe',               5, TRUE),
  ('COMPOSANT', 'VANNE',          'Vanne',               6, TRUE),
  ('COMPOSANT', 'ECHANGEUR',      'Échangeur',           7, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('CATEGORIE', 'PRIMAIRE',   'Circuit primaire',     1, TRUE),
  ('CATEGORIE', 'SECONDAIRE', 'Circuit secondaire',   2, TRUE),
  ('CATEGORIE', 'AUXILIAIRE', 'Circuit auxiliaire',   3, TRUE),
  ('CATEGORIE', 'CONVENTIONNEL','Conventionnel',      4, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('TYPE_ASSEMBLAGE', 'SOUDURE_BAB',     'Soudure bout-à-bout',  1, TRUE),
  ('TYPE_ASSEMBLAGE', 'SOUDURE_ANGLE',   'Soudure d''angle',     2, TRUE),
  ('TYPE_ASSEMBLAGE', 'SOUDURE_PIQUAGE', 'Soudure de piquage',   3, TRUE),
  ('TYPE_ASSEMBLAGE', 'BRIDE',           'Bride boulonnée',      4, TRUE),
  ('TYPE_ASSEMBLAGE', 'EMMANCHEMENT',    'Emmanchement',         5, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('TYPE_CONTROLE', 'UT',  'Ultrasons (UT)',       1, TRUE),
  ('TYPE_CONTROLE', 'RT',  'Radiographie (RT)',    2, TRUE),
  ('TYPE_CONTROLE', 'MT',  'Magnétoscopie (MT)',   3, TRUE),
  ('TYPE_CONTROLE', 'PT',  'Ressuage (PT)',        4, TRUE),
  ('TYPE_CONTROLE', 'VT',  'Visuel (VT)',          5, TRUE),
  ('TYPE_CONTROLE', 'ET',  'Courants de Foucault (ET)', 6, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('PROCEDURE', 'PROC_UT_001',  'PROC_UT_001 — UT manuel base',     1, TRUE),
  ('PROCEDURE', 'PROC_UT_002',  'PROC_UT_002 — UT TOFD',            2, TRUE),
  ('PROCEDURE', 'PROC_UT_003',  'PROC_UT_003 — UT Phased Array',    3, TRUE),
  ('PROCEDURE', 'PROC_RT_001',  'PROC_RT_001 — Radio gamma',        4, TRUE),
  ('PROCEDURE', 'PROC_MT_001',  'PROC_MT_001 — Magnétoscopie',      5, TRUE),
  ('PROCEDURE', 'PROC_PT_001',  'PROC_PT_001 — Ressuage couleur',   6, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

INSERT INTO "referentiels" ("type", "code", "label", "position", "actif")
VALUES
  ('ETAT_MAQUETTE', 'STOCK',         'En stock',       1, TRUE),
  ('ETAT_MAQUETTE', 'EMPRUNTEE',     'Empruntée',      2, TRUE),
  ('ETAT_MAQUETTE', 'EN_CONTROLE',   'En contrôle',    3, TRUE),
  ('ETAT_MAQUETTE', 'EN_REPARATION', 'En réparation',  4, TRUE),
  ('ETAT_MAQUETTE', 'REBUT',         'Rebut',          5, TRUE),
  ('ETAT_MAQUETTE', 'ENVOYEE',       'Envoyée',        6, TRUE)
ON CONFLICT ("type", "code") DO NOTHING;

-- ─── 3 maquettes de test ──────────────────────────────────────────
-- On évite l'insertion en double si la migration est rejouée.
INSERT INTO "maquettes" (
  "reference", "libelle", "etat",
  "site", "localisation", "type_maquette", "categorie", "composant",
  "forme", "matiere", "type_assemblage", "type_controle", "procedures",
  "longueur", "largeur", "hauteur", "dn", "epaisseur_paroi", "poids", "quantite",
  "description", "vie_maquette", "commentaires", "complements_localisation",
  "reference_asn", "hors_patrimoine", "informations_certifiees", "en_transit",
  "produits_chimiques",
  "numero_fiec", "reference_unique",
  "lien_ecm", "lien_ecm_rff",
  "pole_entite", "entreprise",
  "valeur_financiere", "duree_vie",
  "colisage_longueur", "colisage_largeur", "colisage_hauteur", "colisage_poids",
  "colisage_description",
  "localisation_salle", "localisation_rayonnage",
  "adresse_num_voie", "adresse_nom_voie", "adresse_code_postal", "adresse_ville",
  "adresse_pays", "adresse_site",
  "pieces", "description_defauts", "amortissement",
  "created_at", "updated_at"
) VALUES
(
  'MQ-2026-001', 'Tube primaire DN350 — Maquette qualification UT',
  'STOCK',
  'CRUAS', 'Magasin maquettes A2', 'QUALIFICATION', 'PRIMAIRE', 'TUYAUTERIE',
  'TUBE', 'INOX_316L', 'SOUDURE_BAB', 'UT',
  'PROC_UT_001, PROC_UT_002',
  1200, NULL, NULL, 350, 28, 215, 1,
  'Maquette de tube primaire DN350 instrumentée de défauts artificiels pour qualification UT manuel et TOFD.',
  'Fabriquée en 2018 par CETIM. Utilisée pour la qualification annuelle des opérateurs UT.',
  'Présente plusieurs défauts artificiels en zone soudée pour qualification.',
  'Stockée sur palette dédiée — manutention pont roulant uniquement.',
  TRUE, FALSE, TRUE, FALSE, FALSE,
  '1635450010', 1001,
  'https://ecm.edf.fr/maquettes/MQ-2026-001/fiche.pdf',
  'https://ecm.edf.fr/maquettes/MQ-2026-001/RFF.pdf',
  'OEPEP', 'EDF',
  18500, 25,
  1300, 450, 450, 230,
  'Caisse bois renforcée + sangles fixation. Levage interdit en biais.',
  'Salle Magasin A — Niveau 0',
  'Rayonnage R-12, étagère 3',
  '12', 'Avenue de l''Énergie', '07350', 'Cruas', 'FR', 'CNPE Cruas',
  'Tube principal + 1 manchette soudée + bouchons d''extrémité', '4 défauts artificiels (2 fissures, 1 manque de fusion, 1 inclusion) en zone HAZ.',
  'Linéaire 25 ans — Valeur résiduelle 9 250 €',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'MQ-2026-002', 'Coude radiographié 90° — Recette TOFD',
  'EMPRUNTEE',
  'GRAVELINES', 'Atelier END Gravelines', 'RECETTE', 'PRIMAIRE', 'TUYAUTERIE',
  'COUDE', 'A106', 'SOUDURE_BAB', 'UT, RT',
  'PROC_UT_002, PROC_RT_001',
  900, 900, NULL, 250, 20, 165, 1,
  'Maquette coude 90° avec inclusions et porosités calibrées sur la soudure de raccordement, utilisée en recette TOFD/RT.',
  'Fournie en 2020 par INTERCONTROLE pour la recette des nouvelles procédures TOFD.',
  'Coude prêté à la société INTERCONTROLE pour formation interne.',
  '',
  FALSE, FALSE, TRUE, TRUE, FALSE,
  '1635450020', 1002,
  'https://ecm.edf.fr/maquettes/MQ-2026-002/fiche.pdf',
  NULL,
  'OEPEP', 'EDF',
  14200, 25,
  1100, 1100, 350, 175,
  'Caisse en aluminium avec absorbeur — Levage par pontet supérieur',
  'Atelier END — Cellule 4',
  'Étagère mobile R-04',
  '8', 'Rue de la Plage', '59820', 'Gravelines', 'FR', 'CNPE Gravelines',
  'Coude 90° + manchettes droites + bouchons', 'Soudure du milieu : 3 inclusions ø 2 mm, 2 porosités dispersées.',
  'Linéaire 25 ans — Valeur résiduelle 7 100 €',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'MQ-2026-003', 'Plaque épaisse — Démo magnétoscopie',
  'STOCK',
  'CHOOZ', 'Salle de formation END', 'DEMO', 'CONVENTIONNEL', 'TUYAUTERIE',
  'PLAQUE', 'P355NH', 'SOUDURE_ANGLE', 'MT, PT',
  'PROC_MT_001, PROC_PT_001',
  600, 400, 50, NULL, NULL, 95, 1,
  'Plaque acier P355NH avec fissures de surface variées et porosités, utilisée en démo MT/PT.',
  'Constituée à partir d''un rebut de chaudronnerie 2019. Réservée aux démonstrations clients.',
  'Maquette de démo : ne pas utiliser pour qualification métrologique.',
  'Stockée à plat dans son support bois.',
  FALSE, TRUE, FALSE, FALSE, FALSE,
  '1635450030', 1003,
  NULL,
  NULL,
  'CIPN', 'EDF',
  4800, 15,
  650, 450, 80, 110,
  'Support bois ouvert avec cales mousse',
  'Salle de formation END — A1',
  'Présentoir mural P-3',
  '1', 'Route de Givet', '08600', 'Chooz', 'FR', 'CNPE Chooz',
  'Plaque + support bois', '6 fissures de surface (longueur 5 à 30 mm), 4 porosités sur la soudure d''angle.',
  'Hors patrimoine — Pas d''amortissement',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("reference") DO NOTHING;
