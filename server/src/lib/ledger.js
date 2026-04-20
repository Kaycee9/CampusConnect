import env from '../config/env.js';

const LEDGER_BUCKETS = {
  PLATFORM_ESCROW: 'PLATFORM_ESCROW',
  PLATFORM_REVENUE: 'PLATFORM_REVENUE',
  ARTISAN_PENDING_SETTLEMENT: 'ARTISAN_PENDING_SETTLEMENT',
  ARTISAN_AVAILABLE: 'ARTISAN_AVAILABLE',
  ARTISAN_IN_PAYOUT: 'ARTISAN_IN_PAYOUT',
};

const ledgerCurrency = env.LEDGER_CURRENCY || 'NGN';

const normalizeArtisan = (artisanOrId) => {
  if (!artisanOrId) return { id: null, name: 'Artisan' };

  if (typeof artisanOrId === 'string') {
    return { id: artisanOrId, name: 'Artisan' };
  }

  const id = artisanOrId.id || artisanOrId.artisanId || artisanOrId.userId || null;
  const firstName = artisanOrId.firstName || '';
  const lastName = artisanOrId.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id,
    name: fullName || 'Artisan',
  };
};

const makeArtisanCode = (artisanId, bucket) => `ARTISAN_${artisanId}_${bucket}`;

const makeArtisanName = (artisanName, bucketLabel) => `${artisanName} ${bucketLabel}`.trim();

const makePlatformAccount = (bucket, name) => ({
  code: `${bucket}_${ledgerCurrency}`,
  name,
  type: bucket,
  currency: ledgerCurrency,
  balance: 0,
  artisanId: null,
});

const ensureAccount = async (tx, where, create) => {
  return tx.ledgerAccount.upsert({
    where,
    create,
    update: {
      name: create.name,
      currency: create.currency,
    },
  });
};

export const ensurePlatformLedgerAccounts = async (tx) => {
  const escrowAccount = makePlatformAccount(LEDGER_BUCKETS.PLATFORM_ESCROW, 'Platform Escrow');
  const platformEscrow = await ensureAccount(
    tx,
    { code: escrowAccount.code },
    escrowAccount
  );

  const revenueAccount = makePlatformAccount(LEDGER_BUCKETS.PLATFORM_REVENUE, 'Platform Revenue');
  const platformRevenue = await ensureAccount(
    tx,
    { code: revenueAccount.code },
    revenueAccount
  );

  return { platformEscrow, platformRevenue };
};

export const ensureArtisanLedgerAccounts = async (tx, artisanOrId) => {
  const artisan = normalizeArtisan(artisanOrId);

  if (!artisan.id) {
    throw new Error('Artisan id is required to create ledger accounts');
  }

  const accounts = [
    {
      bucket: LEDGER_BUCKETS.ARTISAN_PENDING_SETTLEMENT,
      label: 'Pending Settlement',
    },
    {
      bucket: LEDGER_BUCKETS.ARTISAN_AVAILABLE,
      label: 'Available',
    },
    {
      bucket: LEDGER_BUCKETS.ARTISAN_IN_PAYOUT,
      label: 'In Payout',
    },
  ];

  const created = [];

  for (const account of accounts) {
    created.push(
      await ensureAccount(
        tx,
        { artisanId_type: { artisanId: artisan.id, type: account.bucket } },
        {
          code: makeArtisanCode(artisan.id, account.bucket),
          name: makeArtisanName(artisan.name, account.label),
          type: account.bucket,
          currency: ledgerCurrency,
          balance: 0,
          artisanId: artisan.id,
        }
      )
    );
  }

  return created;
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const applyLedgerEntry = async (tx, {
  accountId,
  entryType,
  amount,
  sourceType,
  sourceId,
  reference,
  note,
  metadata,
}) => {
  const normalized = roundMoney(amount);
  if (normalized <= 0) {
    throw new Error('Ledger amount must be greater than zero');
  }

  const account = await tx.ledgerAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    throw new Error('Ledger account not found');
  }

  const nextBalance = entryType === 'CREDIT'
    ? roundMoney(account.balance + normalized)
    : roundMoney(account.balance - normalized);

  if (entryType === 'DEBIT' && nextBalance < 0) {
    throw new Error('Insufficient ledger balance');
  }

  await tx.ledgerAccount.update({
    where: { id: account.id },
    data: { balance: nextBalance },
  });

  return tx.ledgerEntry.create({
    data: {
      accountId: account.id,
      entryType,
      amount: normalized,
      currency: account.currency,
      sourceType,
      sourceId: sourceId || null,
      reference: reference || null,
      note: note || null,
      metadata: metadata || undefined,
      balanceAfter: nextBalance,
    },
  });
};

