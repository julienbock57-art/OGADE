import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Roles ---
  const roles = [
    { code: 'MAGASINIER', label: 'Magasinier', description: 'Gestion du magasin et des stocks' },
    { code: 'REFERENT_LOGISTIQUE_DQI', label: 'Referent Logistique DQI', description: 'Referent logistique de la DQI' },
    { code: 'REFERENT_MAQUETTE', label: 'Referent Maquette', description: 'Referent des maquettes' },
    { code: 'ADMIN_MATERIELS', label: 'Administrateur Materiels', description: 'Administrateur des materiels' },
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

  console.log('Roles seeded');

  // --- Test admin agent ---
  const adminAgent = await prisma.agent.upsert({
    where: { email: 'admin@ogade.test' },
    update: { nom: 'Admin', prenom: 'Test' },
    create: {
      email: 'admin@ogade.test',
      nom: 'Admin',
      prenom: 'Test',
      actif: true,
    },
  });

  for (const roleCode of Object.keys(createdRoles)) {
    await prisma.agentRole.upsert({
      where: {
        agentId_roleId: {
          agentId: adminAgent.id,
          roleId: createdRoles[roleCode].id,
        },
      },
      update: {},
      create: {
        agentId: adminAgent.id,
        roleId: createdRoles[roleCode].id,
      },
    });
  }

  console.log('Admin agent seeded');

  // --- Sample materiels ---
  const materiels = [
    { reference: 'MAT-001', libelle: 'Oscilloscope Keysight', typeMateriel: 'Instrument', site: 'Paris', etat: 'DISPONIBLE' as const },
    { reference: 'MAT-002', libelle: 'Multimetre Fluke 87V', typeMateriel: 'Instrument', site: 'Paris', etat: 'EN_SERVICE' as const },
    { reference: 'MAT-003', libelle: 'Analyseur de spectre R&S', typeMateriel: 'Instrument', site: 'Lyon', etat: 'DISPONIBLE' as const },
    { reference: 'MAT-004', libelle: 'Alimentation stabilisee', typeMateriel: 'Equipement', site: 'Lyon', etat: 'EN_REPARATION' as const },
    { reference: 'MAT-005', libelle: 'Generateur de fonctions', typeMateriel: 'Instrument', site: 'Paris', etat: 'DISPONIBLE' as const },
  ];

  for (const mat of materiels) {
    await prisma.materiel.upsert({
      where: { reference: mat.reference },
      update: { libelle: mat.libelle, typeMateriel: mat.typeMateriel, site: mat.site, etat: mat.etat },
      create: { ...mat, createdById: adminAgent.id },
    });
  }

  console.log('Materiels seeded');

  // --- Sample maquettes ---
  const maquettes = [
    { reference: 'MAQ-001', libelle: 'Maquette moteur V8', typeMaquette: 'Mecanique', site: 'Paris', etat: 'STOCK' as const },
    { reference: 'MAQ-002', libelle: 'Maquette carte electronique A', typeMaquette: 'Electronique', site: 'Paris', etat: 'EMPRUNTEE' as const },
    { reference: 'MAQ-003', libelle: 'Maquette train atterrissage', typeMaquette: 'Mecanique', site: 'Lyon', etat: 'STOCK' as const },
    { reference: 'MAQ-004', libelle: 'Maquette radar X-band', typeMaquette: 'Electronique', site: 'Lyon', etat: 'EN_CONTROLE' as const },
    { reference: 'MAQ-005', libelle: 'Maquette structure aile', typeMaquette: 'Structure', site: 'Paris', etat: 'STOCK' as const },
  ];

  for (const maq of maquettes) {
    await prisma.maquette.upsert({
      where: { reference: maq.reference },
      update: { libelle: maq.libelle, typeMaquette: maq.typeMaquette, site: maq.site, etat: maq.etat },
      create: { ...maq, createdById: adminAgent.id },
    });
  }

  console.log('Maquettes seeded');

  // --- Sample demande d'envoi ---
  const mat1 = await prisma.materiel.findUnique({ where: { reference: 'MAT-001' } });
  const maq1 = await prisma.maquette.findUnique({ where: { reference: 'MAQ-001' } });

  if (mat1 && maq1) {
    const existingDemande = await prisma.demandeEnvoi.findUnique({
      where: { numero: 'DE-2026-0001' },
    });

    if (!existingDemande) {
      await prisma.demandeEnvoi.create({
        data: {
          numero: 'DE-2026-0001',
          type: 'MUTUALISEE',
          demandeurId: adminAgent.id,
          destinataire: 'Site Lyon - Batiment B',
          siteDestinataire: 'Lyon',
          motif: 'Besoin pour campagne de tests Q2',
          statut: 'BROUILLON',
          lignes: {
            create: [
              { materielId: mat1.id, quantite: 1 },
              { maquetteId: maq1.id, quantite: 1 },
            ],
          },
        },
      });
    }

    console.log('Demande d\'envoi seeded');
  }

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
