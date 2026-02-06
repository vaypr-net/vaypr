import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LandingPageService } from './landing-page.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';

@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  /**
   * Public endpoint - Get landing page settings
   */
  @Get()
  getSettings() {
    return this.landingPageService.getSettings();
  }

  /**
   * Protected endpoint - Update landing page settings
   */
  @UseGuards(SuperAdminGuard)
  @Patch()
  updateSettings(@Body() updateLandingPageDto: UpdateLandingPageDto) {
    return this.landingPageService.updateSettings(updateLandingPageDto);
  }

  /**
   * Protected endpoint - Update specific section
   */
  @UseGuards(SuperAdminGuard)
  @Patch('section/:section')
  updateSection(
    @Param('section') section: string,
    @Body() data: any,
  ) {
    return this.landingPageService.updateSection(section, data);
  }

  /**
   * Protected endpoint - Reset to default settings
   */
  @UseGuards(SuperAdminGuard)
  @Post('reset')
  resetToDefaults() {
    return this.landingPageService.resetToDefaults();
  }
}

