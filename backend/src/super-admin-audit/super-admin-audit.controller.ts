import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminAuditService } from './super-admin-audit.service';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('super-admin/audit-logs')
@UseGuards(SuperAdminGuard)
export class SuperAdminAuditController {
  constructor(private readonly superAdminAuditService: SuperAdminAuditService) {}

  @Get()
  getAuditLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.superAdminAuditService.getAuditLogs(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
