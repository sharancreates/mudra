---
phase: 5
plan: 1
wave: 1
lead: "Person A & Person B"
depends_on: []
files_modified:
  - client/src/lib/supabase.ts
  - client/src/components/auth/AuthModal.tsx
  - client/src/components/mudra/MudraShell.tsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Sign-in and registration forms strictly require an email address, password (min 6 chars), and pseudonym (min 3 chars)"
    - "'Continue with Google' triggers Supabase Google OAuth with redirectTo targeting /dashboard, maintaining graceful fallback"
    - "Successful authentication (both credential submission and OAuth callback) automatically redirects the user to /dashboard"
    - "Statutory 18+ age verification and virtual simulation acknowledgments remain strictly enforced on registration"
  artifacts:
    - client/src/lib/supabase.ts
    - client/src/components/auth/AuthModal.tsx
---

# Plan 5.1: Enhanced Authentication — Email, Password, Pseudonym & Google OAuth

<objective>
Upgrade Mudra's authentication flow to require an email address, secure password, and leaderboard pseudonym across sign-in/registration, integrate real Supabase Google OAuth for "Continue with Google" with redirect to `/dashboard`, and ensure successful authentication immediately lands the user on the Portfolio Dashboard.
</objective>

<context>
Load for context:
- client/src/components/auth/AuthModal.tsx
- client/src/components/mudra/MudraShell.tsx
- client/package.json
- server/app/scripts/launch_audit.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author Supabase Client Helper & Google OAuth Integration</name>
  <files>
    client/src/lib/supabase.ts
    client/src/components/auth/AuthModal.tsx
  </files>
  <action>
    1. Create `client/src/lib/supabase.ts`:
       - Initialize Supabase client using `@supabase/supabase-js`.
       - Safely read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
       - If environment variables are absent, return a resilient client stub or null with safe warning logging, preventing browser crashes.
    2. In `client/src/components/auth/AuthModal.tsx`:
       - Wire "Continue with Google" button to `handleGoogleSignIn`.
       - Invoke `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })` when Supabase is configured.
       - Provide seamless demo fallback when running in local development mode without Supabase credentials.
    3. Retain statutory PRD §15.1 notices: 18+ age checkbox, virtual simulation acknowledgment with zero cash value.
    AVOID: Breaking Pillar 4 launch audit checks (must contain '18' and 'simulation' / 'virtual').
  </action>
  <verify>
    npm test
  </verify>
  <done>
    Google OAuth helper is configured, 'Continue with Google' triggers OAuth redirect, and statutory disclaimers remain intact.
  </done>
</task>

<task type="auto">
  <name>Task 2: Mandatory Email, Password & Pseudonym Form Fields with Dashboard Landing</name>
  <files>
    client/src/components/auth/AuthModal.tsx
    client/src/components/mudra/MudraShell.tsx
  </files>
  <action>
    1. Update `AuthModal.tsx` form state:
       - Add `password` state (`type="password"`).
       - Ensure `email`, `password`, and `displayName` (pseudonym) are present and required in the form.
       - Add validation rules:
         * Valid email address containing '@' and domain.
         * Password at least 6 characters.
         * Pseudonym at least 3 alphanumeric/underscore characters.
       - Include clear labels: "Email Address", "Password", "Leaderboard Pseudonym".
       - In `signin` mode, ensure all 3 fields (email, password, pseudonym) are verified.
    2. Update post-authentication redirection:
       - In `AuthModal.tsx`, on successful submission, invoke `onSuccess({ email, displayName })`.
       - In `MudraShell.tsx` and `AuthModal.tsx`, use Next.js `useRouter` to push `/dashboard` immediately upon authentication.
       - Store authenticated session in `localStorage.setItem('mudra_user', JSON.stringify({ email, displayName }))`.
       - If Supabase auth session is active, subscribe via `supabase.auth.onAuthStateChange` in `MudraShell.tsx` to automatically sync user session and navigate to `/dashboard`.
  </action>
  <verify>
    npm test
  </verify>
  <done>
    Sign-in and registration forms validate email, password, and pseudonym; upon authentication, user automatically lands on /dashboard.
  </done>
</task>

</tasks>

<must_haves>
After all tasks complete, verify:
- [ ] Email, password, and pseudonym fields are rendered and validated.
- [ ] Google OAuth is integrated with `/dashboard` redirect.
- [ ] Successful sign-in lands directly on `/dashboard`.
- [ ] Pillar 4 statutory audit checks continue to pass cleanly.
</must_haves>

<success_criteria>
- [ ] Form submission enforces email, password (>= 6 chars), and pseudonym (>= 3 chars).
- [ ] Clicking Google OAuth triggers Supabase OAuth flow targeting `/dashboard`.
- [ ] Zero build or test errors in `npm test` and `pytest server/tests/`.
</success_criteria>
