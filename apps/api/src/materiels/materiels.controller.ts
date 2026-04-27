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
  createMaterielSchema,
  updateMaterielSchema,
  paginationSchema,
} from '@ogade/shared';
import { MaterielsService } from './materiels.service';
import { CurrentUser, RequestUser } from '../auth/auth.guard';

@ApiTags('Materiels')
@ApiBearerAuth()
@Controller('api/v1/materiels')
export class MaterielsController {
  constructor(private readonly materielsService: MaterielsService) {}

  @Get('stats')
  async stats() {
    return this.materielsService.stats();
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('etat') etat?: string,
    @Query('site') site?: string,
    @Query('typeEND') typeEND?: string,
    @Query('typeMateriel') typeMateriel?: string,
    @Query('groupe') groupe?: string,
    @Query('search') search?: string,
    @Query('completude') completude?: string,
    @Query('enPret') enPret?: string,
  ) {
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.materielsService.findAll({
      ...pagination,
      etat, site, typeEND, typeMateriel, groupe, search, completude, enPret,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materielsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any, @CurrentUser() user: RequestUser | null) {
    const result = createMaterielSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.materielsService.create(result.data, user?.agentId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    const result = updateMaterielSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.materielsService.update(id, result.data, user?.agentId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.materielsService.softDelete(id);
  }
}
