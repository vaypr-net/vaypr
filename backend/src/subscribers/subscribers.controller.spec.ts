import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';

describe('Subscriber management authorization and validation', () => {
  let app: INestApplication;
  const manage = jest.fn(async () => ({ _id: 'a'.repeat(24) }));
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SubscribersController],
      providers: [
        { provide: SubscribersService, useValue: { manage } },
        { provide: JwtService, useValue: { verifyAsync: async (token: string) => ({
          sub: 'b'.repeat(24), email: 'admin@example.invalid', isSuperAdmin: token === 'admin',
        }) } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => manage.mockClear());
  const url = '/super-admin/subscribers/' + 'a'.repeat(24) + '/management';
  it('rejects anonymous and non-admin requests before changing subscribers', async () => {
    await request(app.getHttpServer()).patch(url).send({ action: 'archive', reason: 'Test account' }).expect(401);
    await request(app.getHttpServer()).patch(url).auth('member', { type: 'bearer' }).send({ action: 'archive', reason: 'Test account' }).expect(403);
    expect(manage).not.toHaveBeenCalled();
  });
  it('rejects malformed actions, reasons and payment fields', async () => {
    for (const body of [{ action: 'delete', reason: 'Not implemented' }, { action: 'archive', reason: '' },
      { action: 'archive', reason: 'Valid reason', refund: true }, { action: 'end_paid_access', reason: 'Test', mode: 'refund' }]) {
      await request(app.getHttpServer()).patch(url).auth('admin', { type: 'bearer' }).send({ expectedUpdatedAt: '2026-10-28T12:00:00.000Z', ...body }).expect(400);
    }
    expect(manage).not.toHaveBeenCalled();
  });
  it('uses the authenticated administrator identity for the audit', async () => {
    const body = { action: 'end_paid_access', mode: 'period_end', reason: 'Finish current term', expectedUpdatedAt: '2026-10-28T12:00:00.000Z' };
    await request(app.getHttpServer()).patch(url).auth('admin', { type: 'bearer' }).send(body).expect(200);
    expect(manage).toHaveBeenCalledWith('a'.repeat(24), body,
      expect.objectContaining({ userId: 'b'.repeat(24), email: 'admin@example.invalid' }));
  });
});
