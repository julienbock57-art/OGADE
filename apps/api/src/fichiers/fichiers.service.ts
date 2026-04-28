import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvenementsService } from '../evenements/evenements.service';
import { randomUUID } from 'crypto';

@Injectable()
export class FichiersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evenements: EvenementsService,
  ) {}

  async upload(
    file: Express.Multer.File,
    entityType: string,
    entityId: number,
    uploadedById?: number,
    typeFichier?: string,
    context?: string,
    demandeEnvoiId?: number,
  ) {
    const blobKey = `${randomUUID()}-${file.originalname}`;

    const fichier = await this.prisma.fichier.create({
      data: {
        entityType,
        entityId,
        blobKey,
        blobData: Buffer.from(file.buffer),
        nomOriginal: file.originalname,
        mimeType: file.mimetype,
        tailleOctets: file.size,
        typeFichier: typeFichier ?? null,
        context: context ?? null,
        demandeEnvoiId: demandeEnvoiId ?? null,
        uploadedById: uploadedById ?? null,
      },
    });

    const isPhoto = typeFichier === 'PHOTO';
    await this.evenements.create({
      entityType,
      entityId,
      eventType: isPhoto ? 'PHOTO_ADDED' : 'FILE_ADDED',
      payload: {
        fichierNom: file.originalname,
        fichierType: typeFichier ?? null,
        fichierContext: context ?? null,
        fichierTaille: file.size,
        summary: isPhoto
          ? `Photo ajoutée : ${file.originalname}${context ? ` (${context})` : ''}`
          : `Fichier ajouté : ${file.originalname}`,
      },
      acteurId: uploadedById,
    });

    return fichier;
  }

  async findOne(id: number) {
    const fichier = await this.prisma.fichier.findUnique({
      where: { id },
      select: {
        id: true,
        entityType: true,
        entityId: true,
        blobKey: true,
        nomOriginal: true,
        mimeType: true,
        tailleOctets: true,
        typeFichier: true,
        context: true,
        demandeEnvoiId: true,
        uploadedById: true,
        uploadedAt: true,
      },
    });
    if (!fichier) {
      throw new NotFoundException(`Fichier #${id} not found`);
    }
    return fichier;
  }

  async findByEntity(entityType: string, entityId: number, typeFichier?: string) {
    const where: any = { entityType, entityId };
    if (typeFichier) where.typeFichier = typeFichier;
    return this.prisma.fichier.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        entityType: true,
        entityId: true,
        blobKey: true,
        nomOriginal: true,
        mimeType: true,
        tailleOctets: true,
        typeFichier: true,
        context: true,
        demandeEnvoiId: true,
        uploadedById: true,
        uploadedAt: true,
        uploadedBy: { select: { id: true, nom: true, prenom: true } },
      },
    });
  }

  async getFileData(id: number): Promise<{ data: Buffer; mimeType: string; nomOriginal: string }> {
    const fichier = await this.prisma.fichier.findUnique({
      where: { id },
      select: { blobData: true, mimeType: true, nomOriginal: true, blobKey: true },
    });
    if (!fichier) {
      throw new NotFoundException(`Fichier #${id} not found`);
    }
    if (!fichier.blobData) {
      throw new NotFoundException('File data not found in database');
    }
    return {
      data: Buffer.from(fichier.blobData),
      mimeType: fichier.mimeType || 'application/octet-stream',
      nomOriginal: fichier.nomOriginal || fichier.blobKey,
    };
  }

  async remove(id: number, userId?: number) {
    const fichier = await this.findOne(id);

    await this.prisma.fichier.delete({ where: { id } });

    const isPhoto = fichier.typeFichier === 'PHOTO';
    await this.evenements.create({
      entityType: fichier.entityType,
      entityId: fichier.entityId,
      eventType: isPhoto ? 'PHOTO_DELETED' : 'FILE_DELETED',
      payload: {
        fichierNom: fichier.nomOriginal,
        fichierType: fichier.typeFichier,
        fichierContext: fichier.context,
        summary: isPhoto
          ? `Photo supprimée : ${fichier.nomOriginal}${fichier.context ? ` (${fichier.context})` : ''}`
          : `Fichier supprimé : ${fichier.nomOriginal}`,
      },
      acteurId: userId,
    });
  }
}
