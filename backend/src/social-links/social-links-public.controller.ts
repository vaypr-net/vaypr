import { Controller, Get } from '@nestjs/common';
import { SocialLinksService } from './social-links.service';

@Controller('social-links')
export class SocialLinksPublicController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Get()
  findPublic() {
    return this.socialLinksService.findPublic();
  }
}
