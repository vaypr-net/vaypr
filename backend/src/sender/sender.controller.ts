import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SenderService } from './sender.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateSenderDto, UpdateSenderDto, SenderResponseDto } from './dto/sender.dto';

@Controller('senders')
@UseGuards(JwtAuthGuard)
export class SenderController {
  constructor(private readonly senderService: SenderService) {}

  /**
   * List all active senders for authenticated user
   */
  @Get()
  async listSenders(@Request() req): Promise<SenderResponseDto[]> {
    return this.senderService.listUserSenders(req.user.userId);
  }

  /**
   * Get all senders (including inactive)
   */
  @Get('all')
  async getAllSenders(@Request() req): Promise<SenderResponseDto[]> {
    return this.senderService.getAllUserSenders(req.user.userId);
  }

  /**
   * Create a new sender
   */
  @Post()
  async createSender(
    @Request() req,
    @Body() createSenderDto: CreateSenderDto,
  ): Promise<SenderResponseDto> {
    return this.senderService.createSender(req.user.userId, createSenderDto);
  }

  /**
   * Update sender details
   */
  @Patch(':id')
  async updateSender(
    @Request() req,
    @Param('id') senderId: string,
    @Body() updateSenderDto: UpdateSenderDto,
  ): Promise<SenderResponseDto> {
    return this.senderService.updateSender(req.user.userId, senderId, updateSenderDto);
  }

  /**
   * Set sender as primary
   */
  @Post(':id/set-primary')
  @HttpCode(HttpStatus.OK)
  async setPrimary(
    @Request() req,
    @Param('id') senderId: string,
  ): Promise<SenderResponseDto> {
    return this.senderService.setPrimary(req.user.userId, senderId);
  }

  /**
   * Set sender as secondary
   */
  @Post(':id/set-secondary')
  @HttpCode(HttpStatus.OK)
  async setSecondary(
    @Request() req,
    @Param('id') senderId: string,
  ): Promise<SenderResponseDto> {
    return this.senderService.setSecondary(req.user.userId, senderId);
  }

  /**
   * Deactivate (soft delete) a sender
   */
  @Delete(':id')
  async deactivateSender(
    @Request() req,
    @Param('id') senderId: string,
  ): Promise<SenderResponseDto> {
    return this.senderService.deactivateSender(req.user.userId, senderId);
  }
}
