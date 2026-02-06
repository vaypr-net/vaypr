import { Test, TestingModule } from '@nestjs/testing';
import { CorporatePagesService } from './corporate-pages.service';

describe('CorporatePagesService', () => {
  let service: CorporatePagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporatePagesService],
    }).compile();

    service = module.get<CorporatePagesService>(CorporatePagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
