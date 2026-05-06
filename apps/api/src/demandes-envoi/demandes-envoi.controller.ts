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
  refuseLigneSchema,
  expedierSchema,
  receptionnerSchema,
  receptionnerRetourSchema,
} from '@ogade/shared';
import { z } from 'zod';
import { DemandesEnvoiService } from './demandes-envoi.service';
import { CurrentUser, RequestUser } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';

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

  @Get('inbox')
  async inbox(
    @CurrentUser() user: RequestUser | null,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!user) {
      throw new BadRequestException('Authenticated user required');
    }
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.demandesEnvoiService.findInbox(user.agentId, {
      ...pagination,
      isAdmin: user.roles.includes('ADMIN'),
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

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) {
      throw new BadRequestException('Authenticated user required');
    }
    return this.demandesEnvoiService.submit(id, user.agentId);
  }

  @Post(':id/lignes/:ligneId/validate')
  @Roles('ADMIN', 'REFERENT_MATERIEL', 'REFERENT_MAQUETTE')
  @HttpCode(HttpStatus.OK)
  async validateLigne(
    @Param('id', ParseIntPipe) id: number,
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) {
      throw new BadRequestException('Authenticated user required');
    }
    return this.demandesEnvoiService.validateLigne(id, ligneId, user);
  }

  @Post(':id/lignes/:ligneId/refuse')
  @Roles('ADMIN', 'REFERENT_MATERIEL', 'REFERENT_MAQUETTE')
  @HttpCode(HttpStatus.OK)
  async refuseLigne(
    @Param('id', ParseIntPipe) id: number,
    @Param('ligneId', ParseIntPipe) ligneId: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) {
      throw new BadRequestException('Authenticated user required');
    }
    const result = refuseLigneSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.demandesEnvoiService.refuseLigne(id, ligneId, result.data.motif, user);
  }

  // ─── Phase 4 : module magasinier ─────────────────────────────

  @Get('magasinier/inbox')
  async magasinierInbox(
    @CurrentUser() user: RequestUser | null,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('statut') statut?: string,
    @Query('typeEnvoi') typeEnvoi?: string,
    @Query('site') site?: string,
    @Query('search') search?: string,
  ) {
    if (!user) throw new BadRequestException('Authenticated user required');
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.demandesEnvoiService.findMagasinierInbox(user, {
      ...pagination,
      statut,
      typeEnvoi,
      site,
      search,
    });
  }

  @Post(':id/preparer-expedition')
  @Roles('ADMIN', 'GESTIONNAIRE_MAGASIN', 'REFERENT_LOGISTIQUE')
  @HttpCode(HttpStatus.OK)
  async prepareForShipping(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) throw new BadRequestException('Authenticated user required');
    return this.demandesEnvoiService.prepareForShipping(id, user);
  }

  @Post(':id/expedier')
  @Roles('ADMIN', 'GESTIONNAIRE_MAGASIN', 'REFERENT_LOGISTIQUE')
  @HttpCode(HttpStatus.OK)
  async expedier(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) throw new BadRequestException('Authenticated user required');
    const result = expedierSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.demandesEnvoiService.expedier(id, result.data, user);
  }

  @Post(':id/receptionner')
  @Roles('ADMIN', 'GESTIONNAIRE_MAGASIN', 'REFERENT_LOGISTIQUE')
  @HttpCode(HttpStatus.OK)
  async receptionner(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) throw new BadRequestException('Authenticated user required');
    const result = receptionnerSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.demandesEnvoiService.receptionner(id, result.data, user);
  }

  @Post(':id/preparer-retour')
  @Roles('ADMIN', 'GESTIONNAIRE_MAGASIN', 'REFERENT_LOGISTIQUE')
  @HttpCode(HttpStatus.OK)
  async prepareReturn(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) throw new BadRequestException('Authenticated user required');
    return this.demandesEnvoiService.prepareReturn(id, user);
  }

  @Post(':id/receptionner-retour')
  @Roles('ADMIN', 'GESTIONNAIRE_MAGASIN', 'REFERENT_LOGISTIQUE')
  @HttpCode(HttpStatus.OK)
  async receptionnerRetour(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) throw new BadRequestException('Authenticated user required');
    const result = receptionnerRetourSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.demandesEnvoiService.receptionnerRetour(id, result.data, user);
  }

  @Post(':id/cloturer')
  @Roles('ADMIN', 'GESTIONNAIRE_MAGASIN', 'REFERENT_LOGISTIQUE')
  @HttpCode(HttpStatus.OK)
  async cloturer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!user) throw new BadRequestException('Authenticated user required');
    return this.demandesEnvoiService.cloturer(id, user);
  }
}
