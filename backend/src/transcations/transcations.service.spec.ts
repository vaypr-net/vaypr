import { TranscationsService } from './transcations.service';

describe('Retained financial records', () => {
  it.each(['update', 'remove'])(
    'rejects %s for a deleted subscriber payment without writing to the ledger',
    async (action) => {
      const model: any = {
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
      };
      const service = new TranscationsService(model, {} as any, {} as any);
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({
          _id: 'a'.repeat(24),
          subscriberDeletedAt: new Date(),
        });
      await expect(
        action === 'update'
          ? service.update('a'.repeat(24), { amount: 0 } as any)
          : service.remove('a'.repeat(24)),
      ).rejects.toThrow('read-only');
      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
      expect(model.findOneAndDelete).not.toHaveBeenCalled();
    },
  );
  it('keeps an atomic retention guard if deletion races a normal transaction update', async () => {
    const model: any = {
      findOneAndUpdate: jest.fn(() => ({ lean: jest.fn(async () => null) })),
    };
    const service = new TranscationsService(model, {} as any, {} as any);
    jest.spyOn(service, 'findOne').mockResolvedValue({ _id: 'a'.repeat(24) });
    await expect(
      service.update('a'.repeat(24), { amount: 1 } as any),
    ).rejects.toThrow('not found');
    expect(model.findOneAndUpdate.mock.calls[0][0]).toEqual({
      _id: 'a'.repeat(24),
      subscriberDeletedAt: null,
    });
  });
});
