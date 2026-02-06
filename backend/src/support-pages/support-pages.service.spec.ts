import { Test, TestingModule } from '@nestjs/testing';
import { SupportPagesService } from './support-pages.service';

describe('SupportPagesService', () => {
  let service: SupportPagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportPagesService],
    }).compile();

    service = module.get<SupportPagesService>(SupportPagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
