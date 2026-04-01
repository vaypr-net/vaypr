import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.entity';
import { UserProfile, UserProfileSchema } from '../userprofile/entities/userprofile.entity';
import { Session, SessionSchema } from './entities/session.entity';
import { SessionService } from './session.service';
import { BrevoModule } from '../brevo/brevo.module';
import { ActivityModule } from '../activity/activity.module';
import { SessionController } from './session.controller';
import { BillingPlan, BillingPlanSchema } from '../billing-plan/entities/billing-plan.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: Session.name, schema: SessionSchema },
      { name: BillingPlan.name, schema: BillingPlanSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    BrevoModule,
    ActivityModule,
  ],
  controllers: [
    UserController,
    SessionController,
  ],
  providers: [
    UserService,
    SessionService,
  ],
  exports: [
    UserService,
    SessionService,
  ],
})
export class UserModule {}
