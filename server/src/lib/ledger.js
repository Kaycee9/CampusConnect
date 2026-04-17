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
  const platformEscrow = await ensureAccount(
    tx,
    { code: LEDGER_BUCKETS.PLATFORM_ESCROW },
    makePlatformAccount(LEDGER_BUCKETS.PLATFORM_ESCROW, 'Platform Escrow')
  );

  const platformRevenue = await ensureAccount(
    tx,
    { code: LEDGER_BUCKETS.PLATFORM_REVENUE },
    makePlatformAccount(LEDGER_BUCKETS.PLATFORM_REVENUE, 'Platform Revenue')
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

export const LEDGER_ACCOUNT_TYPES = LEDGER_BUCKETS;