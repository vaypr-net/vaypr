import { Test, TestingModule } from '@nestjs/testing';
import { CorporatePagesController } from './corporate-pages.controller';
import { CorporatePagesService } from './corporate-pages.service';

describe('CorporatePagesController', () => {
  let controller: CorporatePagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporatePagesController],
      providers: [CorporatePagesService],
    }).compile();

    controller = module.get<CorporatePagesController>(CorporatePagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
