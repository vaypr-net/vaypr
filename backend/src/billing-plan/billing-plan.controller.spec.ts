import { Test, TestingModule } from '@nestjs/testing';
import { BillingPlanController } from './billing-plan.controller';
import { BillingPlanService } from './billing-plan.service';

describe('BillingPlanController', () => {
  let controller: BillingPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingPlanController],
      providers: [BillingPlanService],
    }).compile();

    controller = module.get<BillingPlanController>(BillingPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
