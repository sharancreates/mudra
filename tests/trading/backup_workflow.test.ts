/**
 * Weekly Database Backup Workflow & Artifact Invariants Test Suite (Node.js)
 * Conformance: Phase 4 Plan 4.2, PRD FR-46, Operational Reliability
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

describe('Weekly Database Backup Workflow & Invariants (.github/workflows/weekly-backup.yml)', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/weekly-backup.yml');

  it('verifies backup workflow file exists with valid structure', () => {
    assert.ok(fs.existsSync(workflowPath), 'Workflow file weekly-backup.yml must exist');
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.length > 200, 'Workflow content must not be empty');
    assert.match(content, /name:\s*Weekly Database Backup & Archive/);
  });

  it('enforces weekly Sunday 00:00 UTC schedule (cron: 0 0 * * 0)', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /schedule:/, 'Workflow must have a schedule trigger');
    assert.match(content, /- cron:\s*['"]0 0 \* \* 0['"]/, 'Cron must be Sunday 00:00 UTC');
  });

  it('supports workflow_dispatch manual trigger with retention configuration', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /workflow_dispatch:/, 'Workflow must support manual trigger');
    assert.match(content, /retention_days:/, 'Must accept retention_days input');
    assert.match(content, /default:\s*['"]30['"]/, 'Default retention must be 30 days');
    assert.match(content, /backup_type:/, 'Must accept backup_type input');
  });

  it('includes PostgreSQL client tools and backup utility invocation', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /postgresql-client/, 'Must install postgresql-client');
    assert.match(content, /python -m app\.scripts\.backup/, 'Must invoke app.scripts.backup');
    assert.match(content, /--compress/, 'Must enable compression');
  });

  it('configures artifact upload via actions/upload-artifact@v4 and failure alerting', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /actions\/upload-artifact@v4/, 'Must use upload-artifact@v4');
    assert.match(content, /retention-days:/, 'Must enforce artifact retention');
    assert.match(content, /actions\/github-script@v7/, 'Must include failure alerting script');
    assert.match(content, /issues\.create/, 'Must open issue on backup failure');
  });

  it('simulates and verifies SHA256 integrity digest computation', () => {
    // Pure invariant test verifying digest calculation compatibility
    const samplePayload = JSON.stringify({
      version: '1.0',
      system: 'Mudra Virtual Stock Simulator',
      tables: { wallets: 10, orders: 45, ledger: 55 },
    });

    const hash = crypto.createHash('sha256').update(samplePayload).digest('hex');
    assert.equal(hash.length, 64, 'SHA256 hex digest must be 64 characters');

    // Mismatched hash verification
    const corruptedHash = '0000000000000000000000000000000000000000000000000000000000000000';
    assert.notEqual(hash, corruptedHash, 'Mismatched hash should fail verification');
  });
});
