import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrevoService } from './brevo.service';
import { BrevoDomain } from './entities/brevo.entity';
import { CreateBrevoDomainDto } from './dto/create-brevo-domain.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@ApiTags('Brevo - Email Authentication')
@ApiBearerAuth()
@Controller('api/superadmin/brevo')
@UseGuards(SuperAdminGuard)
export class BrevoController {
  constructor(private readonly brevoService: BrevoService) {}

  /**
   * Get all domains
   */
  @Get('domains')
  @ApiOperation({ summary: 'Get all Brevo domains' })
  @ApiResponse({ status: 200, description: 'List of all domains', type: [BrevoDomain] })
  async getDomains(): Promise<BrevoDomain[]> {
    return this.brevoService.getAllDomains();
  }

  /**
   * Get single domain by ID
   */
  @Get('domains/:id')
  @ApiOperation({ summary: 'Get a single domain by ID' })
  @ApiResponse({ status: 200, description: 'Domain details', type: BrevoDomain })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async getDomain(@Param('id') id: string): Promise<BrevoDomain> {
    return this.brevoService.getDomainById(id);
  }

  /**
   * Create new domain
   */
  @Post('domains')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new domain and generate DNS records' })
  @ApiResponse({ status: 201, description: 'Domain created', type: BrevoDomain })
  @ApiResponse({ status: 400, description: 'Invalid domain format or validation error' })
  @ApiResponse({ status: 409, description: 'Domain already exists' })
  async createDomain(@Body() createDto: CreateBrevoDomainDto): Promise<BrevoDomain> {
    return this.brevoService.createDomain(createDto);
  }

  /**
   * Verify domain DNS records
   */
  @Post('domains/:id/verify')
  @ApiOperation({ summary: 'Verify DNS records for a domain' })
  @ApiResponse({ status: 200, description: 'Verification completed', type: BrevoDomain })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiResponse({ status: 400, description: 'DNS verification failed' })
  async verifyDomain(@Param('id') id: string): Promise<BrevoDomain> {
    return this.brevoService.verifyDomain(id);
  }

  /**
   * Delete domain
   */
  @Delete('domains/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a domain' })
  @ApiResponse({ status: 200, description: 'Domain deleted' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async deleteDomain(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    await this.brevoService.deleteDomain(id);
    return { success: true, message: 'Domain deleted successfully' };
  }
}
