import pkg from 'pg';
const { Client } = pkg;
import { execSync } from 'child_process';
import { runDatabaseSeed } from '../src/db/seed.ts';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  // 1. Connect to PostgreSQL
  console.log('🔌 Step 1: Connecting to PostgreSQL using DATABASE_URL...');
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('✅ Connection successful!');
  } catch (error: any) {
    console.error('❌ DATABASE CONNECTION FAILED!');
    console.error('----------------------------------------');
    console.error('Exact Error Message:', error.message || error);
    console.error('Error Details:', error);
    console.error('----------------------------------------');
    process.exit(1);
  }

  // 2. Run Drizzle migrations
  console.log('\n🚀 Step 2: Running Drizzle schema push (migration)...');
  try {
    execSync('npx drizzle-kit push --config=src/db/drizzle.config.ts', { stdio: 'inherit' });
    console.log('✅ Drizzle schema push completed successfully!');
  } catch (error: any) {
    console.error('❌ Drizzle migrations/push failed!');
    console.error('----------------------------------------');
    console.error(error.message || error);
    console.error('----------------------------------------');
    await client.end();
    process.exit(1);
  }

  // 3. List all tables from information_schema.tables
  console.log('\n📋 Step 3: Listing all tables from information_schema.tables...');
  try {
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name ASC;
    `);
    console.log('Tables found in the database:');
    if (res.rows.length === 0) {
      console.log('ℹ️ No public tables found.');
    } else {
      res.rows.forEach((row, idx) => {
        console.log(`  [${idx + 1}] Schema: ${row.table_schema} | Table: ${row.table_name}`);
      });
    }
  } catch (error: any) {
    console.error('❌ Failed to list tables!');
    console.error('----------------------------------------');
    console.error(error.message || error);
    console.error('----------------------------------------');
    await client.end();
    process.exit(1);
  }

  // 4. Run database seed
  console.log('\n🌱 Step 4: Running database seed runner...');
  try {
    await runDatabaseSeed();
    console.log('✅ Seeding completed successfully!');
  } catch (error: any) {
    console.error('❌ Seeding failed!');
    console.error('----------------------------------------');
    console.error(error.message || error);
    console.error('----------------------------------------');
    await client.end();
    process.exit(1);
  }

  // Clean up pg connection
  await client.end();
  console.log('\n🏁 All verification and migration steps succeeded perfectly!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Unexpected error in db-verify-and-seed main process:', err);
  process.exit(1);
});
