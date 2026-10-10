const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const baselinePath = path.join(__dirname, '..', 'security', 'npm-audit-baseline.json');

function evaluateReport(report, baselineIds) {
  const observed = new Set();
  const newFindings = [];

  for (const [packageName, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
    for (const advisory of vulnerability.via ?? []) {
      if (typeof advisory === 'string' || !['high', 'critical'].includes(advisory.severity)) {
        continue;
      }

      const advisoryId = advisory.url?.match(/GHSA-[0-9a-z-]+/i)?.[0];
      if (advisoryId) {
        observed.add(advisoryId);
      }

      if (!advisoryId || !baselineIds.has(advisoryId)) {
        newFindings.push({
          packageName,
          advisoryId: advisoryId ?? `unidentified source ${advisory.source ?? 'unknown'}`,
          severity: advisory.severity
        });
      }
    }
  }

  return {
    observed,
    newFindings,
    staleBaseline: [...baselineIds].filter((id) => !observed.has(id))
  };
}

function run() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    console.error('Run this check through `npm run security:audit` so npm can locate its CLI.');
    process.exitCode = 1;
    return;
  }

  const result = spawnSync(process.execPath, [npmCli, 'audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    console.error(`Unable to run npm audit: ${result.error.message}`);
    process.exitCode = 1;
    return;
  }

  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    console.error('npm audit did not return valid JSON.');
    if (result.stderr) {
      console.error(result.stderr.trim());
    }
    process.exitCode = 1;
    return;
  }

  if (report.error || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
    console.error('npm audit returned an error or an incomplete report.');
    console.error(JSON.stringify(report.error ?? report, null, 2));
    process.exitCode = 1;
    return;
  }

  if (result.signal) {
    console.error(`npm audit was interrupted by ${result.signal}.`);
    process.exitCode = 1;
    return;
  }

  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const baselineIds = new Set(baseline.knownHighCriticalGhsas);
  const evaluation = evaluateReport(report, baselineIds);
  const knownAffectedPackages = Object.values(report.vulnerabilities)
    .filter((vulnerability) => ['high', 'critical'].includes(vulnerability.severity))
    .length;

  console.log(
    `npm audit: ${knownAffectedPackages} affected packages with high/critical findings; ` +
    `${evaluation.observed.size} known advisories in the baseline.`
  );

  if (evaluation.newFindings.length > 0 || evaluation.staleBaseline.length > 0) {
    for (const finding of evaluation.newFindings) {
      console.error(
        `New ${finding.severity} advisory: ${finding.advisoryId} (${finding.packageName})`
      );
    }
    for (const advisoryId of evaluation.staleBaseline) {
      console.error(`Baseline entry no longer reported; remove it: ${advisoryId}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('No new high/critical advisories; baseline matches the current audit report.');
}

module.exports = { evaluateReport };

if (require.main === module) {
  run();
}
