const baseUrl =
  (process.env.TRACECHECK_PERF_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/+$/, "");
const requests = Number(process.env.TRACECHECK_PERF_REQUESTS ?? "40");
const concurrency = Number(process.env.TRACECHECK_PERF_CONCURRENCY ?? "5");
const targetPath = process.env.TRACECHECK_PERF_PATH ?? "/api/health/live";
const targetUrl = `${baseUrl}${targetPath}`;

const runSingleRequest = async () => {
  const startedAt = performance.now();
  const response = await fetch(targetUrl);
  const endedAt = performance.now();

  if (!response.ok) {
    throw new Error(`Perf target returned ${response.status} for ${targetPath}`);
  }

  return endedAt - startedAt;
};

const durations = [];

for (let offset = 0; offset < requests; offset += concurrency) {
  const batchSize = Math.min(concurrency, requests - offset);
  const batch = await Promise.all(
    Array.from({ length: batchSize }, () => runSingleRequest()),
  );
  durations.push(...batch);
}

const sortedDurations = [...durations].sort((left, right) => left - right);
const averageMs =
  sortedDurations.reduce((sum, duration) => sum + duration, 0) /
  sortedDurations.length;
const percentile95 =
  sortedDurations[Math.max(0, Math.ceil(sortedDurations.length * 0.95) - 1)];
const maxMs = sortedDurations.at(-1) ?? 0;

console.log(JSON.stringify({
  targetUrl,
  requests,
  concurrency,
  averageMs: Number(averageMs.toFixed(2)),
  percentile95Ms: Number(percentile95.toFixed(2)),
  maxMs: Number(maxMs.toFixed(2)),
}, null, 2));
