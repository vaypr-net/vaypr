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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrevoService } from './brevo.service';
import { BrevoDomain } from './entities/brevo.entity';
import { CreateBrevoDomainDto } from './dto/create-brevo-domain.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

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

/**
 * USER DOMAIN MANAGEMENT - With subscription plan limits
 */
@ApiTags('Brevo - User Domains')
@ApiBearerAuth()
@Controller('brevo')
@UseGuards(JwtAuthGuard)
export class BrevoUserController {
  constructor(private readonly brevoService: BrevoService) {}

  /**
   * Create custom domain (with plan limit checking)
   */
  @Post('domains')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom domain (respects plan limit)' })
  @ApiResponse({ status: 201, description: 'Domain created', type: BrevoDomain })
  @ApiResponse({ status: 400, description: 'Plan does not allow domains or limit reached' })
  @ApiResponse({ status: 409, description: 'Domain already exists' })
  async createDomain(
    @Request() req: any,
    @Body() createDto: CreateBrevoDomainDto,
  ): Promise<BrevoDomain> {
    return this.brevoService.createDomainByUser(req.user.userId, createDto);
  }

  /**
   * Get user's domain usage and limits
   */
  @Get('domain-usage')
  @ApiOperation({ summary: 'Get your domain usage and plan limits' })
  @ApiResponse({ status: 200, description: 'Domain usage info' })
  async getDomainUsage(@Request() req: any) {
    return this.brevoService.getUserDomainUsage(req.user.userId);
  }

  /**
   * Get all user's domains
   */
  @Get('domains')
  @ApiOperation({ summary: 'Get all your domains' })
  @ApiResponse({ status: 200, description: 'List of user domains', type: [BrevoDomain] })
  async getUserDomains(@Request() req: any): Promise<BrevoDomain[]> {
    return this.brevoService.getUserDomains(req.user.userId);
  }

  /**
   * Get single user domain
   */
  @Get('domains/:id')
  @ApiOperation({ summary: 'Get a single domain' })
  @ApiResponse({ status: 200, description: 'Domain details', type: BrevoDomain })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async getUserDomain(@Param('id') id: string): Promise<BrevoDomain> {
    return this.brevoService.getDomainById(id);
  }

  /**
   * Delete user's domain
   */
  @Delete('domains/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete your domain' })
  @ApiResponse({ status: 200, description: 'Domain deleted' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async deleteUserDomain(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<{ success: boolean; message: string }> {
    await this.brevoService.deleteUserDomain(req.user.userId, id);
    return { success: true, message: 'Domain deleted successfully' };
  }

  /**
   * Verify user's domain DNS records
   */
  @Post('domains/:id/verify')
  @ApiOperation({ summary: 'Verify DNS records for your domain' })
  @ApiResponse({ status: 200, description: 'Verification completed', type: BrevoDomain })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  @ApiResponse({ status: 400, description: 'DNS verification failed' })
  async verifyUserDomain(@Param('id') id: string): Promise<BrevoDomain> {
    return this.brevoService.verifyDomain(id);
  }
}
