-- ─── 1. Tous les CNPE de France ────────────────────────────────────────
-- Référentiel exhaustif des Centres Nucléaires de Production
-- d'Électricité d'EDF en France métropolitaine.
-- Coordonnées GPS approximatives du centre du site.

INSERT INTO "ref_sites" ("code", "label", "adresse", "code_postal", "ville", "pays", "latitude", "longitude", "actif")
VALUES
  ('CNPE_BELLEVILLE',    'CNPE de Belleville-sur-Loire',     'Belleville-sur-Loire',         '18240', 'Belleville-sur-Loire',  'France',  47.5097,  2.8753, TRUE),
  ('CNPE_BLAYAIS',       'CNPE du Blayais',                  'Braud-et-Saint-Louis',         '33820', 'Braud-et-Saint-Louis',  'France',  45.2569, -0.6917, TRUE),
  ('CNPE_BUGEY',         'CNPE du Bugey',                    'Saint-Vulbas',                 '01150', 'Saint-Vulbas',          'France',  45.7989,  5.2706, TRUE),
  ('CNPE_CATTENOM',      'CNPE de Cattenom',                 'Cattenom',                     '57570', 'Cattenom',              'France',  49.4156,  6.2181, TRUE),
  ('CNPE_CHINON',        'CNPE de Chinon',                   'Avoine',                       '37420', 'Avoine',                'France',  47.2308,  0.1700, TRUE),
  ('CNPE_CHOOZ',         'CNPE de Chooz',                    'Chooz',                        '08600', 'Chooz',                 'France',  50.0903,  4.7900, TRUE),
  ('CNPE_CIVAUX',        'CNPE de Civaux',                   'Civaux',                       '86320', 'Civaux',                'France',  46.4564,  0.6519, TRUE),
  ('CNPE_CRUAS',         'CNPE de Cruas-Meysse',             'Cruas',                        '07350', 'Cruas',                 'France',  44.6322,  4.7569, TRUE),
  ('CNPE_DAMPIERRE',     'CNPE de Dampierre',                'Dampierre-en-Burly',           '45570', 'Dampierre-en-Burly',    'France',  47.7325,  2.5181, TRUE),
  ('CNPE_FESSENHEIM',    'CNPE de Fessenheim (arrêté)',      'Fessenheim',                   '68740', 'Fessenheim',            'France',  47.9039,  7.5631, FALSE),
  ('CNPE_FLAMANVILLE',   'CNPE de Flamanville',              'Les Pieux',                    '50340', 'Les Pieux',             'France',  49.5364, -1.8814, TRUE),
  ('CNPE_GOLFECH',       'CNPE de Golfech',                  'Golfech',                      '82400', 'Golfech',               'France',  44.1067,  0.8444, TRUE),
  ('CNPE_GRAVELINES',    'CNPE de Gravelines',               'Gravelines',                   '59820', 'Gravelines',            'France',  51.0156,  2.1361, TRUE),
  ('CNPE_NOGENT',        'CNPE de Nogent-sur-Seine',         'Nogent-sur-Seine',             '10400', 'Nogent-sur-Seine',      'France',  48.5158,  3.5181, TRUE),
  ('CNPE_PALUEL',        'CNPE de Paluel',                   'Paluel',                       '76450', 'Paluel',                'France',  49.8569,  0.6342, TRUE),
  ('CNPE_PENLY',         'CNPE de Penly',                    'Penly',                        '76630', 'Penly',                 'France',  49.9764,  1.2128, TRUE),
  ('CNPE_SAINT_ALBAN',   'CNPE de Saint-Alban / Saint-Maurice', 'Saint-Maurice-l''Exil',     '38550', 'Saint-Maurice-l''Exil', 'France',  45.4039,  4.7553, TRUE),
  ('CNPE_SAINT_LAURENT', 'CNPE de Saint-Laurent-des-Eaux',   'Saint-Laurent-Nouan',          '41220', 'Saint-Laurent-Nouan',   'France',  47.7203,  1.5781, TRUE),
  ('CNPE_TRICASTIN',     'CNPE du Tricastin',                'Saint-Paul-Trois-Châteaux',    '26130', 'Saint-Paul-Trois-Châteaux', 'France', 44.3297, 4.7322, TRUE)
ON CONFLICT ("code") DO UPDATE SET
  "label"       = EXCLUDED."label",
  "adresse"     = EXCLUDED."adresse",
  "code_postal" = EXCLUDED."code_postal",
  "ville"       = EXCLUDED."ville",
  "pays"        = EXCLUDED."pays",
  "latitude"    = EXCLUDED."latitude",
  "longitude"   = EXCLUDED."longitude",
  "actif"       = EXCLUDED."actif";

