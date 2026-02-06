import { Test, TestingModule } from '@nestjs/testing';
import { TranscationsController } from './transcations.controller';
import { TranscationsService } from './transcations.service';

describe('TranscationsController', () => {
  let controller: TranscationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscationsController],
      providers: [TranscationsService],
    }).compile();

    controller = module.get<TranscationsController>(TranscationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
