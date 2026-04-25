import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EntreprisesService } from './entreprises.service';

@ApiTags('Entreprises')
@Controller('api/v1/entreprises')
export class EntreprisesController {
  constructor(private readonly service: EntreprisesService) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    return this.service.findAll(type);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    if (!body.code || !body.label) {
      throw new BadRequestException('code and label are required');
    }
    return this.service.create(body);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }
}
