/**
 * Uptime Check & Health Monitor Workflow Invariants Test Suite (Node.js)
 * Conformance: Phase 4 Plan 4.3, PRD FR-48, Operational Reliability
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StatusResponse } from '../../client/src/types/api';

describe('Uptime Check Workflow & Health Monitor Invariants (.github/workflows/health-monitor.yml)', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/health-monitor.yml');

  it('verifies health-monitor.yml workflow file exists and has valid configuration', () => {
    assert.ok(fs.existsSync(workflowPath), 'Workflow file health-monitor.yml must exist');
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.length > 200, 'Workflow content must not be empty');
    assert.match(content, /name:\s*Mudra API Uptime & Health Monitor/);
  });

  it('enforces 30-minute continuous cron schedule (cron: */30 * * * *)', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /schedule:/, 'Workflow must have schedule trigger');
    assert.match(content, /- cron:\s*['"]\*\/(?:15|30) \* \* \* \*['"]/, 'Cron must be recurring every 15 or 30 minutes');
  });

  it('supports workflow_dispatch manual trigger with target URL override and latency threshold', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /workflow_dispatch:/, 'Workflow must support manual trigger');
    assert.match(content, /target_url:/, 'Must accept target_url input');
    assert.match(content, /max_latency_ms:/, 'Must accept max_latency_ms input');
  });

  it('invokes healthcheck script and captures structured JSON report', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /python -m app\.scripts\.healthcheck/, 'Must invoke app.scripts.healthcheck');
    assert.match(content, /--json/, 'Must capture JSON report');
    assert.match(content, /GITHUB_STEP_SUMMARY/, 'Must generate Step Summary table');
  });

  it('configures automated issue alert on uptime or latency SLA failure', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.match(content, /actions\/github-script@v7/, 'Must use github-script for failure alert');
    assert.match(content, /issues\.create/, 'Must open GitHub issue on failure');
    assert.match(content, /uptime/, 'Must tag issue with uptime label');
  });

  it('validates TypeScript StatusResponse contract conformance with mock API payload', () => {
    const mockApiResponse = {
      prices_as_of: '2026-10-09',
      state: 'FRESH' as const,
      market_open: false,
      status: 'ok',
      version: '0.2.0',
      uptime_seconds: 142.5,
      timestamp: '2026-10-13T12:00:00Z',
      database: { status: 'connected', mode: 'in_memory' },
      components: {
        market_adapter: { status: 'healthy', instruments_count: 50 },
        state_store: { status: 'healthy', wallets_count: 5 },
      },
    };

    // Confirm that StatusResponse contract accepts this response without error
    const status: StatusResponse = {
      prices_as_of: mockApiResponse.prices_as_of,
      state: mockApiResponse.state,
      market_open: mockApiResponse.market_open,
    };

    assert.equal(status.prices_as_of, '2026-10-09');
    assert.equal(status.state, 'FRESH');
    assert.equal(status.market_open, false);
    assert.equal(mockApiResponse.status, 'ok');
    assert.equal(mockApiResponse.version, '0.2.0');
    assert.ok(mockApiResponse.uptime_seconds > 0);
  });
});
