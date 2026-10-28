import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('Account routes cannot bypass restricted deletion or ownership', () => {
  let app: INestApplication;
  const member = 'a'.repeat(24),
    other = 'b'.repeat(24),
    admin = 'c'.repeat(24);
  const update = jest.fn(async () => ({}));
  const remove = jest.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            update,
            remove,
            findOne: jest.fn(async () => ({})),
            findAll: jest.fn(async () => []),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: async (token: string) => ({
              sub: token === 'admin' ? admin : member,
            }),
          },
        },
        {
          provide: getConnectionToken(),
          useValue: {
            collection: () => ({
              findOne: async (query: any) => ({
                isSuperAdmin: String(query._id) === admin,
              }),
            }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    update.mockClear();
    remove.mockClear();
  });
  it('removes the old unconfirmed account deletion route even for administrators', async () => {
    await request(app.getHttpServer())
      .delete('/user/' + other)
      .expect(404);
    await request(app.getHttpServer())
      .delete('/user/' + other)
      .auth('admin', { type: 'bearer' })
      .expect(404);
    expect(remove).not.toHaveBeenCalled();
  });
  it('requires authentication to read or change accounts', async () => {
    await request(app.getHttpServer()).get('/user').expect(401);
    await request(app.getHttpServer())
      .get('/user/' + other)
      .expect(401);
    await request(app.getHttpServer())
      .patch('/user/' + other)
      .send({ fullName: 'Denied' })
      .expect(401);
    expect(update).not.toHaveBeenCalled();
  });
  it('prevents members from enumerating or changing other accounts', async () => {
    await request(app.getHttpServer())
      .get('/user')
      .auth('member', { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .get('/user/' + other)
      .auth('member', { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .patch('/user/' + other)
      .auth('member', { type: 'bearer' })
      .send({ fullName: 'Denied' })
      .expect(403);
    expect(update).not.toHaveBeenCalled();
  });
  it('preserves normal own-account updates and super-admin account lookup', async () => {
    await request(app.getHttpServer())
      .patch('/user/' + member)
      .auth('member', { type: 'bearer' })
      .send({ fullName: 'Own name' })
      .expect(200);
    expect(update).toHaveBeenCalledWith(
      member,
      expect.objectContaining({ fullName: 'Own name' }),
    );
    await request(app.getHttpServer())
      .get('/user')
      .auth('admin', { type: 'bearer' })
      .expect(200);
  });
});
