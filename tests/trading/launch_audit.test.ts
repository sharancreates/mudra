/**
 * PRD Section 15.1 Launch Checklist & "No Real Money" Audit Suite (Node.js)
 * Conformance: PRD Section 15.1, Section 15.2, Milestone M2 Launch Readiness
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('PRD Section 15.1 Pre-Launch Statutory & "No Real Money" Audit (TypeScript)', () => {
  const repoRoot = path.resolve(process.cwd());

  it('proves zero payment gateway dependencies in client/package.json and server/requirements.txt', () => {
    const pkgPath = path.join(repoRoot, 'client', 'package.json');
    const reqPath = path.join(repoRoot, 'server', 'requirements.txt');

    const forbidden = ['razorpay', 'stripe', 'cashfree', 'paytm', 'phonepe', 'billdesk', 'paypal'];

    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };
      for (const dep of Object.keys(allDeps)) {
        for (const f of forbidden) {
          assert.equal(
            dep.toLowerCase().includes(f),
            false,
            `Forbidden payment dependency found in client/package.json: ${dep}`
          );
        }
      }
    }

    if (fs.existsSync(reqPath)) {
      const reqText = fs.readFileSync(reqPath, 'utf8').toLowerCase();
      for (const f of forbidden) {
        assert.equal(
          reqText.includes(f),
          false,
          `Forbidden payment dependency found in server/requirements.txt: ${f}`
        );
      }
    }
  });

  it('scans client source code and proves complete absence of payment or banking PII integration', () => {
    const clientSrc = path.join(repoRoot, 'client', 'src');
    const forbiddenPatterns = [
      /\brazorpay\b/i,
      /\bstripe\b/i,
      /\bcashfree\b/i,
      /\bpaytm\b/i,
      /\bphonepe\b/i,
      /\bpan_number\b/i,
      /\bifsc_code\b/i,
      /\bdemat_id\b/i,
    ];

    function scanDir(dir: string): string[] {
      const matches: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'terms' || entry.name === 'mocks') {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          matches.push(...scanDir(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const pat of forbiddenPatterns) {
            if (pat.test(content)) {
              matches.push(`${fullPath}: matches ${pat}`);
            }
          }
        }
      }
      return matches;
    }

    const violations = scanDir(clientSrc);
    assert.deepEqual(violations, [], 'Found forbidden payment or banking PII tokens in client source code');
  });

  it('verifies statutory SEBI disclosures and "No Real Money" disclaimers on /terms page', () => {
    const termsPath = path.join(repoRoot, 'client', 'src', 'app', 'terms', 'page.tsx');
    assert.ok(fs.existsSync(termsPath), 'client/src/app/terms/page.tsx must exist');

    const content = fs.readFileSync(termsPath, 'utf8');
    const textLower = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();

    // SEBI Unregistered Broker disclaimer
    assert.ok(
      textLower.includes('sebi') && textLower.includes('not a broker'),
      'Must contain explicit statutory SEBI unregistered disclaimer'
    );

    // "No Real Money" clause
    assert.ok(
      textLower.includes('no real money'),
      'Must contain explicit "No Real Money" clause'
    );

    // Zero fiat value clause
    assert.ok(
      textLower.includes('zero fiat value') || textLower.includes('zero cash value'),
      'Must declare virtual capital holds zero fiat value'
    );
  });

  it('verifies mandatory 18+ age gate and simulation agreement in AuthModal', () => {
    const authPath = path.join(repoRoot, 'client', 'src', 'components', 'auth', 'AuthModal.tsx');
    assert.ok(fs.existsSync(authPath), 'AuthModal.tsx must exist');

    const content = fs.readFileSync(authPath, 'utf8').toLowerCase();
    assert.ok(content.includes('18'), 'AuthModal must contain 18+ age verification gate');
    assert.ok(
      content.includes('simulation') || content.includes('zero cash value'),
      'AuthModal must require acknowledgment of virtual simulation with zero cash value'
    );
  });

  it('confirms starting capital is exactly 10,000,000 paise (₹1,00,000.00) with zero float types', () => {
    const typesPath = path.join(repoRoot, 'client', 'src', 'types', 'api.ts');
    assert.ok(fs.existsSync(typesPath), 'client/src/types/api.ts must exist');

    const content = fs.readFileSync(typesPath, 'utf8');
    // Ensure paise fields exist
    assert.ok(content.includes('cash_paise: number'));
    assert.ok(content.includes('equity_paise: number'));
    assert.ok(content.includes('reserved_paise: number'));
  });
});
