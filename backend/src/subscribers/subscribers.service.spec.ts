import { SubscribersService } from './subscribers.service';

describe('Subscriber list visibility and profile edits', () => {
  function harness() {
    const query: any = { sort: () => query, limit: () => query, skip: () => query,
      select: () => query, populate: () => query, lean: async () => [] };
    const users: any = { countDocuments: jest.fn(async () => 0), find: jest.fn(() => query) };
    const transactions: any = { aggregate: jest.fn(async () => []) };
    const lifecycle: any = { expireDueAccess: jest.fn(), updateWithHistory: jest.fn() };
    const service = new SubscribersService(users, {} as any, {} as any, {} as any, {} as any,
      {} as any, {} as any, transactions, {} as any, lifecycle, {} as any);
    return { service, users, lifecycle };
  }
  it('defaults to active records and provides explicit archived/all filters', async () => {
    const h = harness();
    await h.service.findAll();
    expect(h.users.find).toHaveBeenLastCalledWith({ isSuperAdmin: { $ne: true }, subscriberArchivedAt: null });
    await h.service.findAll(undefined, undefined, undefined, 50, 0, 'archived');
    expect(h.users.find).toHaveBeenLastCalledWith({ isSuperAdmin: { $ne: true }, subscriberArchivedAt: { $ne: null } });
    await h.service.findAll(undefined, undefined, undefined, 50, 0, 'all');
    expect(h.users.find).toHaveBeenLastCalledWith({ isSuperAdmin: { $ne: true } });
  });
  it('rejects invalid visibility filters', async () => {
    await expect(harness().service.findAll(undefined, undefined, undefined, 50, 0, 'unknown')).rejects.toThrow('Invalid visibility');
  });
  it('editing a name never reactivates a canceled subscription', async () => {
    const h = harness();
    const user = { _id: 'a'.repeat(24), subscriptionStatus: 'canceled', planId: { name: 'Free' } };
    h.users.findById = () => ({ populate: async () => user });
    jest.spyOn(h.service, 'findOne').mockResolvedValue({} as any);
    await h.service.update('a'.repeat(24), { name: 'New name' }, { userId: 'b'.repeat(24) });
    expect(h.lifecycle.updateWithHistory.mock.calls[0][1]).toEqual({ fullName: 'New name' });
  });
});