const getArtisanAccounts = async (tx, artisanOrId) => {
  const artisan = normalizeArtisan(artisanOrId);
  await ensureArtisanLedgerAccounts(tx, artisan);

  const rows = await tx.ledgerAccount.findMany({
    where: { artisanId: artisan.id },
  });

  const byType = Object.fromEntries(rows.map((row) => [row.type, row]));

  return {
    pending: byType[LEDGER_BUCKETS.ARTISAN_PENDING_SETTLEMENT],
    available: byType[LEDGER_BUCKETS.ARTISAN_AVAILABLE],
    inPayout: byType[LEDGER_BUCKETS.ARTISAN_IN_PAYOUT],
  };
};

export const getArtisanLedgerSnapshot = async (tx, artisanOrId) => {
  const accounts = await getArtisanAccounts(tx, artisanOrId);

  return {
    pendingSettlement: roundMoney(accounts.pending?.balance || 0),
    availableBalance: roundMoney(accounts.available?.balance || 0),
    inPayoutBalance: roundMoney(accounts.inPayout?.balance || 0),
  };
};

export const postPaymentCaptureLedgerEntries = async (tx, payment) => {
  if (!payment?.id || !payment?.booking?.artisanId) {
    throw new Error('Payment with booking artisan is required for ledger posting');
  }

  const existing = await tx.ledgerEntry.findFirst({
    where: {
      sourceType: 'PAYMENT_CAPTURE',
      sourceId: payment.id,
    },
    select: { id: true },
  });

  if (existing) {
    return { posted: false };
  }

  const { platformEscrow, platformRevenue } = await ensurePlatformLedgerAccounts(tx);
  const artisanAccounts = await getArtisanAccounts(tx, payment.booking.artisanId);

  await applyLedgerEntry(tx, {
    accountId: platformEscrow.id,
    entryType: 'CREDIT',
    amount: payment.amount,
    sourceType: 'PAYMENT_CAPTURE',
    sourceId: payment.id,
    reference: payment.reference,
    note: 'Gross payment captured',
  });

  await applyLedgerEntry(tx, {
    accountId: platformRevenue.id,
    entryType: 'CREDIT',
    amount: payment.platformFee,
    sourceType: 'PAYMENT_CAPTURE',
    sourceId: payment.id,
    reference: payment.reference,
    note: 'Platform fee recognized',
  });

  await applyLedgerEntry(tx, {
    accountId: artisanAccounts.pending.id,
    entryType: 'CREDIT',
    amount: payment.artisanAmount,
    sourceType: 'PAYMENT_CAPTURE',
    sourceId: payment.id,
    reference: payment.reference,
    note: 'Artisan share pending settlement',
  });

  return { posted: true };
};

export const transferArtisanFunds = async (tx, {
  artisanId,
  amount,
  sourceType,
  sourceId,
  reference,
  note,
  fromBucket,
  toBucket,
}) => {
  const accounts = await getArtisanAccounts(tx, artisanId);

  const fromMap = {
    ARTISAN_PENDING_SETTLEMENT: accounts.pending,
    ARTISAN_AVAILABLE: accounts.available,
    ARTISAN_IN_PAYOUT: accounts.inPayout,
  };

  const toMap = fromMap;
  const from = fromMap[fromBucket];
  const to = toMap[toBucket];

  if (!from || !to) {
    throw new Error('Invalid ledger transfer buckets');
  }

  await applyLedgerEntry(tx, {
    accountId: from.id,
    entryType: 'DEBIT',
    amount,
    sourceType,
    sourceId,
    reference,
    note,
  });

  await applyLedgerEntry(tx, {
    accountId: to.id,
    entryType: 'CREDIT',
    amount,
    sourceType,
    sourceId,
    reference,
    note,
  });
};

export const releaseDueSettlements = async (prisma, now = new Date()) => {
  const duePayments = await prisma.payment.findMany({
    where: {
      status: 'SUCCESS',
      settlementAvailableAt: { lte: now },
      settlementReleasedAt: null,
    },
    include: {
      booking: {
        select: {
          artisanId: true,
        },
      },
    },
    take: 200,
  });

  let releasedCount = 0;

  for (const payment of duePayments) {
    await prisma.$transaction(async (tx) => {
      const alreadyReleased = await tx.ledgerEntry.findFirst({
        where: {
          sourceType: 'SETTLEMENT_RELEASE',
          sourceId: payment.id,
        },
        select: { id: true },
      });

      if (!alreadyReleased) {
        await transferArtisanFunds(tx, {
          artisanId: payment.booking.artisanId,
          amount: payment.artisanAmount,
          sourceType: 'SETTLEMENT_RELEASE',
          sourceId: payment.id,
          reference: payment.reference,
          note: 'Settlement released to available balance',
          fromBucket: LEDGER_BUCKETS.ARTISAN_PENDING_SETTLEMENT,
          toBucket: LEDGER_BUCKETS.ARTISAN_AVAILABLE,
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          settlementReleasedAt: now,
        },
      });
    });

    releasedCount += 1;
  }

  return { releasedCount };
};

export const LEDGER_ACCOUNT_TYPES = LEDGER_BUCKETS;