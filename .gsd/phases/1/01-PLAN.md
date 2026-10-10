---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - docs/data-licensing/enquiries.md
  - docs/decisions.md
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Data licensing enquiries are prepared with verified text and logged in a tracking register"
    - "API error codes, status formats, and architectural decisions for Person B are frozen in repository docs"
  artifacts:
    - docs/data-licensing/enquiries.md
    - docs/decisions.md
---

# Plan 1.1: Data Licensing Enquiries & Contract Synchronization

<objective>
Initiate the mandatory Day 1 legal/data licensing inquiries to NSE Data & Analytics, BSE, and commercial vendors per PRD Section 8.2 and Proposal Section 18. Synchronize architectural decisions and ensure API error contracts are frozen between Person A and Person B.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- docs/api.md
- .gsd/DECISIONS.md
- .gsd/phases/1/RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Draft and log formal data-licensing enquiries</name>
  <files>docs/data-licensing/enquiries.md</files>
  <action>
    Create `docs/data-licensing/enquiries.md` containing the formal communication templates and tracking table for exchange and vendor enquiries.
    
    Steps:
    1. Populate the table tracking targets: NSE Data and Analytics Ltd., BSE Limited, and two market data API vendors.
    2. Include fields: Recipient, Contact Email, Date Sent, Status (Pending / In Review / Approved / Declined), Fee Quoted, Terms Constraints.
    3. Include the exact standard enquiry email draft as specified in Proposal Section 18:
       - Educational non-commercial simulator context.
       - Querying display permissions for EOD / 15-min delayed equity prices with attribution.
       - Inquiring whether educational exemptions or low-tier pricing exist.
    
    AVOID: Relying on unofficial scrapers or assuming exchange data is free for public display.
    USE: Explicit written tracking register to satisfy PRD Requirement LR-4 & DR-3.
  </action>
  <verify>
    Test-Path "docs/data-licensing/enquiries.md"
  </verify>
  <done>
    `docs/data-licensing/enquiries.md` exists, containing structured tracking records and verbatim enquiry templates.
  </done>
</task>

<task type="auto">
  <name>Synchronize architectural decisions and freeze Person B contract specifications</name>
  <files>docs/decisions.md</files>
  <action>
    Update `docs/decisions.md` (or synchronize with `.gsd/DECISIONS.md`) to formally document Person B's Day 1 backend decisions:
    1. ADR-004: Security Definer Stored Procedures for Order Placement (browser cannot mutate money tables directly).
    2. ADR-005: 10% Cash Reservation Buffer on Market Buy Orders (protects against intraday close drift).
    3. ADR-006: 50-Stock Static CSV Seed with Swappable Data Adapter Pattern (enables zero-cost offline development).
    4. ADR-007: Standardized Machine-Readable Error Payload Format (`{ error: { code, message, request_id } }`).
    
    AVOID: Ambiguous error formats or ad-hoc table mutations from the frontend client.
    USE: Structured ADR records with Context, Decision, and Consequences.
  </action>
  <verify>
    Select-String -Path "docs/decisions.md" -Pattern "ADR-004", "ADR-005", "ADR-006"
  </verify>
  <done>
    `docs/decisions.md` contains ADR-001 through ADR-007 with all backend architectural decisions formalized.
  </done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `docs/data-licensing/enquiries.md` exists with tracking table and draft text
- [ ] `docs/decisions.md` records ADR-004, ADR-005, ADR-006, and ADR-007
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Contracts completely synchronized for Week 1
</success_criteria>
