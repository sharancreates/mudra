"""
Mudra Section 15.1 Pre-Launch Checklist & "No Real Money" Statutory Audit (Python 3.10+)
Conformance: PRD Section 15.1, Section 15.2, Milestone M2 Launch Readiness

Pillars Audited:
1. "No Real Money" Gateway & Banking Scan: Proves 0 payment gateway or banking credentials exist.
2. "No Reset" Capital Integrity Scan: Confirms zero cash injection or reset cheat endpoints.
3. Zero Float Financial Precision: Confirms integer paise arithmetic across models and schemas.
4. Statutory Legal Disclaimers: Validates SEBI disclaimers, 18+ gate, and DPDP compliance in UI.
5. Security Definer & Table RLS Defenses: Confirms stored procedure defenses against client tampering.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import sys
from typing import Any, Dict, List, Tuple


FORBIDDEN_GATEWAY_PATTERNS = [
    r"\brazorpay\b",
    r"\bstripe\b",
    r"\bcashfree\b",
    r"\bpaytm\b",
    r"\bphonepe\b",
    r"\bbilldesk\b",
    r"\bpaypal\b",
]

FORBIDDEN_BANKING_PII_PATTERNS = [
    r"\bpan_number\b",
    r"\baadhaar\b",
    r"\bbank_account\b",
    r"\bifsc_code\b",
    r"\bdemat_id\b",
    r"\bcredit_card\b",
    r"\bcvv\b",
]

FORBIDDEN_RESET_PATTERNS = [
    r"\bdef\s+reset_wallet\b",
    r"\bdef\s+top_up\b",
    r"\bdef\s+add_cash\b",
    r"\bdef\s+deposit_funds\b",
    r"\bdef\s+withdraw_cash\b",
    r"@.*\.post\(['\"].*reset_wallet",
    r"@.*\.post\(['\"].*top_up",
    r"@.*\.post\(['\"].*add_cash",
]


def resolve_repo_root(hint: str | None = None) -> Path:
    """Finds root of repository based on known anchor files (.gsd or package.json)."""
    candidates = [
        Path(hint).resolve() if hint else None,
        Path.cwd(),
        Path(__file__).resolve().parents[3],
        Path(__file__).resolve().parents[2],
    ]
    for c in candidates:
        if c and (c / ".gsd").exists() and (c / "package.json").exists():
            return c
    return Path.cwd()


def scan_files_for_patterns(
    root_dir: Path,
    include_exts: List[str],
    patterns: List[str],
    exclude_dirs: List[str],
    exclude_files: List[str] | None = None,
) -> List[Dict[str, Any]]:
    """Recursively scans files matching exts against regex patterns."""
    violations: List[Dict[str, Any]] = []
    exclude_files_set = set(exclude_files or [])
    compiled_patterns = [re.compile(p, re.IGNORECASE) for p in patterns]

    for root, dirs, files in os.walk(root_dir):
        # Exclude ignored directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith(".")]

        for fname in files:
            if fname in exclude_files_set:
                continue

            p = Path(root) / fname
            if not any(fname.endswith(ext) for ext in include_exts):
                continue

            try:
                content = p.read_text(encoding="utf-8", errors="ignore")
                for line_no, line in enumerate(content.splitlines(), start=1):
                    for idx, pat in enumerate(compiled_patterns):
                        if pat.search(line):
                            violations.append({
                                "file": str(p.relative_to(root_dir)),
                                "line_number": line_no,
                                "matched_pattern": patterns[idx],
                                "line_snippet": line.strip()[:120],
                            })
            except Exception:
                continue

    return violations


def audit_pillar_1_no_real_money(repo_root: Path) -> Dict[str, Any]:
    """Pillar 1: Scans client, server, and migrations for real money or banking rails."""
    targets = [
        (repo_root / "client" / "src", ["tests", "__tests__", "mocks", "fixtures", "terms"]),
        (repo_root / "server" / "app", ["tests", "__tests__", "mocks", "fixtures", "scripts"]),
        (repo_root / "supabase" / "migrations", ["tests"]),
    ]

    all_violations: List[Dict[str, Any]] = []
    patterns = FORBIDDEN_GATEWAY_PATTERNS + FORBIDDEN_BANKING_PII_PATTERNS

    for target_dir, excludes in targets:
        if target_dir.exists():
            v = scan_files_for_patterns(
                root_dir=target_dir,
                include_exts=[".ts", ".tsx", ".py", ".sql"],
                patterns=patterns,
                exclude_dirs=excludes,
                exclude_files=["launch_audit.py"],
            )
            all_violations.extend(v)

    # Check package dependencies
    pkg_path = repo_root / "client" / "package.json"
    req_path = repo_root / "server" / "requirements.txt"
    dep_violations = []

    for dep_file in (pkg_path, req_path):
        if dep_file.exists():
            text = dep_file.read_text(encoding="utf-8").lower()
            for gw in ["razorpay", "stripe", "cashfree", "paytm", "phonepe", "paypal"]:
                if gw in text:
                    dep_violations.append(f"Forbidden dependency '{gw}' found in {dep_file.name}")

    passed = len(all_violations) == 0 and len(dep_violations) == 0
    return {
        "pillar": "1. 'No Real Money' Gateway & Banking Scan",
        "passed": passed,
        "violations_count": len(all_violations) + len(dep_violations),
        "code_violations": all_violations,
        "dependency_violations": dep_violations,
    }


def audit_pillar_2_no_reset(repo_root: Path) -> Dict[str, Any]:
    """Pillar 2: Scans server routes for cheat/top-up endpoints."""
    server_app = repo_root / "server" / "app"
    violations: List[Dict[str, Any]] = []

    if server_app.exists():
        violations = scan_files_for_patterns(
            root_dir=server_app,
            include_exts=[".py"],
            patterns=FORBIDDEN_RESET_PATTERNS,
            exclude_dirs=["tests", "__tests__", "scripts"],
            exclude_files=["launch_audit.py"],
        )

    passed = len(violations) == 0
    return {
        "pillar": "2. 'No Reset' Capital Integrity Scan",
        "passed": passed,
        "violations_count": len(violations),
        "violations": violations,
    }


def audit_pillar_3_integer_paise(repo_root: Path) -> Dict[str, Any]:
    """Pillar 3: Verifies strict integer paise representations in schemas and math."""
    schemas_file = repo_root / "server" / "app" / "models" / "schemas.py"
    math_file = repo_root / "server" / "app" / "core" / "math.py"
    violations: List[str] = []

    if schemas_file.exists():
        text = schemas_file.read_text(encoding="utf-8")
        # Check that money fields are int
        for field in ["last_close_paise", "cash_paise", "reserved_paise", "cost_basis_paise", "equity_paise"]:
            match = re.search(rf"{field}:\s*([a-zA-Z]+)", text)
            if match and match.group(1) != "int":
                violations.append(f"Field {field} in schemas.py has non-int type: {match.group(1)}")

    if math_file.exists():
        text = math_file.read_text(encoding="utf-8")
        if "from typing import float" in text or "-> float:" in text:
            violations.append("server/app/core/math.py contains floating point return type signatures")

    passed = len(violations) == 0
    return {
        "pillar": "3. Zero Float Financial Precision Scan",
        "passed": passed,
        "violations_count": len(violations),
        "violations": violations,
    }


def audit_pillar_4_statutory_disclaimers(repo_root: Path) -> Dict[str, Any]:
    """Pillar 4: Validates SEBI disclaimers, 18+ declaration, and educational paper trading notices."""
    terms_file = repo_root / "client" / "src" / "app" / "terms" / "page.tsx"
    auth_file = repo_root / "client" / "src" / "components" / "auth" / "AuthModal.tsx"
    readme_file = repo_root / "README.md"

    checks: Dict[str, bool] = {
        "terms_page_exists": terms_file.exists(),
        "terms_has_sebi_unregistered_disclaimer": False,
        "terms_has_no_real_money_clause": False,
        "terms_has_zero_fiat_value_clause": False,
        "auth_modal_has_18_plus_declaration": False,
        "readme_has_no_real_money_creed": False,
    }

    if terms_file.exists():
        raw_t = terms_file.read_text(encoding="utf-8").lower()
        clean_t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", raw_t))
        # Check for SEBI unregistered disclosure
        checks["terms_has_sebi_unregistered_disclaimer"] = "sebi" in clean_t and (
            "not a broker" in clean_t or "not a registered" in clean_t or "not registered" in clean_t
        )
        checks["terms_has_no_real_money_clause"] = "no real money" in clean_t
        checks["terms_has_zero_fiat_value_clause"] = "zero" in clean_t and (
            "fiat" in clean_t or "cash value" in clean_t
        )

    if auth_file.exists():
        raw_a = auth_file.read_text(encoding="utf-8").lower()
        clean_a = re.sub(r"<[^>]+>", " ", raw_a)
        checks["auth_modal_has_18_plus_declaration"] = "18" in clean_a and (
            "simulation" in clean_a or "virtual" in clean_a
        )

    if readme_file.exists():
        raw_r = readme_file.read_text(encoding="utf-8").lower()
        checks["readme_has_no_real_money_creed"] = "no real money" in raw_r and "sebi" in raw_r

    passed = all(checks.values())
    failed_checks = [k for k, v in checks.items() if not v]

    return {
        "pillar": "4. Statutory Legal Disclaimers & Disclosures",
        "passed": passed,
        "checks": checks,
        "failed_checks": failed_checks,
    }


def audit_pillar_5_security_definer_defenses(repo_root: Path) -> Dict[str, Any]:
    """Pillar 5: Validates SECURITY DEFINER and revoked client write permissions in SQL migrations."""
    migration_1 = repo_root / "supabase" / "migrations" / "20261010000001_initial_schema.sql"
    migration_3 = repo_root / "supabase" / "migrations" / "20261010000003_rls_policies.sql"
    migration_4_root = repo_root / "supabase" / "migrations" / "20261010000004_place_order.sql"
    migration_4_server = repo_root / "server" / "supabase" / "migrations" / "20261010000004_place_order.sql"

    checks: Dict[str, bool] = {
        "migration_1_exists": migration_1.exists(),
        "migration_3_exists": migration_3.exists(),
        "wallets_cash_non_negative_constraint": False,
        "wallets_client_writes_revoked": False,
        "place_order_security_definer": False,
    }

    if migration_1.exists():
        m1 = migration_1.read_text(encoding="utf-8").lower()
        checks["wallets_cash_non_negative_constraint"] = "cash_paise >= 0" in m1

    if migration_3.exists():
        m3 = migration_3.read_text(encoding="utf-8").lower()
        checks["wallets_client_writes_revoked"] = "revoke" in m3 and "wallets" in m3 and "authenticated" in m3

    target_m4 = migration_4_server if migration_4_server.exists() else migration_4_root
    if target_m4.exists():
        m4 = target_m4.read_text(encoding="utf-8").lower()
        checks["place_order_security_definer"] = "security definer" in m4 and "place_order" in m4

    passed = all(checks.values())
    failed_checks = [k for k, v in checks.items() if not v]

    return {
        "pillar": "5. Security Definer & Table RLS Defenses",
        "passed": passed,
        "checks": checks,
        "failed_checks": failed_checks,
    }


def run_launch_audit(repo_root: Path | None = None) -> Dict[str, Any]:
    """Orchestrates full Section 15.1 pre-launch audit."""
    root = repo_root or resolve_repo_root()

    p1 = audit_pillar_1_no_real_money(root)
    p2 = audit_pillar_2_no_reset(root)
    p3 = audit_pillar_3_integer_paise(root)
    p4 = audit_pillar_4_statutory_disclaimers(root)
    p5 = audit_pillar_5_security_definer_defenses(root)

    pillars = [p1, p2, p3, p4, p5]
    all_passed = all(p["passed"] for p in pillars)

    return {
        "audit_name": "PRD Section 15.1 Pre-Launch Statutory & Operational Audit",
        "verdict": "PASSED" if all_passed else "FAILED",
        "repo_root": str(root),
        "pillars": pillars,
        "summary": {
            "total_pillars": len(pillars),
            "passed_pillars": sum(1 for p in pillars if p["passed"]),
            "failed_pillars": sum(1 for p in pillars if not p["passed"]),
        },
    }


def format_markdown_report(results: Dict[str, Any]) -> str:
    """Formats audit results as GitHub Flavored Markdown."""
    verdict_emoji = "[PASS]" if results["verdict"] == "PASSED" else "[FAIL]"
    md = [
        f"# {verdict_emoji} Mudra Section 15.1 Pre-Launch Checklist Audit Report",
        "",
        f"- **Verdict:** **{results['verdict']}**",
        f"- **Audited Repository:** `{results['repo_root']}`",
        f"- **Pillars Verified:** {results['summary']['passed_pillars']} / {results['summary']['total_pillars']}",
        "",
        "## Audit Pillars Summary",
        "",
        "| Pillar | Status | Findings |",
        "| :--- | :---: | :--- |",
    ]

    for p in results["pillars"]:
        status_tag = "**PASS**" if p["passed"] else "**FAIL**"
        name = p["pillar"]
        if p["passed"]:
            notes = "Clean - Zero violations"
        else:
            notes = f"Violations detected ({p.get('violations_count', len(p.get('failed_checks', [])))})"
        md.append(f"| {name} | {status_tag} | {notes} |")

    md.append("")
    md.append("---")
    md.append("*(Certified in strict compliance with Mudra PRD Section 15.1 & Milestone M2 Launch Criteria)*")
    return "\n".join(md)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mudra Section 15.1 Pre-Launch Checklist Audit")
    parser.add_argument("--repo-root", default=None, help="Root path of mudra repository")
    parser.add_argument("--json", dest="output_json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--markdown", dest="output_md", action="store_true", help="Output GitHub Markdown")

    args = parser.parse_args()
    root = resolve_repo_root(args.repo_root)

    results = run_launch_audit(root)

    if args.output_json:
        print(json.dumps(results, indent=2))
    elif args.output_md:
        print(format_markdown_report(results))
    else:
        print("=" * 70)
        print("MUDRA PRD SECTION 15.1 PRE-LAUNCH AUDIT REPORT")
        print("=" * 70)
        print(f"Repository Root : {results['repo_root']}")
        print(f"Overall Verdict : {results['verdict']}")
        print("-" * 70)
        for p in results["pillars"]:
            mark = "[OK]" if p["passed"] else "[FAIL]"
            print(f"{mark} {p['pillar']}")
            if not p["passed"]:
                print(f"     Details: {p}")
        print("=" * 70)

    sys.exit(0 if results["verdict"] == "PASSED" else 1)


if __name__ == "__main__":
    main()
