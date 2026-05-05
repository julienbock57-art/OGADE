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
  createAgentSchema,
  updateAgentSchema,
  assignRoleSchema,
  paginationSchema,
} from '@ogade/shared';
import { AgentsService } from './agents.service';
import { CurrentUser, RequestUser } from '../auth/auth.guard';
import { LocalAuthService } from '../auth/local-auth.service';

@ApiTags('Agents')
@ApiBearerAuth()
@Controller('api/v1/agents')
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly localAuth: LocalAuthService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.agentsService.findAll(pagination);
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser | null) {
    if (!user) {
      return null;
    }
    return this.agentsService.findOne(user.agentId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    const result = createAgentSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.agentsService.create(result.data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const result = updateAgentSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.agentsService.update(id, result.data);
  }

  @Post(':id/roles')
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser | null,
  ) {
    const result = assignRoleSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return this.agentsService.assignRole(id, result.data.roleCode, user?.agentId);
  }

  @Delete(':id/roles/:roleCode')
  async removeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleCode') roleCode: string,
  ) {
    return this.agentsService.removeRole(id, roleCode);
  }

  @Patch(':id/password')
  async setPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { password: string },
  ) {
    if (!body.password || body.password.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères');
    }
    const hash = await this.localAuth.hashPassword(body.password);
    return this.agentsService.update(id, { passwordHash: hash });
  }

  @Delete(':id/password')
  async removePassword(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.update(id, { passwordHash: null });
  }

  @Get(':id/magasinier-sites')
  async listMagasinierSites(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.listMagasinierSites(id);
  }

  @Post(':id/magasinier-sites')
  async addMagasinierSite(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { siteCode?: string },
  ) {
    if (!body?.siteCode || typeof body.siteCode !== 'string') {
      throw new BadRequestException('siteCode requis');
    }
    return this.agentsService.addMagasinierSite(id, body.siteCode);
  }

  @Delete(':id/magasinier-sites/:siteCode')
  async removeMagasinierSite(
    @Param('id', ParseIntPipe) id: number,
    @Param('siteCode') siteCode: string,
  ) {
    return this.agentsService.removeMagasinierSite(id, siteCode);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.agentsService.remove(id);
  }
}
