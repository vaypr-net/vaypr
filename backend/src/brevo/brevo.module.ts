import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BrevoService } from './brevo.service';
import { BrevoController, BrevoUserController } from './brevo.controller';
import { BrevoDomain, BrevoSchema } from './entities/brevo.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { BillingPlan, BillingPlanSchema } from '../billing-plan/entities/billing-plan.entity';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: BrevoDomain.name, schema: BrevoSchema },
      { name: User.name, schema: UserSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        };
      },
    }),
    ActivityModule,
  ],
  controllers: [BrevoController, BrevoUserController],
  providers: [BrevoService, SuperAdminGuard, JwtAuthGuard],
  exports: [BrevoService],
})
export class BrevoModule {}
