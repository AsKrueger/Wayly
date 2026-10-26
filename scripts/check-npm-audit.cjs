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

function readAuditReport(result) {
  if (result.error) {
    return { error: `Unable to run npm audit: ${result.error.message}` };
  }

  if (result.signal) {
    return { error: `npm audit was interrupted by ${result.signal}.` };
  }

  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : '';
    return { error: `npm audit did not return valid JSON.${stderr}` };
  }

  if (!report || typeof report !== 'object' || report.error ||
      !report.vulnerabilities || !report.metadata?.vulnerabilities) {
    const detail = JSON.stringify(report?.error ?? report, null, 2);
    return { error: `npm audit returned an error or an incomplete report.\n${detail}` };
  }

  return { report };
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

  const outcome = readAuditReport(result);
  if (outcome.error) {
    console.error(outcome.error);
    process.exitCode = 1;
    return;
  }
  const report = outcome.report;

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

module.exports = { evaluateReport, readAuditReport };

if (require.main === module) {
  run();
}
