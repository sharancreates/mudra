/**
 * Authentication, Navigation & Protected Routes Test Suite
 * Conformance: Phase 5 Auth & Navigation UX Overhaul
 *
 * Requirements Verified:
 * 1. Sign-out route bug: Signs out, purges session, and redirects to home ('/')
 * 2. Market explorer: Removed trade action buttons and Action column from StockTable.tsx
 * 3. Leaderboard: Gated behind authentication (unauthenticated visitors see access restriction card)
 * 4. Hamburger menu: Removed "Trade Stock" link; items cleanly numbered 01-04
 * 5. Sign-in & Register: Requires email address, password (>= 6 chars), and pseudonym (>= 3 chars)
 * 6. "Continue with Google": Supabase Google OAuth integration with /dashboard redirect
 * 7. Post-sign-in landing: Successfully directs to /dashboard
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Phase 5 Auth, Navigation & Protected Routes Suite', () => {
  const repoRoot = path.resolve(process.cwd());

  // =========================================================================
  // Requirement 1: Sign-out Route Bug & Session Purging
  // =========================================================================
  it('Req 1: verifies MudraShell, MudraHeader, and MudraMenu purge session and redirect to / on sign-out', () => {
    const shellPath = path.join(repoRoot, 'client', 'src', 'components', 'mudra', 'MudraShell.tsx');
    const headerPath = path.join(repoRoot, 'client', 'src', 'components', 'mudra', 'MudraHeader.tsx');
    const menuPath = path.join(repoRoot, 'client', 'src', 'components', 'mudra', 'MudraMenu.tsx');

    assert.ok(fs.existsSync(shellPath), 'MudraShell.tsx must exist');
    assert.ok(fs.existsSync(headerPath), 'MudraHeader.tsx must exist');
    assert.ok(fs.existsSync(menuPath), 'MudraMenu.tsx must exist');

    const shellContent = fs.readFileSync(shellPath, 'utf8');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    const menuContent = fs.readFileSync(menuPath, 'utf8');

    // MudraShell must implement handleSignOut
    assert.ok(
      shellContent.includes('handleSignOut'),
      'MudraShell must implement handleSignOut handler'
    );
    // MudraShell must remove mudra_user from localStorage
    assert.ok(
      shellContent.includes("localStorage.removeItem('mudra_user')") ||
      shellContent.includes('localStorage.removeItem("mudra_user")'),
      'MudraShell must remove mudra_user from localStorage upon sign-out'
    );
    // MudraShell must sign out of Supabase
    assert.ok(
      shellContent.includes('supabase.auth.signOut()'),
      'MudraShell must invoke supabase.auth.signOut() upon sign-out'
    );
    // MudraShell must redirect directly to home ('/')
    assert.ok(
      shellContent.includes("router.push('/')") || shellContent.includes('router.push("/")'),
      'MudraShell must redirect to home (/) on sign-out'
    );
    // MudraShell must wire onSignOut to MudraHeader and MudraMenu
    assert.ok(
      shellContent.includes('onSignOut={handleSignOut}'),
      'MudraShell must pass handleSignOut to header and menu'
    );

    // MudraHeader must accept onSignOut and provide Sign Out button
    assert.ok(
      headerContent.includes('onSignOut?: () => void') || headerContent.includes('onSignOut'),
      'MudraHeader must support onSignOut callback'
    );
    assert.ok(
      headerContent.includes('Sign Out'),
      'MudraHeader must contain Sign Out button for authenticated user'
    );

    // MudraMenu must accept onSignOut and provide Sign Out button
    assert.ok(
      menuContent.includes('onSignOut?: () => void') || menuContent.includes('onSignOut'),
      'MudraMenu must support onSignOut callback'
    );
    assert.ok(
      menuContent.includes('Sign Out'),
      'MudraMenu must contain Sign Out button for authenticated user'
    );
  });

  // =========================================================================
  // Requirement 2: Remove Trade Action Buttons from Market Explorer
  // =========================================================================
  it('Req 2: asserts removal of Trade action buttons and Action column header from StockTable', () => {
    const tablePath = path.join(repoRoot, 'client', 'src', 'components', 'explorer', 'StockTable.tsx');
    assert.ok(fs.existsSync(tablePath), 'StockTable.tsx must exist');

    const content = fs.readFileSync(tablePath, 'utf8');

    // Action column header must NOT exist
    assert.equal(
      content.includes('>Action<'),
      false,
      'StockTable must not include an "Action" column header'
    );

    // Trade button must NOT exist in the table rows
    assert.equal(
      content.includes('>Trade<'),
      false,
      'StockTable must not contain "Trade" action buttons'
    );
    assert.equal(
      content.includes('>Trade </') || content.includes('> Trade<'),
      false,
      'StockTable must not render Trade action buttons'
    );

    // Verify row navigation remains intact
    assert.ok(
      content.includes('/stock/') || content.includes('stock/${'),
      'StockTable must preserve navigation to stock detail pages on row/symbol click'
    );
  });

  // =========================================================================
  // Requirement 3: Leaderboard Only Visible When User Is Logged In
  // =========================================================================
  it('Req 3: verifies /leaderboard is strictly gated behind user authentication', () => {
    const leaderboardPath = path.join(repoRoot, 'client', 'src', 'app', 'leaderboard', 'page.tsx');
    assert.ok(fs.existsSync(leaderboardPath), 'leaderboard/page.tsx must exist');

    const content = fs.readFileSync(leaderboardPath, 'utf8');

    // Must check user state
    assert.ok(
      content.includes('user') && (content.includes('!user') || content.includes('user === null')),
      'Leaderboard page must check user authentication state'
    );

    // Must have auth gate container or message
    assert.ok(
      content.includes('Leaderboard Access Restricted'),
      'Leaderboard page must display "Leaderboard Access Restricted" when unauthenticated'
    );

    // Must provide Sign In / Join Sandbox trigger
    assert.ok(
      content.includes('Sign In / Join Sandbox'),
      'Leaderboard page must render "Sign In / Join Sandbox" action button'
    );

    // Must include AuthModal component
    assert.ok(
      content.includes('<AuthModal') && content.includes('authModalOpen'),
      'Leaderboard page must integrate AuthModal for instant sign-in'
    );

    // Data-auth-gate marker must be present
    assert.ok(
      content.includes('data-auth-gate'),
      'Leaderboard page must contain data-auth-gate attribute for testability'
    );
  });

  // =========================================================================
  // Requirement 4: Remove Trade Stock from Hamburger Menu
  // =========================================================================
  it('Req 4: confirms "Trade Stock" is removed from MudraMenu and items are cleanly numbered 01-04', () => {
    const menuPath = path.join(repoRoot, 'client', 'src', 'components', 'mudra', 'MudraMenu.tsx');
    assert.ok(fs.existsSync(menuPath), 'MudraMenu.tsx must exist');

    const content = fs.readFileSync(menuPath, 'utf8');

    // "Trade Stock" must NOT be in menu items
    assert.equal(
      content.includes('"Trade Stock"') || content.includes("'Trade Stock'"),
      false,
      'MudraMenu must not contain "Trade Stock" item'
    );

    // Verify exactly 4 menu items: Home, Explore Market, Portfolio, Leaderboard
    assert.ok(content.includes('num: "01"') && content.includes('label: "Home"'), 'Menu item 01 must be Home');
    assert.ok(content.includes('num: "02"') && content.includes('label: "Explore Market"'), 'Menu item 02 must be Explore Market');
    assert.ok(content.includes('num: "03"') && content.includes('label: "Portfolio"'), 'Menu item 03 must be Portfolio');
    assert.ok(content.includes('num: "04"') && content.includes('label: "Leaderboard"'), 'Menu item 04 must be Leaderboard');

    // No item 05 should exist
    assert.equal(
      content.includes('num: "05"'),
      false,
      'MudraMenu must have exactly 4 numbered navigation links'
    );
  });

  // =========================================================================
  // Requirement 5: Sign-in & Register Strictly Require Email, Password, Pseudonym
  // =========================================================================
  it('Req 5: verifies AuthModal requires email, password (min 6), and pseudonym (min 3) in both modes', () => {
    const authPath = path.join(repoRoot, 'client', 'src', 'components', 'auth', 'AuthModal.tsx');
    assert.ok(fs.existsSync(authPath), 'AuthModal.tsx must exist');

    const content = fs.readFileSync(authPath, 'utf8');

    // Verify state variables exist for email, password, pseudonym
    assert.ok(content.includes('email') && content.includes('setEmail'), 'AuthModal must manage email state');
    assert.ok(content.includes('password') && content.includes('setPassword'), 'AuthModal must manage password state');
    assert.ok(content.includes('displayName') && content.includes('setDisplayName'), 'AuthModal must manage pseudonym state');

    // Verify validation requires password length >= 6
    assert.ok(
      content.includes('password.length < 6'),
      'AuthModal must enforce password length >= 6 characters'
    );

    // Verify validation requires pseudonym length >= 3
    assert.ok(
      content.includes('trimmedDisplayName.length < 3') ||
      content.includes('displayName.trim().length < 3') ||
      content.includes('displayName.length < 3'),
      'AuthModal must enforce pseudonym length >= 3 characters'
    );

    // Verify pseudonym input is rendered in both signin and register modes
    assert.ok(
      content.includes('Leaderboard Pseudonym') || content.includes('Pseudonym'),
      'AuthModal must render Pseudonym input field'
    );

    // Verify password input is rendered
    assert.ok(
      content.includes('type="password"') || content.includes("type='password'"),
      'AuthModal must render password input field'
    );

    // Verify email input is rendered
    assert.ok(
      content.includes('type="email"') || content.includes("type='email'"),
      'AuthModal must render email input field'
    );
  });

  // =========================================================================
  // Requirement 6: "Continue with Google" Supabase OAuth
  // =========================================================================
  it('Req 6: confirms Supabase client singleton and "Continue with Google" OAuth integration', () => {
    const supabasePath = path.join(repoRoot, 'client', 'src', 'lib', 'supabase.ts');
    const authPath = path.join(repoRoot, 'client', 'src', 'components', 'auth', 'AuthModal.tsx');

    assert.ok(fs.existsSync(supabasePath), 'client/src/lib/supabase.ts must exist');
    assert.ok(fs.existsSync(authPath), 'AuthModal.tsx must exist');

    const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
    const authContent = fs.readFileSync(authPath, 'utf8');

    // Supabase client creation
    assert.ok(
      supabaseContent.includes('createClient'),
      'client/src/lib/supabase.ts must call createClient'
    );

    // AuthModal Google OAuth handler
    assert.ok(
      authContent.includes('handleGoogleSignIn') || authContent.includes('signInWithOAuth'),
      'AuthModal must implement Google OAuth handler'
    );
    assert.ok(
      authContent.includes("provider: 'google'") || authContent.includes('provider: "google"'),
      'AuthModal must invoke signInWithOAuth with google provider'
    );
    assert.ok(
      authContent.includes('/dashboard'),
      'AuthModal Google OAuth redirect must target /dashboard'
    );
    assert.ok(
      authContent.includes('Continue with Google'),
      'AuthModal must render "Continue with Google" button'
    );
  });

  // =========================================================================
  // Requirement 7: Post-Sign-In Landing on Dashboard
  // =========================================================================
  it('Req 7: verifies post-authentication routing lands directly on /dashboard', () => {
    const authPath = path.join(repoRoot, 'client', 'src', 'components', 'auth', 'AuthModal.tsx');
    const shellPath = path.join(repoRoot, 'client', 'src', 'components', 'mudra', 'MudraShell.tsx');

    const authContent = fs.readFileSync(authPath, 'utf8');
    const shellContent = fs.readFileSync(shellPath, 'utf8');

    // AuthModal redirects to /dashboard upon standard login/register
    assert.ok(
      authContent.includes("router.push('/dashboard')") || authContent.includes('router.push("/dashboard")'),
      'AuthModal must navigate to /dashboard upon auth success'
    );

    // MudraShell listens to Supabase auth state change and redirects to /dashboard
    assert.ok(
      shellContent.includes('onAuthStateChange') &&
      (shellContent.includes("router.push('/dashboard')") || shellContent.includes('router.push("/dashboard")')),
      'MudraShell onAuthStateChange must navigate to /dashboard on SIGNED_IN event'
    );
  });
});
