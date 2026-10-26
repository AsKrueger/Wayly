const { evaluateReport, readAuditReport } = require('./check-npm-audit.cjs');

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

  describe('reading the npm audit result', () => {
    const validReport = {
      vulnerabilities: {},
      metadata: { vulnerabilities: { total: 0 } }
    };

    it('returns the parsed report when npm answers with a complete audit', () => {
      const result = { stdout: JSON.stringify(validReport), stderr: '' };

      expect(readAuditReport(result)).toEqual({ report: validReport });
    });

    it('reports a failure to start npm', () => {
      const result = { error: new Error('spawn EACCES') };

      expect(readAuditReport(result)).toEqual({ error: 'Unable to run npm audit: spawn EACCES' });
    });

    it('reports an interruption before reading the output', () => {
      const result = { signal: 'SIGKILL', stdout: '' };

      expect(readAuditReport(result)).toEqual({ error: 'npm audit was interrupted by SIGKILL.' });
    });

    it('includes npm stderr when the output is not JSON', () => {
      const result = { stdout: '<html>', stderr: 'registry unavailable\n' };

      expect(readAuditReport(result)).toEqual({
        error: 'npm audit did not return valid JSON.\nregistry unavailable'
      });
    });

    it('rejects JSON that is not an object', () => {
      expect(readAuditReport({ stdout: 'null' }).error)
        .toBe('npm audit returned an error or an incomplete report.\nnull');
    });

    it('rejects an error report from npm', () => {
      const result = { stdout: JSON.stringify({ error: { code: 'E401', summary: 'Unauthorized' } }) };

      expect(readAuditReport(result).error).toContain('"code": "E401"');
    });

    it('rejects a report without vulnerability metadata', () => {
      const result = { stdout: JSON.stringify({ vulnerabilities: {} }) };

      expect(readAuditReport(result).error)
        .toContain('npm audit returned an error or an incomplete report.');
    });
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
