import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminOverviewService } from './super-admin-overview.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('super-admin/overview')
@UseGuards(SuperAdminGuard)
export class SuperAdminOverviewController {
  constructor(private readonly superAdminOverviewService: SuperAdminOverviewService) {}

  @Get('stats')
  getStats() {
    return this.superAdminOverviewService.getStats();
  }
}
