import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';
import { User } from '../user/entities/user.entity';
import { SuperAdminSettings } from '../superadmin-settings/entities/superadmin-settings.entity';
import { NotificationPreferencesHelper } from '../userprofile/notification-preferences.helper';
import { EmailNotificationService } from '../userprofile/email-notification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailRouterService } from '../email/email-router.service';
import { ActivityService } from '../activity/activity.service';

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getModelToken(Ticket.name), useValue: {} },
        { provide: getModelToken(User.name), useValue: {} },
        { provide: getModelToken(SuperAdminSettings.name), useValue: {} },
        { provide: NotificationPreferencesHelper, useValue: {} },
        { provide: EmailNotificationService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: EmailRouterService, useValue: {} },
        { provide: ActivityService, useValue: {} },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
