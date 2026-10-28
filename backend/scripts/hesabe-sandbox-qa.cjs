// Run inside the staging backend container. Never prints JWTs or merchant keys.
const { NestFactory } = require('@nestjs/core');
const { getModelToken } = require('@nestjs/mongoose');
const { JwtService } = require('@nestjs/jwt');
const { AppModule } = require('../dist/src/app.module');

(async () => {
  if (process.env.PAYMENT_PROVIDER !== 'hesabe' || process.env.MONGODB_DB !== 'vaypr_staging') throw new Error('Staging only');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const users = app.get(getModelToken('User'));
    const plans = app.get(getModelToken('BillingPlan'));
    const orders = app.get(getModelToken('HesabeOrder'));
    const ledger = app.get(getModelToken('HesabeSandboxTransaction'));
    const transactions = app.get(getModelToken('Transaction'));
    const yearly = process.argv.includes('--yearly');
    const email = yearly ? 'hesabe.qa.yearly.20261028@example.invalid' : 'hesabe.qa.monthly.20261028@example.invalid';
    let user = await users.findOne({ email });
    const free = await plans.findOne({ price: 0, status: 'active' });
    if (!user && process.argv.includes('--start')) {
      // Synthetic account has no password, email delivery, or third-party login.
      user = await users.create({ fullName: 'Hesabe Sandbox QA', email, planId: free._id, subscriptionStatus: 'free', emailVerified: false });
    }
    if (!user) throw new Error('Start the sandbox QA first');
    const jwt = await app.get(JwtService).signAsync({ sub: String(user._id), email: user.email });
    const call = async (path, method = 'GET', body) => {
      const response = await fetch('http://127.0.0.1:4040/billing/' + path, { method,
        headers: { Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, data: await response.json() };
    };
    if (process.argv.includes('--start')) {
      const plan = await plans.findOne({ price: { $gt: 0 }, currency: 'KWD', status: 'active' }).sort({ price: 1 });
      const result = await call('checkout-session', 'POST', { planId: String(plan._id), billingCycle: yearly ? 'yearly' : 'monthly', currency: 'KWD' });
      if (result.status !== 200) throw new Error('Checkout: ' + JSON.stringify(result.data));
      const order = await orders.findOne({ userId: user._id }).sort({ createdAt: -1 });
      const unpaid = await call('verify-session/' + order.reference);
      if (unpaid.status === 200) throw new Error('Unpaid order was accepted');
      if (await ledger.countDocuments({ hesabeOrderReference: order.reference })) throw new Error('Premature ledger entry');
      console.log(JSON.stringify({ checkoutUrl: result.data.url, reference: order.reference, amount: (order.amountFils / 1000).toFixed(3), currency: order.currency, unpaidAccessBlocked: true }));
    } else {
      const order = await orders.findOne({ userId: user._id }).sort({ createdAt: -1 });
      if (process.argv.includes('--cancelled')) {
        const result = await call('verify-session/' + order.reference);
        const current = await users.findById(user._id);
        if (result.status === 200 || current.subscriptionStatus === 'active' || await ledger.countDocuments({ hesabeOrderReference: order.reference })) throw new Error('Cancelled payment granted access');
        console.log(JSON.stringify({ cancelledAccessBlocked: true, ledgerEntries: 0 }));
      } else {
        const first = await call('verify-session/' + order.reference);
        if (first.status !== 200 || first.data.success !== true) throw new Error('Verification: ' + JSON.stringify(first.data));
        const before = await users.findById(user._id);
        for (let i = 0; i < 2; i++) {
          const webhook = await call('hesabe/webhook', 'POST', { token: order.paymentToken, reference_number: order.reference, status: 'SUCCESSFUL' });
          if (webhook.status !== 200) throw new Error('Webhook replay failed');
          await call('verify-session/' + order.reference);
        }
        const after = await users.findById(user._id);
        const count = await ledger.countDocuments({ transactionId: order.reference });
        const productionCount = await transactions.countDocuments({ transactionId: order.reference });
        if (count !== 1 || productionCount !== 0 || +before.currentPeriodEnd !== +after.currentPeriodEnd) throw new Error('Idempotency or isolation failure');
        const history = await call('history');
        if (!history.data.some(tx => tx.transactionId === order.reference && tx.provider === 'Hesabe Sandbox')) throw new Error('History missing');
        console.log(JSON.stringify({ verified: true, sandboxLedgerEntries: count, revenueLedgerEntries: productionCount, replayIdempotent: true, historyVerified: true, amount: after.subscriptionAmount, environment: after.paymentEnvironment }));
      }
    }
  } finally { await app.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
