import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  async send(@Body() body: { message: string }) {
    return this.chat.chat(body.message ?? '');
  }
}
