import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReferentiels() {
  const refs: { type: string; values: { code: string; label: string }[] }[] = [
    {
      type: 'TYPE_END',
      values: [
        { code: 'UT', label: 'Ultrasons (UT)' },
        { code: 'RT', label: 'Radiographie (RT)' },
        { code: 'ET', label: 'Courants de Foucault (ET)' },
        { code: 'VT', label: 'Examen visuel (VT)' },
        { code: 'PT', label: 'Ressuage (PT)' },
        { code: 'MT', label: 'Magnétoscopie (MT)' },
        { code: 'LT', label: 'Étanchéité (LT)' },
        { code: 'TT', label: 'Thermographie (TT)' },
      ],
    },
    {
      type: 'TYPE_MATERIEL',
      values: [
        { code: 'TRADUCTEUR', label: 'Traducteur' },
        { code: 'APPAREIL', label: 'Appareil' },
        { code: 'ACCESSOIRE', label: 'Accessoire' },
        { code: 'SONDE', label: 'Sonde' },
        { code: 'CALIBRE', label: 'Calibre / Étalon' },
        { code: 'CABLE', label: 'Câble' },
        { code: 'LOGICIEL', label: 'Logiciel' },
        { code: 'CONSOMMABLE', label: 'Consommable' },
        { code: 'OUTILLAGE', label: 'Outillage' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'GROUPE',
      values: [
        { code: 'UT_CONVENTIONNEL', label: 'UT Conventionnel' },
        { code: 'UT_PHASED_ARRAY', label: 'UT Phased Array' },
        { code: 'UT_TOFD', label: 'UT TOFD' },
        { code: 'RT_FILM', label: 'RT Film' },
        { code: 'RT_NUMERIQUE', label: 'RT Numérique' },
        { code: 'ET_CONVENTIONNEL', label: 'ET Conventionnel' },
        { code: 'ET_MULTIFREQUENCE', label: 'ET Multifréquence' },
        { code: 'PT_FLUORESCENT', label: 'PT Fluorescent' },
        { code: 'PT_VISIBLE', label: 'PT Visible' },
        { code: 'MT_ELECTRO', label: 'MT Électroaimant' },
        { code: 'VT_ENDOSCOPE', label: 'VT Endoscope' },
        { code: 'GENERAL', label: 'Général' },
      ],
    },
    {
      type: 'ETAT_MATERIEL',
      values: [
        { code: 'DISPONIBLE', label: 'Disponible' },
        { code: 'EN_SERVICE', label: 'En service' },
        { code: 'EN_REPARATION', label: 'En réparation' },
        { code: 'EN_ETALONNAGE', label: 'En étalonnage' },
        { code: 'PRETE', label: 'Prêté' },
        { code: 'REBUT', label: 'Rebut' },
        { code: 'ENVOYEE', label: 'Envoyé' },
        { code: 'RESERVE', label: 'Réservé' },
      ],
    },
    {
      type: 'COMPLETUDE',
      values: [
        { code: 'COMPLET', label: 'Complet' },
        { code: 'INCOMPLET', label: 'Incomplet' },
        { code: 'A_VERIFIER', label: 'À vérifier' },
      ],
    },
    {
      type: 'MOTIF_PRET',
      values: [
        { code: 'ESSAI', label: 'Essai' },
        { code: 'FORMATION', label: 'Formation' },
        { code: 'CHANTIER', label: 'Chantier' },
        { code: 'MAINTENANCE', label: 'Maintenance' },
        { code: 'DEMONSTRATION', label: 'Démonstration' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'TYPE_MAQUETTE',
      values: [
        { code: 'MECANIQUE', label: 'Mécanique' },
        { code: 'ELECTRONIQUE', label: 'Électronique' },
        { code: 'STRUCTURE', label: 'Structure' },
        { code: 'TUYAUTERIE', label: 'Tuyauterie' },
        { code: 'SOUDURE', label: 'Soudure' },
        { code: 'COMPOSITE', label: 'Composite' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'COMPOSANT',
      values: [
        { code: 'CUVE', label: 'Cuve' },
        { code: 'GV', label: 'Générateur de vapeur' },
        { code: 'TUYAUTERIE', label: 'Tuyauterie' },
        { code: 'PRESSURISEUR', label: 'Pressuriseur' },
        { code: 'RCP', label: 'Circuit primaire (RCP)' },
        { code: 'ENCEINTE', label: 'Enceinte de confinement' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'CATEGORIE',
      values: [
        { code: 'REFERENCE', label: 'Référence' },
        { code: 'ESSAI', label: 'Essai' },
        { code: 'FORMATION', label: 'Formation' },
        { code: 'QUALIFICATION', label: 'Qualification' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'FORME',
      values: [
        { code: 'PLANE', label: 'Plane' },
        { code: 'CYLINDRIQUE', label: 'Cylindrique' },
        { code: 'SPHERIQUE', label: 'Sphérique' },
        { code: 'CONIQUE', label: 'Conique' },
        { code: 'TUBULAIRE', label: 'Tubulaire' },
        { code: 'COMPLEXE', label: 'Complexe' },
      ],
    },
    {
      type: 'TYPE_ASSEMBLAGE',
      values: [
        { code: 'SOUDE', label: 'Soudé' },
        { code: 'BOLTE', label: 'Boulonné' },
        { code: 'BRIDE', label: 'Bridé' },
        { code: 'EMBOITE', label: 'Emboîté' },
        { code: 'MONOBLOC', label: 'Monobloc' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'MATIERE',
      values: [
        { code: 'ACIER_CARBONE', label: 'Acier carbone' },
        { code: 'ACIER_INOX', label: 'Acier inoxydable' },
        { code: 'INCONEL', label: 'Inconel' },
        { code: 'ALUMINIUM', label: 'Aluminium' },
        { code: 'TITANE', label: 'Titane' },
        { code: 'ZIRCALOY', label: 'Zircaloy' },
        { code: 'COMPOSITE', label: 'Composite' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'PROCEDURE',
      values: [
        { code: 'MC_0000', label: 'MC-0000 (Générique)' },
        { code: 'MC_0100', label: 'MC-0100 (UT)' },
        { code: 'MC_0200', label: 'MC-0200 (RT)' },
        { code: 'MC_0300', label: 'MC-0300 (ET)' },
        { code: 'MC_0400', label: 'MC-0400 (MT)' },
        { code: 'MC_0500', label: 'MC-0500 (PT)' },
        { code: 'MC_0600', label: 'MC-0600 (VT)' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'TYPE_CONTROLE',
      values: [
        { code: 'FABRICATION', label: 'Contrôle de fabrication' },
        { code: 'EN_SERVICE', label: 'Contrôle en service' },
        { code: 'RECEPTION', label: 'Contrôle de réception' },
        { code: 'QUALIFICATION', label: 'Qualification' },
        { code: 'AUTRE', label: 'Autre' },
      ],
    },
    {
      type: 'ETAT_MAQUETTE',
      values: [
        { code: 'STOCK', label: 'En stock' },
        { code: 'EMPRUNTEE', label: 'Empruntée' },
        { code: 'EN_CONTROLE', label: 'En contrôle' },
        { code: 'EN_FABRICATION', label: 'En cours de fabrication' },
        { code: 'EN_REPARATION', label: 'En réparation' },
        { code: 'REBUT', label: 'Rebut' },
        { code: 'ENVOYEE', label: 'Envoyée' },
      ],
    },
    {
      type: 'URGENCE',
      values: [
        { code: 'NORMALE', label: 'Normale' },
        { code: 'URGENTE', label: 'Urgente' },
        { code: 'TRES_URGENTE', label: 'Très urgente' },
      ],
    },
    {
      type: 'TYPE_TRADUCTEUR',
      values: [
        { code: 'MONO', label: 'Mono-élément' },
        { code: 'MULTI', label: 'Multi-éléments' },
        { code: 'PHASED_ARRAY', label: 'Phased Array' },
        { code: 'FOCALISE', label: 'Focalisé' },
        { code: 'CONTACT', label: 'Contact' },
        { code: 'IMMERSION', label: 'Immersion' },
        { code: 'SABOT', label: 'Avec sabot' },
      ],
    },
  ];

  for (const { type, values } of refs) {
    for (let i = 0; i < values.length; i++) {
      const { code, label } = values[i];
      await prisma.referentiel.upsert({
        where: { type_code: { type, code } },
        update: { label, position: i },
        create: { type, code, label, position: i },
      });
    }
  }

  console.log(`Referentiels seeded (${refs.length} types)`);
}

async function seedSites() {
  const sites = [
    { code: 'PARIS_DQI', label: 'DQI Paris', adresse: '22-30 avenue de Wagram', codePostal: '75008', ville: 'Paris' },
    { code: 'LYON_BTN', label: 'BTN Lyon', adresse: '154 avenue Thiers', codePostal: '69006', ville: 'Lyon' },
    { code: 'MARSEILLE', label: 'CNPE Marseille', adresse: 'Zone industrielle de Fos', codePostal: '13270', ville: 'Fos-sur-Mer' },
    { code: 'SAINT_DENIS', label: 'Saint-Denis', adresse: '1 place Samuel de Champlain', codePostal: '92210', ville: 'Saint-Denis' },
    { code: 'CHINON', label: 'CNPE Chinon', adresse: 'BP 80', codePostal: '37420', ville: 'Avoine' },
    { code: 'GRAVELINES', label: 'CNPE Gravelines', adresse: 'BP 149', codePostal: '59820', ville: 'Gravelines' },
    { code: 'CATTENOM', label: 'CNPE Cattenom', adresse: 'BP 41', codePostal: '57570', ville: 'Cattenom' },
    { code: 'FLAMANVILLE', label: 'CNPE Flamanville', adresse: 'BP 4', codePostal: '50340', ville: 'Les Pieux' },
  ];

  for (const site of sites) {
    await prisma.site.upsert({
      where: { code: site.code },
      update: { label: site.label, adresse: site.adresse, codePostal: site.codePostal, ville: site.ville },
      create: site,
    });
  }

  console.log(`Sites seeded (${sites.length})`);
}

async function seedEntreprises() {
  const entreprises = [
    { code: 'EDF', label: 'EDF', type: 'ENTREPRISE', adresse: '22-30 avenue de Wagram', codePostal: '75008', ville: 'Paris' },
    { code: 'FRAMATOME', label: 'Framatome', type: 'ENTREPRISE', adresse: '1 place Jean Millier', codePostal: '92400', ville: 'Courbevoie' },
    { code: 'ORANO', label: 'Orano', type: 'ENTREPRISE', adresse: '125 avenue de Paris', codePostal: '92320', ville: 'Châtillon' },
    { code: 'INETEC', label: 'INETEC', type: 'FOURNISSEUR', adresse: 'Lučko', codePostal: '10250', ville: 'Zagreb', pays: 'Croatie' },
    { code: 'OLYMPUS', label: 'Olympus / Evident', type: 'FOURNISSEUR', adresse: '7 allée de l\'Europe', codePostal: '92110', ville: 'Clichy' },
    { code: 'EDDYFI', label: 'Eddyfi Technologies', type: 'FOURNISSEUR', adresse: '3425 av. Pierre-Ardouin', codePostal: 'G1P 0B3', ville: 'Québec', pays: 'Canada' },
    { code: 'GE_INSPECTION', label: 'Baker Hughes (ex-GE IT)', type: 'FOURNISSEUR', adresse: '50 rue de la Victoire', codePostal: '75009', ville: 'Paris' },
    { code: 'SONATEST', label: 'Sonatest', type: 'FOURNISSEUR', adresse: 'Dickens Road', codePostal: 'MK12 5QQ', ville: 'Milton Keynes', pays: 'Royaume-Uni' },
    { code: 'TESTIA', label: 'Testia (Airbus)', type: 'FOURNISSEUR', adresse: '18 rue Marius Tercé', codePostal: '31300', ville: 'Toulouse' },
    { code: 'INTERCONTROLE', label: 'Intercontrôle (Framatome)', type: 'FOURNISSEUR', adresse: '3 rue Ampère', codePostal: '91300', ville: 'Massy' },
  ];

  for (const ent of entreprises) {
    await prisma.entreprise.upsert({
      where: { code: ent.code },
      update: { label: ent.label, type: ent.type, adresse: ent.adresse, codePostal: ent.codePostal, ville: ent.ville, pays: ent.pays },
      create: ent,
    });
  }

  console.log(`Entreprises seeded (${entreprises.length})`);
}

async function seedRolesAndAgents() {
  const roles = [
    { code: 'ADMIN', label: 'Administrateur', description: 'Accès complet à l\'application' },
    { code: 'GESTIONNAIRE_MAGASIN', label: 'Gestionnaire magasin', description: 'Gestion du magasin et des stocks' },
    { code: 'REFERENT_LOGISTIQUE', label: 'Référent logistique', description: 'Référent logistique des envois et réceptions' },
    { code: 'REFERENT_MAQUETTE', label: 'Référent maquette', description: 'Référent des maquettes END' },
    { code: 'REFERENT_MATERIEL', label: 'Référent matériel', description: 'Référent des matériels END' },
  ];

  const createdRoles: Record<string, { id: number }> = {};
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { code: role.code },
      update: { label: role.label, description: role.description },
      create: role,
    });
    createdRoles[role.code] = r;
  }

  // Admin principal
  const adminAgent = await prisma.agent.upsert({
    where: { email: 'julien.bock57@gmail.com' },
    update: { nom: 'Bock', prenom: 'Julien' },
    create: { email: 'julien.bock57@gmail.com', nom: 'Bock', prenom: 'Julien', actif: true },
  });

  // Assigner le rôle ADMIN
  if (createdRoles['ADMIN']) {
    await prisma.agentRole.upsert({
      where: { agentId_roleId: { agentId: adminAgent.id, roleId: createdRoles['ADMIN'].id } },
      update: {},
      create: { agentId: adminAgent.id, roleId: createdRoles['ADMIN'].id },
    });
  }

  // Agent de test pour le dev
  const devAgent = await prisma.agent.upsert({
    where: { email: 'admin@ogade.test' },
    update: { nom: 'Admin', prenom: 'Dev' },
    create: { email: 'admin@ogade.test', nom: 'Admin', prenom: 'Dev', actif: true },
  });

  for (const roleCode of Object.keys(createdRoles)) {
    await prisma.agentRole.upsert({
      where: { agentId_roleId: { agentId: devAgent.id, roleId: createdRoles[roleCode].id } },
      update: {},
      create: { agentId: devAgent.id, roleId: createdRoles[roleCode].id },
    });
  }

  console.log('Roles & agents seeded');
  return devAgent;
}

async function seedMateriels(adminId: number) {
  const materiels = [
    { reference: 'MAT-001', libelle: 'Sonde UT PA 5L64-A2', typeMateriel: 'TRADUCTEUR', typeEND: 'UT', groupe: 'UT_PHASED_ARRAY', site: 'PARIS_DQI', etat: 'DISPONIBLE', fournisseur: 'Olympus', modele: '5L64-A2' },
    { reference: 'MAT-002', libelle: 'Appareil Epoch 1000i', typeMateriel: 'APPAREIL', typeEND: 'UT', groupe: 'UT_CONVENTIONNEL', site: 'PARIS_DQI', etat: 'EN_SERVICE', fournisseur: 'Olympus', modele: 'Epoch 1000i' },
    { reference: 'MAT-003', libelle: 'Sonde ET Zetec +Point', typeMateriel: 'SONDE', typeEND: 'ET', groupe: 'ET_CONVENTIONNEL', site: 'LYON_BTN', etat: 'DISPONIBLE', fournisseur: 'Eddyfi', modele: '+Point' },
    { reference: 'MAT-004', libelle: 'Source Ir-192 Sentinel', typeMateriel: 'APPAREIL', typeEND: 'RT', groupe: 'RT_FILM', site: 'LYON_BTN', etat: 'EN_REPARATION', fournisseur: 'GE Inspection', modele: 'Sentinel 880' },
    { reference: 'MAT-005', libelle: 'Yoke magnétique Y-7', typeMateriel: 'APPAREIL', typeEND: 'MT', groupe: 'MT_ELECTRO', site: 'PARIS_DQI', etat: 'DISPONIBLE', fournisseur: 'GE Inspection', modele: 'Y-7' },
    { reference: 'MAT-006', libelle: 'Sabot angulaire 60° UT', typeMateriel: 'ACCESSOIRE', typeEND: 'UT', groupe: 'UT_CONVENTIONNEL', site: 'SAINT_DENIS', etat: 'DISPONIBLE', modele: 'SA-60' },
    { reference: 'MAT-007', libelle: 'OmniScan X3 64:128', typeMateriel: 'APPAREIL', typeEND: 'UT', groupe: 'UT_PHASED_ARRAY', site: 'PARIS_DQI', etat: 'PRETE', fournisseur: 'Olympus', modele: 'OmniScan X3', enPret: true, motifPret: 'Chantier CNPE Chinon' },
    { reference: 'MAT-008', libelle: 'Zetec MIZ-200', typeMateriel: 'APPAREIL', typeEND: 'ET', groupe: 'ET_MULTIFREQUENCE', site: 'LYON_BTN', etat: 'EN_SERVICE', fournisseur: 'Eddyfi', modele: 'MIZ-200' },
    { reference: 'MAT-009', libelle: 'Cale étalon V1', typeMateriel: 'CALIBRE', typeEND: 'UT', groupe: 'UT_CONVENTIONNEL', site: 'PARIS_DQI', etat: 'DISPONIBLE', modele: 'V1 IIW' },
    { reference: 'MAT-010', libelle: 'Kit ressuage fluorescent', typeMateriel: 'CONSOMMABLE', typeEND: 'PT', groupe: 'PT_FLUORESCENT', site: 'CHINON', etat: 'DISPONIBLE', fournisseur: 'Testia', produitsChimiques: true },
  ];

  for (const mat of materiels) {
    await prisma.materiel.upsert({
      where: { reference: mat.reference },
      update: {},
      create: { ...mat, createdById: adminId },
    });
  }

  console.log(`Materiels seeded (${materiels.length})`);
}

async function seedMaquettes(adminId: number) {
  const maquettes = [
    { reference: 'MAQ-001', libelle: 'Maquette tube GV 22mm', typeMaquette: 'TUYAUTERIE', site: 'PARIS_DQI', etat: 'STOCK', composant: 'GV', forme: 'TUBULAIRE', matiere: 'INCONEL', categorie: 'REFERENCE' },
    { reference: 'MAQ-002', libelle: 'Bloc étalon soudure bout à bout', typeMaquette: 'SOUDURE', site: 'PARIS_DQI', etat: 'EMPRUNTEE', composant: 'TUYAUTERIE', forme: 'PLANE', matiere: 'ACIER_CARBONE', categorie: 'ESSAI' },
    { reference: 'MAQ-003', libelle: 'Maquette piquage DN50', typeMaquette: 'TUYAUTERIE', site: 'LYON_BTN', etat: 'STOCK', composant: 'RCP', forme: 'CYLINDRIQUE', matiere: 'ACIER_INOX', categorie: 'QUALIFICATION' },
    { reference: 'MAQ-004', libelle: 'Plaque avec défauts calibrés', typeMaquette: 'MECANIQUE', site: 'LYON_BTN', etat: 'EN_CONTROLE', composant: 'CUVE', forme: 'PLANE', matiere: 'ACIER_CARBONE', categorie: 'REFERENCE' },
    { reference: 'MAQ-005', libelle: 'Maquette coude 90° DN200', typeMaquette: 'TUYAUTERIE', site: 'PARIS_DQI', etat: 'STOCK', composant: 'RCP', forme: 'COMPLEXE', matiere: 'ACIER_INOX', categorie: 'ESSAI' },
  ];

  for (const maq of maquettes) {
    await prisma.maquette.upsert({
      where: { reference: maq.reference },
      update: {},
      create: { ...maq, createdById: adminId },
    });
  }

  console.log(`Maquettes seeded (${maquettes.length})`);
}

async function seedDemandes(adminId: number) {
  const mat1 = await prisma.materiel.findUnique({ where: { reference: 'MAT-001' } });
  const maq1 = await prisma.maquette.findUnique({ where: { reference: 'MAQ-001' } });

  if (mat1 && maq1) {
    const existing = await prisma.demandeEnvoi.findUnique({ where: { numero: 'DE-2026-0001' } });
    if (!existing) {
      await prisma.demandeEnvoi.create({
        data: {
          numero: 'DE-2026-0001',
          type: 'MUTUALISEE',
          demandeurId: adminId,
          destinataire: 'BTN Lyon',
          siteDestinataire: 'LYON_BTN',
          motif: 'Campagne de contrôle UT tubes GV Q2 2026',
          statut: 'BROUILLON',
          urgence: 'NORMALE',
          contact: 'Jean Dupont',
          contactTelephone: '04 72 00 00 00',
          lignes: {
            create: [
              { materielId: mat1.id, quantite: 1 },
              { maquetteId: maq1.id, quantite: 1 },
            ],
          },
        },
      });
    }
  }

  console.log('Demandes seeded');
}

async function main() {
  await seedReferentiels();
  await seedSites();
  await seedEntreprises();
  const admin = await seedRolesAndAgents();
  await seedMateriels(admin.id);
  await seedMaquettes(admin.id);
  await seedDemandes(admin.id);
  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
