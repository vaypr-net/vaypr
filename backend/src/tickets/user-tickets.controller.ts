import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateMyTicketDto } from './dto/create-my-ticket.dto';
import { UpdateMyTicketDto } from './dto/update-my-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class UserTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Request() req, @Body() createTicketDto: CreateMyTicketDto) {
    if (req.user?.isSuperAdmin) {
      throw new ForbiddenException(
        'Super admin cannot create tickets. Tickets must be created by users.',
      );
    }
    return this.ticketsService.createForCustomer(
      req.user.userId,
      req.user.email,
      createTicketDto,
    );
  }

  @Get()
  findMyTickets(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.ticketsService.findAllForCustomer(
      req.user.userId,
      search,
      status,
      priority,
      category,
      limit,
      offset,
    );
  }

  @Get('stats')
  getMyStats(@Request() req) {
    return this.ticketsService.getCustomerStats(req.user.userId);
  }

  @Get(':id')
  findMyTicket(@Request() req, @Param('id') id: string) {
    return this.ticketsService.findOneForCustomer(id, req.user.userId);
  }

  @Patch(':id')
  updateMyTicket(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMyTicketDto: UpdateMyTicketDto,
  ) {
    return this.ticketsService.updateForCustomer(
      id,
      req.user.userId,
      updateMyTicketDto,
    );
  }

  @Post(':id/messages')
  addMyMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return this.ticketsService.addMessageForCustomer(
      id,
      req.user.userId,
      body.message,
    );
  }

  @Post(':id/internal-notes')
  addMyInternalNote(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { note: string },
  ) {
    return this.ticketsService.addInternalNoteForCustomer(
      id,
      req.user.userId,
      body.note,
    );
  }
}
