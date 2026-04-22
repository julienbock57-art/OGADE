import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

@Injectable()
export class FichiersService {
  constructor(private readonly prisma: PrismaService) {
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
  ) {
    const blobKey = `${randomUUID()}-${file.originalname}`;
    const filePath = path.join(UPLOADS_DIR, blobKey);

    fs.writeFileSync(filePath, file.buffer);

    return this.prisma.fichier.create({
      data: {
        entityType,
        entityId,
        blobKey,
        nomOriginal: file.originalname,
        mimeType: file.mimetype,
        tailleOctets: file.size,
        typeFichier: typeFichier ?? null,
        uploadedById: uploadedById ?? null,
      },
    });
  }

  async findOne(id: number) {
    const fichier = await this.prisma.fichier.findUnique({ where: { id } });
    if (!fichier) {
      throw new NotFoundException(`Fichier #${id} not found`);
    }
    return fichier;
  }

  async findByEntity(entityType: string, entityId: number) {
    return this.prisma.fichier.findMany({
      where: { entityType, entityId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  getFilePath(blobKey: string): string {
    const filePath = path.join(UPLOADS_DIR, blobKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Physical file not found');
    }
    return filePath;
  }

  async remove(id: number) {
    const fichier = await this.findOne(id);
    const filePath = path.join(UPLOADS_DIR, fichier.blobKey);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.fichier.delete({ where: { id } });
  }
}
