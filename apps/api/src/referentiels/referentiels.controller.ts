import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReferentielsService } from './referentiels.service';

@ApiTags('Referentiels')
@Controller('api/v1/referentiels')
export class ReferentielsController {
  constructor(private readonly service: ReferentielsService) {}

  @Get('types')
  async listTypes() {
    return this.service.findAllTypes();
  }

  @Get()
  async findByType(@Query('type') type?: string) {
    if (!type) {
      throw new BadRequestException('Query param "type" is required');
    }
    return this.service.findByType(type);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: { type: string; code: string; label: string; position?: number }) {
    if (!body.type || !body.code || !body.label) {
      throw new BadRequestException('type, code, and label are required');
    }
    return this.service.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { label?: string; position?: number; actif?: boolean },
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
