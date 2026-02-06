import { Test, TestingModule } from '@nestjs/testing';
import { SupportPagesController } from './support-pages.controller';
import { SupportPagesService } from './support-pages.service';

describe('SupportPagesController', () => {
  let controller: SupportPagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportPagesController],
      providers: [SupportPagesService],
    }).compile();

    controller = module.get<SupportPagesController>(SupportPagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
