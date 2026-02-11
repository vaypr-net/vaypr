import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminReportsService } from './super-admin-reports.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('super-admin/reports')
@UseGuards(SuperAdminGuard)
export class SuperAdminReportsController {
  constructor(private readonly superAdminReportsService: SuperAdminReportsService) {}

  @Get('analytics')
  getAnalytics() {
    return this.superAdminReportsService.getAnalytics();
  }
}
