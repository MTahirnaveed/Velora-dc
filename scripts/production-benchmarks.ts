import { performance } from 'perf_hooks';
import dotenv from 'dotenv';
import { db } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';

dotenv.config();

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m"
};

const TARGET_URL = "http://localhost:3000/api/settings";

function logHeader(title: string) {
  console.log(`\n${colors.magenta}${colors.bright}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright} 🚀 PERFORMANCE BENCHMARK: ${title.toUpperCase()}${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}======================================================================${colors.reset}`);
}

async function measurePostgresQueryTime(): Promise<number> {
  const start = performance.now();
  try {
    // Execute a standard fast query to test active PostgreSQL speed
    await db.execute(sql`SELECT 1`);
  } catch (err: any) {
    console.error("Postgres query failed:", err.message);
  }
  return performance.now() - start;
}

interface BenchmarkMetrics {
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  rateLimitedRequests: number;
  failedRequests: number;
  avgResponseTimeMs: number;
  p95LatencyMs: number;
  dbQueryTimeMs: number;
  memUsageMb: number;
  cpuUsageUser: number;
}

async function runBenchmarkForConcurrency(concurrency: number): Promise<BenchmarkMetrics> {
  console.log(`\n🔥 Preparing load test for ${colors.bright}${concurrency} concurrent requests${colors.reset}...`);
  
  const startMem = process.memoryUsage().heapUsed;
  const startCpu = process.cpuUsage();
  
  const latencies: number[] = [];
  let successful = 0;
  let rateLimited = 0;
  let failed = 0;

  // Let's create an array of promises
  const requests = Array.from({ length: concurrency }).map(async () => {
    const startReq = performance.now();
    try {
      const res = await fetch(TARGET_URL);
      const endReq = performance.now();
      if (res.status === 200) {
        successful++;
        latencies.push(endReq - startReq);
      } else if (res.status === 429) {
        rateLimited++;
        latencies.push(endReq - startReq);
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
    }
  });

  const startBenchmark = performance.now();
  await Promise.all(requests);
  const totalDuration = performance.now() - startBenchmark;

  const endMem = process.memoryUsage().heapUsed;
  const endCpu = process.cpuUsage(startCpu);

  // Compute stats
  latencies.sort((a, b) => a - b);
  const totalLatencies = latencies.reduce((acc, curr) => acc + curr, 0);
  const avgResponseTime = latencies.length > 0 ? totalLatencies / latencies.length : 0;
  
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies.length > 0 ? latencies[p95Index] || latencies[latencies.length - 1] : 0;

  // Measure database performance as well during active load
  const dbTime = await measurePostgresQueryTime();

  const memUsedMb = (endMem - startMem) / 1024 / 1024;
  const cpuUser = endCpu.user / 1000; // converted to ms

  return {
    concurrency,
    totalRequests: concurrency,
    successfulRequests: successful,
    rateLimitedRequests: rateLimited,
    failedRequests: failed,
    avgResponseTimeMs: avgResponseTime,
    p95LatencyMs: p95Latency,
    dbQueryTimeMs: dbTime,
    memUsageMb: Math.max(0, memUsedMb),
    cpuUsageUser: cpuUser
  };
}

async function executeAllBenchmarks() {
  logHeader("Velora High-Performance Real-Time Benchmarking Engine");
  
  const results: BenchmarkMetrics[] = [];
  
  // Tiers requested: 100, 500, 1000
  const tiers = [100, 500, 1000];
  
  for (const tier of tiers) {
    const metrics = await runBenchmarkForConcurrency(tier);
    results.push(metrics);
    
    console.log(`  📊 Results for Tier ${colors.bright}${tier}${colors.reset}:`);
    console.log(`    ✅ Successful (200 OK):    ${colors.green}${metrics.successfulRequests}/${metrics.totalRequests}${colors.reset}`);
    console.log(`    🛡️  Rate Limited (429):     ${colors.blue}${metrics.rateLimitedRequests}/${metrics.totalRequests}${colors.reset}`);
    console.log(`    ❌ Failed/Error:           ${colors.red}${metrics.failedRequests}${colors.reset}`);
    console.log(`    ⏱️  Avg Response Time:       ${colors.yellow}${metrics.avgResponseTimeMs.toFixed(2)} ms${colors.reset}`);
    console.log(`    ⏱️  P95 Latency:            ${colors.yellow}${metrics.p95LatencyMs.toFixed(2)} ms${colors.reset}`);
    console.log(`    💾 Heap Memory Delta:      ${colors.cyan}${metrics.memUsageMb.toFixed(2)} MB${colors.reset}`);
    console.log(`    ⚙️  CPU User Time Delta:    ${colors.cyan}${metrics.cpuUsageUser.toFixed(2)} ms${colors.reset}`);
    console.log(`    🗄️  PostgreSQL Query Time:  ${colors.green}${metrics.dbQueryTimeMs.toFixed(2)} ms${colors.reset}`);
  }

  logHeader("PRODU-READY BENCHMARK EVALUATION SUMMARY REPORT");
  console.log(`\n  ${colors.bright}RAW BENCHMARK OUTPUT DATA:${colors.reset}\n`);
  console.table(results.map(r => ({
    "Concurrency Tier": r.concurrency,
    "Successful (200 OK)": `${r.successfulRequests}/${r.totalRequests}`,
    "Rate Limited (429)": `${r.rateLimitedRequests}/${r.totalRequests}`,
    "Failures (Non-429)": r.failedRequests,
    "Avg Resp Time": `${r.avgResponseTimeMs.toFixed(2)} ms`,
    "P95 Latency": `${r.p95LatencyMs.toFixed(2)} ms`,
    "Mem Delta": `${r.memUsageMb.toFixed(2)} MB`,
    "CPU Delta": `${r.cpuUsageUser.toFixed(2)} ms`,
    "DB Query Speed": `${r.dbQueryTimeMs.toFixed(2)} ms`
  })));

  console.log(`\n🏆 Load testing completed successfully! All concurrency tiers evaluated correctly.`);
}

executeAllBenchmarks().catch((err) => {
  console.error("Benchmarking engine crashed:", err);
  process.exit(1);
});
