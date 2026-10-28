// Runs only against a fresh local MongoDB replica set created by this script.
// No production URI or environment file is loaded. See docs/SUBSCRIBER_DELETION.md.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require(
  process.env.VAYPR_MONGODB_MEMORY_SERVER || 'mongodb-memory-server',
);
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { MongooseModule } = require('@nestjs/mongoose');
const { Types } = require('mongoose');
const { JwtService } = require('@nestjs/jwt');
const request = require('supertest');
const {
  SubscribersModule,
} = require('../dist/src/subscribers/subscribers.module');
const {
  SubscriberDeletionService,
  DELETED_SUBSCRIBER_DATA,
  RETAINED_SUBSCRIBER_DATA,
} = require('../dist/src/subscribers/subscriber-deletion.service');
const { JwtAuthGuard } = require('../dist/src/common/guards/jwt-auth.guard');
const { HesabeService } = require('../dist/src/billing/hesabe.service');
const { ConfigService, ConfigModule } = require('@nestjs/config');

(async () => {
  const replica = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  let app;
  try {
    class TestRoot {}
    Module({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: 'local-deletion-integration-only' })],
        }),
        MongooseModule.forRoot(replica.getUri('vaypr_staging')),
        SubscribersModule,
      ],
    })(TestRoot);
    app = await NestFactory.create(TestRoot, {
      logger: false,
      abortOnError: false,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    const db = app.get('DatabaseConnection');
    await Promise.all(Object.values(db.models).map((model) => model.init()));
    const service = app.get(SubscriberDeletionService);
    const jwt = app.get(JwtService);
    const adminId = new Types.ObjectId();
    const actor = {
      userId: String(adminId),
      email: 'deletion.admin@example.invalid',
    };
    await db
      .model('User')
      .collection.insertOne({
        _id: adminId,
        fullName: 'Test Admin',
        email: actor.email,
        isSuperAdmin: true,
      });
    const adminToken = jwt.sign({ sub: actor.userId, isSuperAdmin: true });
    const rows = (name) => db.model(name).collection;
    async function seed(overrides = {}) {
      const id = new Types.ObjectId();
      const user = {
        _id: id,
        fullName: 'Deletion Test',
        email: `deletion.${id}@example.invalid`,
        password: 'test-only-credential',
        googleRefreshToken: 'test-only-refresh-token',
        twoFactorSecret: 'test-only-secret',
        subscriptionStatus: 'free',
        subscriberArchivedAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
      await rows('User').insertOne(user);
      for (const [index, entry] of DELETED_SUBSCRIBER_DATA.entries()) {
        await rows(entry.model).insertOne({
          [entry.field]: index % 2 ? String(id) : id,
          domain: `deletion-${id}.example.invalid`,
          email: `record.${id}@example.invalid`,
          senderEmail: `sender.${id}@example.invalid`,
        });
      }
      for (const entry of RETAINED_SUBSCRIBER_DATA) {
        const common = {
          userId: id,
          subscriberId: String(id),
          subscriberName: user.fullName,
          subscriberEmail: user.email,
          amount: 20,
          currency: 'KWD',
          status: 'succeeded',
          transactionDate: new Date(),
          type: 'subscription',
          provider: 'Hesabe Sandbox',
        };
        await rows(entry.model).insertOne(
          entry.model === 'HesabeOrder'
            ? {
                userId: id,
                reference: `HSB${id}`,
                state: 'failed',
                activeCheckout: false,
                amountFils: 20000,
                currency: 'KWD',
                environment: 'sandbox',
                createdAt: new Date(),
              }
            : {
                ...common,
                transactionId: `TX-${entry.model}-${id}`,
                isSandbox: entry.model === 'HesabeSandboxTransaction',
              },
        );
      }
      return { id: String(id), user };
    }
    const bodyFor = (preview) => ({
      previewToken: preview.previewToken,
      confirmEmail: preview.email,
      confirmation: 'DELETE',
      acknowledgeIrreversible: true,
      acknowledgeRetention: true,
      reason: 'Synthetic integration test deletion',
    });
    const owner = (field, id) => ({
      [field]: { $in: [id, new Types.ObjectId(id)] },
    });
    let passed = 0;
    async function check(name, fn) {
      await fn();
      passed++;
      console.log(`PASS ${name}`);
    }

    await check(
      'deletes all allowlisted account data atomically and preserves every original financial field',
      async () => {
        const fixture = await seed();
        const sentinel = await seed();
        const preview = await service.preview(fixture.id, actor);
        assert.equal(preview.canDelete, true);
        assert.equal(preview.deletedCounts.Account, 1);
        for (const entry of DELETED_SUBSCRIBER_DATA)
          assert.equal(preview.deletedCounts[entry.label], 1);
        const before = {};
        for (const entry of RETAINED_SUBSCRIBER_DATA)
          before[entry.model] = await rows(entry.model).findOne(
            owner('userId', fixture.id),
          );
        await service.delete(fixture.id, bodyFor(preview), actor);
        assert.equal(
          await rows('User').findOne({ _id: fixture.user._id }),
          null,
        );
        for (const entry of DELETED_SUBSCRIBER_DATA) {
          assert.equal(
            await rows(entry.model).countDocuments(
              owner(entry.field, fixture.id),
            ),
            0,
          );
          assert.equal(
            await rows(entry.model).countDocuments(
              owner(entry.field, sentinel.id),
            ),
            1,
          );
        }
        for (const entry of RETAINED_SUBSCRIBER_DATA) {
          const after = await rows(entry.model).findOne(
            owner('userId', fixture.id),
          );
          assert.ok(after.subscriberDeletedAt);
          for (const [key, value] of Object.entries(before[entry.model]))
            assert.deepEqual(after[key], value);
        }
        const audit = await rows('SubscriberDeletion').findOne({
          subscriberId: fixture.id,
        });
        assert.equal(audit.actorEmail, actor.email);
        assert.equal(audit.subscriberEmail, fixture.user.email);
        assert.equal(audit.password, undefined);
        assert.equal(audit.googleRefreshToken, undefined);
        const retained = await service.retainedPayments(fixture.id);
        assert.equal(retained.transactions.length, 2);
        assert.equal(retained.orders.length, 1);
        assert.equal(retained.orders[0].paymentToken, undefined);
        assert.equal(retained.orders[0].redirectData, undefined);
        const guard = new JwtAuthGuard(jwt, db);
        const token = jwt.sign({ sub: fixture.id });
        await assert.rejects(
          guard.canActivate({
            switchToHttp: () => ({
              getRequest: () => ({
                headers: { authorization: `Bearer ${token}` },
              }),
            }),
          }),
          /Invalid token/,
        );
      },
    );
    await check(
      'rolls back earlier removals and the audit when a later collection fails',
      async () => {
        const fixture = await seed();
        const preview = await service.preview(fixture.id, actor);
        const collection = rows('Quote');
        const original = collection.deleteMany;
        collection.deleteMany = async () => {
          throw new Error('Injected cleanup failure');
        };
        try {
          await assert.rejects(
            service.delete(fixture.id, bodyFor(preview), actor),
            /Injected cleanup failure/,
          );
        } finally {
          collection.deleteMany = original;
        }
        assert.ok(await rows('User').findOne({ _id: fixture.user._id }));
        assert.equal(
          await rows('SubscriberDeletion').countDocuments({
            subscriberId: fixture.id,
          }),
          0,
        );
        for (const entry of DELETED_SUBSCRIBER_DATA)
          assert.equal(
            await rows(entry.model).countDocuments(
              owner(entry.field, fixture.id),
            ),
            1,
          );
        for (const entry of RETAINED_SUBSCRIBER_DATA)
          assert.equal(
            (await rows(entry.model).findOne(owner('userId', fixture.id)))
              .subscriberDeletedAt,
            undefined,
          );
      },
    );
    await check(
      'rejects stale record counts and stale user versions without deleting anything',
      async () => {
        for (const change of ['records', 'version']) {
          const fixture = await seed();
          const preview = await service.preview(fixture.id, actor);
          if (change === 'records')
            await rows('Client').insertOne({ userId: fixture.user._id });
          else
            await rows('User').updateOne(
              { _id: fixture.user._id },
              { $set: { updatedAt: new Date(Date.now() + 1000) } },
            );
          await assert.rejects(
            service.delete(fixture.id, bodyFor(preview), actor),
            /changed/,
          );
          assert.ok(await rows('User').findOne({ _id: fixture.user._id }));
        }
      },
    );
    await check(
      'requires an exact email, every acknowledgement and a valid actor-bound preview',
      async () => {
        const fixture = await seed();
        const preview = await service.preview(fixture.id, actor);
        const body = bodyFor(preview);
        for (const change of [
          { confirmEmail: 'wrong@example.invalid' },
          { confirmation: 'delete' },
          { acknowledgeRetention: false },
          { acknowledgeIrreversible: false },
          { reason: ' ' },
          { previewToken: 'forged' },
          {
            previewToken: jwt.sign({
              type: 'subscriber_deletion_preview',
              sub: fixture.id,
              actorId: 'a'.repeat(24),
            }),
          },
          {
            previewToken: jwt.sign(
              {
                type: 'subscriber_deletion_preview',
                sub: fixture.id,
                actorId: actor.userId,
              },
              { expiresIn: -1 },
            ),
          },
        ]) {
          await assert.rejects(
            service.delete(fixture.id, { ...body, ...change }, actor),
          );
        }
        assert.ok(await rows('User').findOne({ _id: fixture.user._id }));
      },
    );
    await check(
      'blocks unarchived, paid, legacy recurring and pending-refund accounts',
      async () => {
        for (const overrides of [
          { subscriberArchivedAt: null },
          { subscriptionStatus: 'active' },
          { stripeSubscriptionId: 'test-reference' },
          { refundStatus: 'processing' },
        ]) {
          const fixture = await seed(overrides);
          assert.equal(
            (await service.preview(fixture.id, actor)).canDelete,
            false,
          );
        }
        await assert.rejects(
          service.preview(actor.userId, actor),
          /Super-admin accounts/,
        );
        const fixture = await seed();
        await assert.rejects(
          service.preview(fixture.id, { userId: fixture.id }),
          /super-admin access/,
        );
      },
    );
    await check(
      'blocks open checkouts and pending ledger entries',
      async () => {
        for (const model of [
          'HesabeOrder',
          'Transaction',
          'HesabeSandboxTransaction',
        ]) {
          const fixture = await seed();
          await rows(model).updateOne(owner('userId', fixture.id), {
            $set:
              model === 'HesabeOrder'
                ? { state: 'pending' }
                : { status: 'pending' },
          });
          assert.equal(
            (await service.preview(fixture.id, actor)).canDelete,
            false,
          );
        }
      },
    );
    await check(
      'works with legacy records lacking a status or a valid plan document',
      async () => {
        const fixture = await seed({ planId: new Types.ObjectId() });
        await rows('User').updateOne(
          { _id: fixture.user._id },
          { $unset: { subscriptionStatus: '' } },
        );
        const preview = await service.preview(fixture.id, actor);
        assert.equal(preview.canDelete, true);
        await service.delete(fixture.id, bodyFor(preview), actor);
        assert.equal(
          await rows('User').countDocuments({ _id: fixture.user._id }),
          0,
        );
      },
    );
    await check(
      'HTTP authorization, literal boolean acknowledgement and confirmation-token isolation',
      async () => {
        const fixture = await seed();
        const url = `/super-admin/subscribers/${fixture.id}`;
        const preview = await service.preview(fixture.id, actor);
        const body = bodyFor(preview);
        await request(app.getHttpServer()).delete(url).send(body).expect(401);
        await request(app.getHttpServer())
          .delete(url)
          .auth(jwt.sign({ sub: fixture.id, isSuperAdmin: true }), {
            type: 'bearer',
          })
          .send(body)
          .expect(403);
        await request(app.getHttpServer())
          .delete(url)
          .auth(adminToken, { type: 'bearer' })
          .send({ ...body, acknowledgeRetention: 'false' })
          .expect(400);
        await request(app.getHttpServer())
          .get(url + '/deletion-preview')
          .auth(preview.previewToken, { type: 'bearer' })
          .expect(401);
        await request(app.getHttpServer())
          .delete(url)
          .auth(adminToken, { type: 'bearer' })
          .send(body)
          .expect(200);
        await request(app.getHttpServer())
          .get('/super-admin/subscribers/deletion-history')
          .auth(adminToken, { type: 'bearer' })
          .expect(200);
      },
    );
    await check(
      'reserves Hesabe checkout with an account write in the same transaction',
      async () => {
        const id = new Types.ObjectId();
        const planId = new Types.ObjectId();
        await rows('User').insertOne({
          _id: id,
          fullName: 'Checkout QA',
          email: `checkout.${id}@example.invalid`,
          subscriptionStatus: 'free',
        });
        await rows('BillingPlan').insertOne({
          _id: planId,
          name: 'QA Business',
          status: 'active',
          currency: 'KWD',
          price: 20,
        });
        const gateway = {
          settings: () => ({
            database: 'vaypr_staging',
            api: 'https://api.example.invalid',
          }),
          baseUrl: 'https://sandbox.example.invalid',
          checkout: async () => ({
            paymentToken: String(new Types.ObjectId()),
            redirectData: 'test-only-redirect',
          }),
        };
        const hesabe = new HesabeService(
          gateway,
          new ConfigService({}),
          db.model('HesabeOrder'),
          db.model('User'),
          db.model('BillingPlan'),
          db.model('HesabeSandboxTransaction'),
          {},
        );
        await hesabe.createCheckoutSession(
          String(id),
          String(planId),
          'monthly',
        );
        const order = await rows('HesabeOrder').findOne({ userId: id });
        assert.equal(order.state, 'pending');
        assert.equal(order.activeCheckout, true);
        assert.equal((await rows('User').findOne({ _id: id })).__v, 1);
        await rows('User').updateOne(
          { _id: id },
          { $set: { subscriberArchivedAt: new Date() } },
        );
        assert.equal(
          (await service.preview(String(id), actor)).canDelete,
          false,
        );
      },
    );
    console.log(
      `${passed} local replica-set integration checks passed; no external database used.`,
    );
  } finally {
    if (app) await app.close();
    await Promise.all(
      require('mongoose').connections.map((connection) =>
        connection.destroy(true).catch(() => {}),
      ),
    );
    await replica.stop();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
