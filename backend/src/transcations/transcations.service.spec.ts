import { Test, TestingModule } from '@nestjs/testing';
import { TranscationsService } from './transcations.service';

describe('TranscationsService', () => {
  let service: TranscationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TranscationsService],
    }).compile();

    service = module.get<TranscationsService>(TranscationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
