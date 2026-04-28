import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvenementsService } from '../evenements/evenements.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

@Injectable()
export class FichiersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evenements: EvenementsService,
  ) {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

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
    const filePath = path.join(UPLOADS_DIR, blobKey);

    fs.writeFileSync(filePath, file.buffer);

    const fichier = await this.prisma.fichier.create({
      data: {
        entityType,
        entityId,
        blobKey,
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
    const fichier = await this.prisma.fichier.findUnique({ where: { id } });
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
      include: { uploadedBy: { select: { id: true, nom: true, prenom: true } } },
    });
  }

  getFilePath(blobKey: string): string {
    const filePath = path.join(UPLOADS_DIR, blobKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Physical file not found');
    }
    return filePath;
  }

  async remove(id: number, userId?: number) {
    const fichier = await this.findOne(id);
    const filePath = path.join(UPLOADS_DIR, fichier.blobKey);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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
