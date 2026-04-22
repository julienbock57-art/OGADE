import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { FichiersService } from './fichiers.service';
import { CurrentUser, RequestUser } from '../auth/auth.guard';

@ApiTags('Fichiers')
@ApiBearerAuth()
@Controller('api/v1/fichiers')
export class FichiersController {
  constructor(private readonly fichiersService: FichiersService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @Body('typeFichier') typeFichier: string | undefined,
    @CurrentUser() user: RequestUser | null,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!entityType || !entityId) {
      throw new BadRequestException('entityType and entityId are required');
    }

    const parsedEntityId = parseInt(entityId, 10);
    if (isNaN(parsedEntityId)) {
      throw new BadRequestException('entityId must be a number');
    }

    return this.fichiersService.upload(
      file,
      entityType,
      parsedEntityId,
      user?.agentId,
      typeFichier,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fichiersService.findOne(id);
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const fichier = await this.fichiersService.findOne(id);
    const filePath = this.fichiersService.getFilePath(fichier.blobKey);

    res.set({
      'Content-Type': fichier.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fichier.nomOriginal || fichier.blobKey}"`,
    });

    res.sendFile(filePath);
  }

  @Get('entity/:entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.fichiersService.findByEntity(entityType, entityId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.fichiersService.remove(id);
  }
}
