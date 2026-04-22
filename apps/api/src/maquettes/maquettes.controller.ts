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
  createMaquetteSchema,
  updateMaquetteSchema,
  paginationSchema,
} from '@ogade/shared';
import { z } from 'zod';
import { MaquettesService } from './maquettes.service';
import { CurrentUser, RequestUser } from '../auth/auth.guard';

const empruntBodySchema = z.object({
  emprunteurId: z.number(),
});

@ApiTags('Maquettes')
@ApiBearerAuth()
@Controller('api/v1/maquettes')
export class MaquettesController {
  constructor(private readonly maquettesService: MaquettesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('etat') etat?: string,
    @Query('site') site?: string,
    @Query('typeMaquette') typeMaquette?: string,
    @Query('search') search?: string,
  ) {
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.maquettesService.findAll({
      ...pagination,
      etat,
      site,
      typeMaquette,
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.maquettesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentUser() user: RequestUser | null) {
    const result = createMaquetteSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.maquettesService.create(result.data, user?.agentId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    const result = updateMaquetteSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.maquettesService.update(id, result.data, user?.agentId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.maquettesService.softDelete(id);
  }

  @Post(':id/emprunter')
  async emprunter(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const result = empruntBodySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.maquettesService.emprunter(id, result.data.emprunteurId);
  }

  @Post(':id/retourner')
  async retourner(@Param('id', ParseIntPipe) id: number) {
    return this.maquettesService.retourner(id);
  }
}
