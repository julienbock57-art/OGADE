import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createReservationSchema,
  paginationSchema,
  updateReservationSchema,
} from '@ogade/shared';
import { z } from 'zod';
import { CurrentUser, RequestUser } from '../auth/auth.guard';
import { ReservationsService } from './reservations.service';

const conflictsSchema = z
  .object({
    materielId: z.coerce.number().int().positive(),
    dateDebut: z.coerce.date(),
    dateFin: z.coerce.date(),
    excludeId: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => d.dateFin >= d.dateDebut, {
    message: 'dateFin doit être ≥ dateDebut',
    path: ['dateFin'],
  });

const cancelSchema = z.object({
  motif: z.string().optional(),
});

@ApiTags('Réservations')
@ApiBearerAuth()
@Controller('api/v1/reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Get('stats')
  async stats(@CurrentUser() user: RequestUser | null) {
    return this.service.stats(user?.agentId);
  }

  @Get('conflicts')
  async conflicts(
    @Query('materielId') materielId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    const result = conflictsSchema.safeParse({
      materielId,
      dateDebut,
      dateFin,
      excludeId,
    });
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.service.checkConflicts(result.data);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('statut') statut?: string,
    @Query('type') type?: string,
    @Query('materielId') materielId?: string,
    @Query('demandeurId') demandeurId?: string,
    @Query('period') period?: string,
    @Query('search') search?: string,
    @Query('dateMin') dateMin?: string,
    @Query('dateMax') dateMax?: string,
  ) {
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.service.findAll({
      ...pagination,
      statut: statut || undefined,
      type: type || undefined,
      materielId: materielId ? parseInt(materielId, 10) : undefined,
      demandeurId: demandeurId ? parseInt(demandeurId, 10) : undefined,
      period:
        period === 'actuelles' ||
        period === 'venir' ||
        period === 'passees'
          ? period
          : undefined,
      search: search || undefined,
      dateMin: dateMin ? new Date(dateMin) : undefined,
      dateMax: dateMax ? new Date(dateMax) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    const result = createReservationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    if (!user?.agentId) {
      throw new BadRequestException(
        'Authentification requise pour créer une réservation',
      );
    }
    return this.service.create(result.data, user.agentId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const result = updateReservationSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.service.update(id, result.data);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    const result = cancelSchema.safeParse(body ?? {});
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    if (!user?.agentId) {
      throw new BadRequestException(
        'Authentification requise pour annuler une réservation',
      );
    }
    return this.service.cancel(id, user.agentId, result.data.motif);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