-- Sites Eichhorn / hors CNPE (siège, ateliers nationaux) :
INSERT INTO "ref_sites" ("code", "label", "adresse", "code_postal", "ville", "pays", "latitude", "longitude", "actif")
VALUES
  ('SIEGE_EDF',        'Siège EDF',                       '22-30 Avenue de Wagram',  '75008', 'Paris',         'France', 48.8780, 2.3017, TRUE),
  ('UTO_SAINT_DENIS',  'UTO — Unité Technique Opérationnelle', '1 Avenue du Général de Gaulle', '92140', 'Clamart', 'France', 48.8014, 2.2589, TRUE),
  ('CIPN_TOURS',       'CIPN — Centre Ingénierie Production Nucléaire', '37 Rue Diderot', '37000', 'Tours',  'France', 47.3941, 0.6848, TRUE),
  ('DPI_LYON',         'DPI — Direction Parc & Ingénierie', '154 Avenue Thiers',     '69006', 'Lyon',          'France', 45.7700, 4.8580, TRUE)
ON CONFLICT ("code") DO UPDATE SET "label" = EXCLUDED."label";

-- ─── 2. 100 matériels d'exemple ────────────────────────────────────────
-- On utilise generate_series(1, 100) avec un dispatching modulaire pour
-- avoir des données variées mais déterministes.
-- Distribution :
--   Type END  : UT (40%), MT (20%), PT (15%), RT (15%), VT (8%), ET (2%)
--   État      : CORRECT (75%), LEGER_DEFAUT (15%), HS (8%), PERDU (2%)
--   Sites     : 19 CNPE rotation
--   Étalonnage: 80% soumis à vérification, dates échelonnées sur ±18 mois

