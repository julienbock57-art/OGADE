import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  createDemandeEnvoiSchema,
  updateDemandeEnvoiSchema,
  paginationSchema,
} from '@ogade/shared';
import { z } from 'zod';
import { DemandesEnvoiService } from './demandes-envoi.service';
import { CurrentUser, RequestUser } from '../auth/auth.guard';

const addLigneSchema = z.object({
  materielId: z.number().optional(),
  maquetteId: z.number().optional(),
  quantite: z.number().default(1),
}).refine(
  (l) => (l.materielId !== undefined) !== (l.maquetteId !== undefined),
  'Exactly one of materielId or maquetteId must be set',
);

@ApiTags('Demandes Envoi')
@ApiBearerAuth()
@Controller('api/v1/demandes-envoi')
export class DemandesEnvoiController {
  constructor(private readonly demandesEnvoiService: DemandesEnvoiService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('statut') statut?: string,
    @Query('type') type?: string,
  ) {
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.demandesEnvoiService.findAll({
      ...pagination,
      statut,
      type,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.demandesEnvoiService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    const result = createDemandeEnvoiSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    const demandeurId = user?.agentId;
    if (!demandeurId) {
      throw new BadRequestException('Authenticated user required to create a demande');
    }
    return this.demandesEnvoiService.create(result.data, demandeurId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const result = updateDemandeEnvoiSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.demandesEnvoiService.update(id, result.data);
  }

  @Post(':id/lignes')
  @HttpCode(HttpStatus.CREATED)
  async addLigne(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const result = addLigneSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.demandesEnvoiService.addLigne(id, result.data);
  }

  @Delete(':id/lignes/:ligneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLigne(
    @Param('id', ParseIntPipe) id: number,
    @Param('ligneId', ParseIntPipe) ligneId: number,
  ) {
    await this.demandesEnvoiService.removeLigne(id, ligneId);
  }
}
