import {
  Controller,
  Get,
  Param,
  Res,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('QR Code')
@ApiBearerAuth()
@Controller('api/v1/qrcode')
export class QrcodeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('materiel/:id')
  async materielQrcode(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const materiel = await this.prisma.materiel.findFirst({
      where: { id, deletedAt: null },
    });
    if (!materiel) {
      throw new NotFoundException(`Materiel #${id} not found`);
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const content = `${apiUrl}/materiels/${id}`;
    const buffer = await QRCode.toBuffer(content, { type: 'png', width: 300 });

    res.set({ 'Content-Type': 'image/png' });
    res.send(buffer);
  }

  @Get('maquette/:id')
  async maquetteQrcode(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const maquette = await this.prisma.maquette.findFirst({
      where: { id, deletedAt: null },
    });
    if (!maquette) {
      throw new NotFoundException(`Maquette #${id} not found`);
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const content = `${apiUrl}/maquettes/${id}`;
    const buffer = await QRCode.toBuffer(content, { type: 'png', width: 300 });

    res.set({ 'Content-Type': 'image/png' });
    res.send(buffer);
  }
}
