import db from '../src/config/database.js';
import { ensureArtisanLedgerAccounts, ensurePlatformLedgerAccounts } from '../src/lib/ledger.js';

const main = async () => {
  await db.$transaction(async (tx) => {
    await ensurePlatformLedgerAccounts(tx);

    const artisans = await tx.artisanProfile.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    for (const artisan of artisans) {
      await ensureArtisanLedgerAccounts(tx, artisan);
    }
  });

  console.log('Ledger accounts seeded successfully.');
};

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });