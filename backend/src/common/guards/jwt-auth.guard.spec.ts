import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

const id = 'a'.repeat(24);
describe('Current account authentication', () => {
  function harness(
    payload: any = { sub: id, isSuperAdmin: true },
    account: any = { isSuperAdmin: true },
  ) {
    const findOne = jest.fn(async () => account);
    const jwt: any = { verifyAsync: jest.fn(async () => payload) };
    const db: any = { collection: jest.fn(() => ({ findOne })) };
    const request: any = { headers: { authorization: 'Bearer test-token' } };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => request }),
    };
    return { jwt, db, request, context, findOne };
  }
  it('rejects an unexpired token when its account was permanently deleted', async () => {
    const h = harness(undefined, null);
    await expect(
      new JwtAuthGuard(h.jwt, h.db).canActivate(h.context),
    ).rejects.toThrow('Invalid token');
    expect(h.request.user).toBeUndefined();
  });
  it('uses the database role instead of an old super-admin claim', async () => {
    const h = harness(undefined, { isSuperAdmin: false });
    await expect(
      new SuperAdminGuard(h.jwt, h.db).canActivate(h.context),
    ).rejects.toThrow('Super admin access required');
    expect(h.request.user.isSuperAdmin).toBe(false);
  });
  it.each(['subscriber_deletion_preview', '2fa_pending'])(
    'rejects a %s token as a login token',
    async (type) => {
      const h = harness({ sub: id, type });
      await expect(
        new JwtAuthGuard(h.jwt, h.db).canActivate(h.context),
      ).rejects.toThrow('Invalid token');
      expect(h.findOne).not.toHaveBeenCalled();
    },
  );
  it('allows a current account and maps its verified identity', async () => {
    const h = harness();
    await expect(
      new SuperAdminGuard(h.jwt, h.db).canActivate(h.context),
    ).resolves.toBe(true);
    expect(h.request.user).toMatchObject({ userId: id, isSuperAdmin: true });
  });
});
