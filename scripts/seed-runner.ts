import { runDatabaseSeed } from '../src/db/seed.ts';

async function main() {
  console.log('=== Manually Triggering Database Seeding ===');
  try {
    await runDatabaseSeed();
    console.log('Seeding procedure completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error executing seed runner:', error);
    process.exit(1);
  }
}

main();
