# DECISIONS.md — Architecture & Design Decisions

# ADR-001: Project Renaming to Mudra
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: The working title "StockSim India" was a placeholder. The project is officially named **Mudra**.
- **Decision**: Update all branding, documentation, and user-facing copy to "Mudra".

# ADR-002: Next-Close Execution Model
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: Real-time tick and intraday NSE data feeds require hefty commercial licensing tariffs (~₹1,00,000+ per medium) which violates the ₹0 budget constraint.
- **Decision**: mudra operates as an honest Closing-Price Simulator. Orders placed before 15:30 IST execute at that day's official closing price; orders placed later execute at the next day's close.

# ADR-003: Paise Representation of Currency
- **Date**: 2026-10-10
- **Status**: Accepted
- **Context**: Floating point math leads to rounding and penny/paise discrepancies in financial transactions.
- **Decision**: All money fields in the database and API payloads are stored in integer paise (`bigint`). Conversion to rupees occurs strictly at the presentation layer.
