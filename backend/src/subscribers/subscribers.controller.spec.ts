import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { SubscriberDeletionService } from './subscriber-deletion.service';

describe('Subscriber management authorization and validation', () => {
  let app: INestApplication;
  const manage = jest.fn(async () => ({ _id: 'a'.repeat(24) }));
  const permanentlyDelete = jest.fn(async () => ({ subscriberId: 'a'.repeat(24) }));
  const preview = jest.fn(async () => ({ canDelete: false }));
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SubscribersController],
      providers: [
        { provide: SubscribersService, useValue: { manage } },
        { provide: SubscriberDeletionService, useValue: { delete: permanentlyDelete, preview, history: jest.fn(async () => []) } },
        { provide: getConnectionToken(), useValue: { collection: () => ({ findOne: async (query: any) => ({ isSuperAdmin: String(query._id) === 'b'.repeat(24) }) }) } },
        { provide: JwtService, useValue: { verifyAsync: async (token: string) => ({
          sub: (token === 'admin' ? 'b' : 'c').repeat(24), email: 'admin@example.invalid', isSuperAdmin: token === 'admin',
        }) } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => { manage.mockClear(); permanentlyDelete.mockClear(); preview.mockClear(); });
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
  const deletionUrl = '/super-admin/subscribers/' + 'a'.repeat(24);
  const deletionBody = { previewToken: 'review-token', confirmEmail: 'qa@example.invalid', confirmation: 'DELETE',
    acknowledgeIrreversible: true, acknowledgeRetention: true, reason: 'Explicit deletion request' };
  it('restricts permanent deletion and its preview to super-admins', async () => {
    for (const token of [undefined, 'member']) {
      const deletion = request(app.getHttpServer()).delete(deletionUrl);
      if (token) deletion.auth(token, { type: 'bearer' });
      await deletion.send(deletionBody).expect(token ? 403 : 401);
      const inspection = request(app.getHttpServer()).get(deletionUrl + '/deletion-preview');
      if (token) inspection.auth(token, { type: 'bearer' });
      await inspection.expect(token ? 403 : 401);
    }
    expect(permanentlyDelete).not.toHaveBeenCalled();
    expect(preview).not.toHaveBeenCalled();
  });
  it('requires every deletion acknowledgement and rejects refund/payment fields', async () => {
    for (const change of [{ confirmation: 'delete' }, { acknowledgeIrreversible: false }, { acknowledgeRetention: false },
      { confirmEmail: 'invalid' }, { reason: ' ' }, { previewToken: '' }, { refund: true }]) {
      await request(app.getHttpServer()).delete(deletionUrl).auth('admin', { type: 'bearer' }).send({ ...deletionBody, ...change }).expect(400);
    }
    expect(permanentlyDelete).not.toHaveBeenCalled();
  });
  it('passes the explicit deletion confirmation and authenticated actor to the service', async () => {
    await request(app.getHttpServer()).delete(deletionUrl).auth('admin', { type: 'bearer' }).send(deletionBody).expect(200);
    expect(permanentlyDelete).toHaveBeenCalledWith('a'.repeat(24), deletionBody, expect.objectContaining({ userId: 'b'.repeat(24) }));
  });
});
