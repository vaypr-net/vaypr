import { Test, TestingModule } from '@nestjs/testing';
import { BillingPlanService } from './billing-plan.service';

describe('BillingPlanService', () => {
  let service: BillingPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingPlanService],
    }).compile();

    service = module.get<BillingPlanService>(BillingPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
