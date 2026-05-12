import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { paginationSchema } from '@ogade/shared';
import { CurrentUser, RequestUser } from '../auth/auth.guard';
import { NotificationsService } from './notifications.service';

const preferencesSchema = z.object({
  items: z.array(
    z.object({
      notifType: z.string().min(1),
      inApp: z.boolean(),
      email: z.boolean().optional(),
    }),
  ),
});

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser | null,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('unread') unread?: string,
  ) {
    if (!user) throw new UnauthorizedException();
    const pagination = paginationSchema.parse({ page, pageSize });
    return this.svc.list(user.agentId, {
      ...pagination,
      unread: unread === 'true' || unread === '1',
    });
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: RequestUser | null) {
    if (!user) throw new UnauthorizedException();
    const count = await this.svc.unreadCount(user.agentId);
    return { count };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @CurrentUser() user: RequestUser | null,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!user) throw new UnauthorizedException();
    await this.svc.markRead(user.agentId, id);
    return { ok: true };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser() user: RequestUser | null) {
    if (!user) throw new UnauthorizedException();
    await this.svc.markAllRead(user.agentId);
    return { ok: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: RequestUser | null,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (!user) throw new UnauthorizedException();
    await this.svc.remove(user.agentId, id);
  }

  @Get('preferences')
  async getPrefs(@CurrentUser() user: RequestUser | null) {
    if (!user) throw new UnauthorizedException();
    return this.svc.getPreferences(user.agentId);
  }

  @Put('preferences')
  async putPrefs(
    @CurrentUser() user: RequestUser | null,
    @Body() body: unknown,
  ) {
    if (!user) throw new UnauthorizedException();
    const parsed = preferencesSchema.parse(body);
    return this.svc.updatePreferences(user.agentId, parsed.items);
  }
}