WITH series AS (
  SELECT i FROM generate_series(1, 100) i
),
sites AS (
  SELECT ARRAY[
    'CNPE_BELLEVILLE','CNPE_BLAYAIS','CNPE_BUGEY','CNPE_CATTENOM','CNPE_CHINON',
    'CNPE_CHOOZ','CNPE_CIVAUX','CNPE_CRUAS','CNPE_DAMPIERRE','CNPE_FLAMANVILLE',
    'CNPE_GOLFECH','CNPE_GRAVELINES','CNPE_NOGENT','CNPE_PALUEL','CNPE_PENLY',
    'CNPE_SAINT_ALBAN','CNPE_SAINT_LAURENT','CNPE_TRICASTIN','SIEGE_EDF'
  ] AS arr
),
typeend AS (
  SELECT i,
    CASE
      WHEN (i % 100) < 40 THEN 'UT'
      WHEN (i % 100) < 60 THEN 'MT'
      WHEN (i % 100) < 75 THEN 'PT'
      WHEN (i % 100) < 90 THEN 'RT'
      WHEN (i % 100) < 98 THEN 'VT'
      ELSE 'ET'
    END AS code
  FROM series
),
etat AS (
  SELECT i,
    CASE
      WHEN (i % 100) < 75 THEN 'CORRECT'
      WHEN (i % 100) < 90 THEN 'LEGER_DEFAUT'
      WHEN (i % 100) < 98 THEN 'HS'
      ELSE 'PERDU'
    END AS code
  FROM series
)
INSERT INTO "materiels" (
  "reference", "libelle", "etat",
  "type_materiel", "type_end", "type_traducteur",
  "modele", "fournisseur", "numero_serie", "numero_fiec", "lot_chaine",
  "site", "localisation", "groupe",
  "completude", "soumis_verification",
  "validite_etalonnage", "date_etalonnage", "date_prochain_etalonnage",
  "en_pret", "en_transit",
  "information_verifiee", "produits_chimiques",
  "commentaires", "proprietaire",
  "created_at", "updated_at"
)
SELECT
  CONCAT('PGM', LPAD(s.i::text, 4, '0')) AS reference,

  CASE te.code
    WHEN 'UT' THEN 'Poste à ultrasons'
    WHEN 'MT' THEN 'Poste de magnétoscopie'
    WHEN 'PT' THEN 'Kit de ressuage'
    WHEN 'RT' THEN 'Tube à rayons X'
    WHEN 'VT' THEN 'Caméra d''inspection visuelle'
    WHEN 'ET' THEN 'Sonde courants de Foucault'
  END AS libelle,

  e.code AS etat,

  -- type_materiel = label métier
  CASE te.code
    WHEN 'UT' THEN 'Poste à ultrasons'
    WHEN 'MT' THEN 'Magnétoscope'
    WHEN 'PT' THEN 'Pulvérisateur ressuage'
    WHEN 'RT' THEN 'Générateur RX'
    WHEN 'VT' THEN 'Endoscope vidéo'
    WHEN 'ET' THEN 'Multifréquence ECT'
  END,

  te.code,                                    -- type_end

  CASE te.code
    WHEN 'UT' THEN (ARRAY['MONO-ÉLÉMENT','MULTI-ÉLÉMENTS','TOFD','PHASED-ARRAY'])[((s.i % 4) + 1)]
    ELSE NULL
  END AS type_traducteur,

  -- modèle (variation)
  CASE te.code
    WHEN 'UT' THEN (ARRAY['DENSITO','EPOCH 650','OmniScan MX2','38DL Plus','MasterScan','USM Vision'])[((s.i % 6) + 1)]
    WHEN 'MT' THEN (ARRAY['Y9','Y6','PARKER B310','MAGNAFLUX Y7'])[((s.i % 4) + 1)]
    WHEN 'PT' THEN (ARRAY['BABBCO ZL-67B','MR68','SHERWIN DP-55'])[((s.i % 3) + 1)]
    WHEN 'RT' THEN (ARRAY['ERESCO 65 MF4','XRS-3 PORTABLE','CP-160'])[((s.i % 3) + 1)]
    WHEN 'VT' THEN (ARRAY['IPLEX NX','GE XL Vu+','WAYGATE Mentor Visual'])[((s.i % 3) + 1)]
    WHEN 'ET' THEN (ARRAY['MULTI3000','LOCATOR 2','PHASEC 3D'])[((s.i % 3) + 1)]
  END,

  -- fournisseur
  CASE te.code
    WHEN 'UT' THEN (ARRAY['SOFRANEL','Olympus','Sonatest','Krautkramer','Eddyfi'])[((s.i % 5) + 1)]
    WHEN 'MT' THEN (ARRAY['Magnaflux','Parker Research','TIEDE'])[((s.i % 3) + 1)]
    WHEN 'PT' THEN (ARRAY['Magnaflux','BABBCO','Sherwin'])[((s.i % 3) + 1)]
    WHEN 'RT' THEN (ARRAY['GE / Waygate','YXLON','ICM'])[((s.i % 3) + 1)]
    WHEN 'VT' THEN (ARRAY['Olympus','Waygate','Mitcorp'])[((s.i % 3) + 1)]
    WHEN 'ET' THEN (ARRAY['Eddyfi','Hocking','Olympus'])[((s.i % 3) + 1)]
  END,

  CONCAT('SN-', te.code, '-', LPAD(s.i::text, 5, '0')),

  CONCAT('1635', LPAD(s.i::text, 6, '0')) AS numero_fiec,

  CONCAT('LOT-', te.code, '-', LPAD((s.i % 12 + 1)::text, 3, '0')) AS lot_chaine,

  -- site : rotation modulo 19
  (SELECT arr[((s.i - 1) % 19) + 1] FROM sites),

  -- localisation : phrase "Magasin / Atelier END / Cellule N"
  (ARRAY[
    'Magasin matériel — Niveau 0',
    'Atelier END — Cellule A',
    'Atelier END — Cellule B',
    'Magasin Outillage — Rayon R-12',
    'Local étalonnage',
    'Salle de qualification CND'
  ])[((s.i % 6) + 1)],

  -- groupe : G1..G5
  CONCAT('G', ((s.i % 5) + 1)),

  -- completude
  CASE WHEN (s.i % 7) = 0 THEN 'INCOMPLET' ELSE 'COMPLET' END,

  -- soumis_verification
  CASE WHEN (s.i % 5) = 0 THEN FALSE ELSE TRUE END,

  -- validite_etalonnage en mois
  (ARRAY[6,12,18,24])[((s.i % 4) + 1)],

  -- date_etalonnage : il y a 1 à 18 mois
  CURRENT_TIMESTAMP - ((s.i % 18) || ' months')::INTERVAL,

  -- date_prochain_etalonnage = date_etalonnage + validité (recalculée)
  CURRENT_TIMESTAMP - ((s.i % 18) || ' months')::INTERVAL
    + (((ARRAY[6,12,18,24])[((s.i % 4) + 1)]) || ' months')::INTERVAL,

  -- en_pret : 8% en prêt
  (s.i % 12) = 0,

  -- en_transit : 5% en transit
  CASE WHEN (s.i % 20) = 0 THEN 'OUI' ELSE 'NON' END,

  -- information_verifiee : 70%
  (s.i % 10) <> 0,

  -- produits_chimiques : seulement pour PT (10%)
  te.code = 'PT' AND (s.i % 10) = 0,

  -- commentaires
  CASE
    WHEN e.code = 'HS'           THEN 'Matériel HS — à reformer.'
    WHEN e.code = 'LEGER_DEFAUT' THEN 'Léger défaut signalé en dernière inspection.'
    WHEN (s.i % 8) = 0           THEN 'Vérification annuelle effectuée par le référent.'
    ELSE NULL
  END,

  -- propriétaire
  (ARRAY['EDF DPN','EDF DPI','EDF DPNT','EDVANCE','OEPEP','CIPN'])[((s.i % 6) + 1)],

  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM series s
JOIN typeend te ON te.i = s.i
JOIN etat    e  ON e.i  = s.i
ON CONFLICT ("reference") DO NOTHING;
