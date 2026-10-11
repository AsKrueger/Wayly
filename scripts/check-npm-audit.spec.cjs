const { evaluateReport } = require('./check-npm-audit.cjs');

function advisory(id, severity = 'high') {
  return {
    severity,
    url: `https://github.com/advisories/${id}`,
    source: 1
  };
}

describe('npm audit baseline gate', () => {
  it('accepts findings that match the reviewed baseline', () => {
    const report = {
      vulnerabilities: {
        package: { via: [advisory('GHSA-known-1234-5678', 'critical')] }
      }
    };

    expect(evaluateReport(report, new Set(['GHSA-known-1234-5678']))).toMatchObject({
      newFindings: [],
      staleBaseline: []
    });
  });

  it('rejects advisories that are new or cannot be identified', () => {
    const report = {
      vulnerabilities: {
        first: { via: [advisory('GHSA-new-1234-5678')] },
        second: { via: [{ severity: 'critical', source: 42 }] }
      }
    };

    expect(evaluateReport(report, new Set()).newFindings).toEqual([
      {
        packageName: 'first',
        advisoryId: 'GHSA-new-1234-5678',
        severity: 'high'
      },
      {
        packageName: 'second',
        advisoryId: 'unidentified source 42',
        severity: 'critical'
      }
    ]);
  });

  it('requires resolved advisories to be removed from the baseline', () => {
    const report = { vulnerabilities: {} };

    expect(evaluateReport(report, new Set(['GHSA-resolved-1234-5678'])).staleBaseline)
      .toEqual(['GHSA-resolved-1234-5678']);
  });

  it('does not gate moderate findings', () => {
    const report = {
      vulnerabilities: {
        package: { via: [advisory('GHSA-moderate-1234-5678', 'moderate')] }
      }
    };

    expect(evaluateReport(report, new Set())).toMatchObject({
      newFindings: [],
      staleBaseline: []
    });
  });
});
