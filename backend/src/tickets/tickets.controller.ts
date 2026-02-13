import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

/**
 * Tickets Controller
 *
 * BASE: /super-admin/tickets
 * PROTECTED: SuperAdmin only
 */
@Controller('super-admin/tickets')
@UseGuards(SuperAdminGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.ticketsService.findAll(
      search,
      status,
      priority,
      category,
      limit,
      offset,
    );
  }

  @Get('stats')
  getStats() {
    return this.ticketsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
    },
  ) {
    return this.ticketsService.updateStatus(id, body.status);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() body: { message: string; author: string },
  ) {
    return this.ticketsService.addMessage(id, body.message, body.author);
  }

  @Post(':id/internal-notes')
  addInternalNote(
    @Param('id') id: string,
    @Body() body: { note: string; author: string },
  ) {
    return this.ticketsService.addInternalNote(id, body.note, body.author);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
