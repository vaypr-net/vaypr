import { Controller, Get, UseGuards, Req, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SessionService } from './session.service';
import type { Request } from 'express';
import { Types } from 'mongoose';

@ApiTags('User Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMySessions(@Req() req: Request) {
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    return this.sessionService.getUserSessions(new Types.ObjectId(userId));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(@Req() req: Request, @Param('id') id: string) {
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    await this.sessionService.revokeSession(id, new Types.ObjectId(userId));
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllMySessions(@Req() req: Request) {
    // @ts-ignore
    const userId = req.user.sub || req.user._id;
    await this.sessionService.revokeAllSessions(new Types.ObjectId(userId));
    return;
  }
}
